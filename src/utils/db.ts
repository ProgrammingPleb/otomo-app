import { AppChannel, AppVideo, NotificationStatus } from "@/model/app";
import { SettingsData } from "@/model/settings";
import { and, eq, gte, inArray, isNull, lt, notInArray, notLike, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";
import * as SQLite from "expo-sqlite";
import { channelsTable, favoritesTable, lastCheckedTable, settingsTable, streamsTable } from "../../db/schema";

export const DB_NAME = "otomo";
export const expo = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true });
export const db = drizzle(expo);

/**
 * A helper script that is used to inform conflict updates that the data that is incoming
 * should be used instead.
 * @param column The table's column that is being updated
 * @returns The SQL statement used to inform the usage of the incoming data
 */
function excluded(column: SQLiteColumn) {
    return sql`excluded.${sql.identifier(column.name)}`;
}

export const DEFAULT_SETTINGS: SettingsData = {
    apiKey: "",
    notificationsEnabled: false,
    notificationsPrompted: false,
    onboardingDone: false,
    lastOpenedNotification: "",
};
interface StreamDbJoin {
    streams: typeof streamsTable.$inferSelect,
    channels: typeof channelsTable.$inferSelect
}

export function activeStreamsFilter(currentTime: number) {
    return db.select().from(streamsTable)
        .innerJoin(channelsTable, eq(streamsTable.channel_id, channelsTable.id))
        .where(
            and(
                eq(streamsTable.ended, 0),  // Filter the streams that have ended
                and(
                    notLike(streamsTable.title, "%Station"),  // Filter streams that are stations
                    or(
                        gte(streamsTable.start_scheduled, currentTime - (3 * 24 * 60 * 60 * 1000)),        // but make sure only ones that are confirmed to be stations (stream longer than 3 days)
                        isNull(streamsTable.start_scheduled)
                    ),
                    lt(streamsTable.start_scheduled, currentTime + 7 * 24 * 60 * 60 * 1000)           // and also filter out waiting rooms
                )
            )
        );
}

export function streamDbToAppVideo(row: StreamDbJoin): AppVideo {
    const {
        id: unusedId,
        youtube_id: channel_id,
        inactive,
        is_group_channel,
        group_name,
        ...channel
    } = row.channels;

    return {
        title: row.streams.title,
        video_id: row.streams.video_id,
        start_scheduled: row.streams.start_scheduled,
        start_actual: row.streams.start_actual,
        thumbhash: row.streams.thumbhash,
        ended: row.streams.ended == 1,
        notification: row.streams.notification,
        channel: {
            id: channel_id,
            ...channel,
            group: group_name,
            is_inactive: inactive == 1,
            is_group_channel: is_group_channel == 1
        }
    }
}

export async function isRefreshPossible(name: string) {
    const currentTimeMillis = new Date().getTime();

    try {
        const timeCheck = await db.select({ time: lastCheckedTable.time })
            .from(lastCheckedTable).where(eq(lastCheckedTable.name, name));
        if (timeCheck.length > 0 && timeCheck[0].time < currentTimeMillis) {    // If exists, then check if the time has passed.
            return true;
        }
        if (timeCheck.length < 1) {     // If does not exist, assume no checks for this action yet.
            return true;
        }
    } catch (e) {
        console.error(`DB: Unable to get last checked date for "${name}"`, e);
    }

    return false;
}

export async function updateLastCheckedTime(name: string, timeoutHours: number) {
    const currentTimeMillis = new Date().getTime();
    const timeoutMillis = timeoutHours * 60 * 60 * 1000;

    try {
        await db.insert(lastCheckedTable).values({
            name: name,
            time: currentTimeMillis + timeoutMillis
        }).onConflictDoUpdate({
            target: lastCheckedTable.name,
            set: { time: currentTimeMillis + timeoutMillis }
        });
    } catch (e) {
        console.error(`DB: Unable to update last checked time for ${name}!`, e);
    }
}

export async function getSettings() {
    const settings: SettingsData = { ...DEFAULT_SETTINGS };

    try {
        const data = await db.select({
            key: settingsTable.key,
            value: settingsTable.value
        }).from(settingsTable);

        for (const row of data) {
            const keyName = row.key as keyof SettingsData;
            switch (keyName) {
                case "apiKey":
                    settings.apiKey = row.value;
                    break;
                case "lastOpenedNotification":
                    settings.lastOpenedNotification = row.value;
                    break;
                case "notificationsEnabled":
                    settings.notificationsEnabled = row.value == "1";
                    break;
                case "notificationsPrompted":
                    settings.notificationsPrompted = row.value == "1";
                    break;
                case "onboardingDone":
                    settings.onboardingDone = row.value == "1";
                    break;
            }
        }

        return settings;
    } catch (e) {
        console.error("DB: Unable to get settings!", e);
    }

    return settings;
}

export async function setSettings(settings: SettingsData) {
    try {
        const settingsObject = Object.entries(settings);

        for (const option of settingsObject) {
            await db.insert(settingsTable).values(
                { key: option[0], value: typeof option[1] == "boolean" ? option[1] ? "1" : "0" : option[1] }
            ).onConflictDoUpdate({
                target: settingsTable.key,
                set: { value: typeof option[1] == "boolean" ? option[1] ? "1" : "0" : option[1] }
            });
        }
    } catch (e) {
        console.error("DB: Unable to set settings!", e);
    }
}

export async function refreshStreams(
    videos: AppVideo[]
) {
    try {
        const currentLivestreams = videos.map((video) => video.video_id);
        const channelIdMap = await getChannelDbYouTubeIds();
        const filteredVideos = videos.filter((video) => channelIdMap.has(video.channel.id));

        // An empty list will now make every stream ended
        // TODO: Review back if needs review
        db.transaction((tx) => {
            tx.update(streamsTable).set({
                ended: 1
            }).where(
                and(
                    eq(streamsTable.ended, 0),
                    notInArray(streamsTable.video_id, currentLivestreams)
                )
            ).run();

            if (filteredVideos.length > 0) {
                tx.insert(streamsTable).values(filteredVideos.map((video) => ({
                    channel_id: channelIdMap.get(video.channel.id)!,
                    title: video.title,
                    video_id: video.video_id,
                    thumbhash: video.thumbhash,
                    start_scheduled: video.start_scheduled ?? null,
                    start_actual: video.start_actual ?? null,
                    ended: video.ended ? 1 : 0
                }))).onConflictDoUpdate({
                    target: streamsTable.video_id,
                    set: {
                        title: excluded(streamsTable.title),
                        thumbhash: excluded(streamsTable.thumbhash),
                        start_scheduled: excluded(streamsTable.start_scheduled),
                        start_actual: excluded(streamsTable.start_actual),
                        ended: excluded(streamsTable.ended)
                    }
                }).run();
            }
        });

        console.log("Added all streams!");
    } catch (e) {
        console.error("DB: Unable to set streams!", e);
    }
}

export async function getLatestDbStreams() {
    const data = await activeStreamsFilter(Date.now());

    return data.map((row) => streamDbToAppVideo(row));
}

export async function getChannelDbYouTubeIds() {
    try {
        const data = await db.select({
            id: channelsTable.id,
            youtubeId: channelsTable.youtube_id
        }).from(channelsTable);

        return new Map<string, number>(data.map((item) => [item.youtubeId, item.id]));
    } catch (e) {
        console.error(`DB: Unable to get channel database IDs!`, e);
    }

    return new Map<string, number>();
}

export async function getChannelData(channelId: string): Promise<AppChannel | undefined> {
    try {
        const data = await db.select().from(channelsTable).where(eq(channelsTable.youtube_id, channelId));

        if (data.length < 1) {
            return;
        }

        const { id, group_name, inactive, is_group_channel, ...channel } = data[0];
        return {
            id: data[0].youtube_id,
            group: group_name,
            is_inactive: inactive == 1,
            is_group_channel: is_group_channel == 1,
            ...channel
        };
    } catch (e) {
        console.error(`DB: Unable to get channel database data! ${channelId}`, e);
    }
}

export async function getFavoritedChannels(): Promise<AppChannel[] | undefined> {
    try {
        const data = await db.select().from(favoritesTable)
            .innerJoin(channelsTable, eq(favoritesTable.channel_id, channelsTable.id));

        if (data.length < 1) {
            return;
        }

        return data.map((row) => {
            const { id, youtube_id, group_name, inactive, is_group_channel, ...channel } = row.channels;

            return {
                id: youtube_id,
                group: group_name,
                is_inactive: inactive == 1,
                is_group_channel: is_group_channel == 1,
                ...channel
            };
        });
    } catch (e) {
        console.error("DB: Unable to get favorited channels!", e);
    }
}

export async function refreshChannels(channels: AppChannel[]) {
    if (channels.length < 1) {
        return;
    }

    try {
        await db.insert(channelsTable).values(channels.map((channel) => ({
            youtube_id: channel.id,
            name: channel.name,
            romaji: channel.romaji,
            profile_picture: channel.profile_picture,
            profile_hash: channel.profile_hash,
            group_name: channel.group,
            major_group: channel.major_group,
            inactive: channel.is_inactive ? 1 : 0,
            is_group_channel: channel.is_group_channel ? 1 : 0,
            organization: channel.organization,
            banner: channel.banner,
            banner_hash: channel.banner_hash,
        }))).onConflictDoUpdate({
            target: channelsTable.youtube_id,
            set: {
                name: excluded(channelsTable.name),
                romaji: excluded(channelsTable.romaji),
                profile_picture: excluded(channelsTable.profile_picture),
                profile_hash: excluded(channelsTable.profile_hash),
                group_name: excluded(channelsTable.group_name),
                major_group: excluded(channelsTable.major_group),
                inactive: excluded(channelsTable.inactive),
                is_group_channel: excluded(channelsTable.is_group_channel),
                organization: excluded(channelsTable.organization),
                banner: excluded(channelsTable.banner),
                banner_hash: excluded(channelsTable.banner_hash),
            }
        });

        console.log("Added all channels!");
    } catch (e) {
        console.error("DB: Unable to set channels!", e);
    }
}

export async function updateFavorites(channelId: number, action: "add" | "remove") {
    try {
        if (action === "add") {
            await db.insert(favoritesTable).values({
                channel_id: channelId
            });
        } else if (action === "remove") {
            await db.delete(favoritesTable).where(eq(favoritesTable.channel_id, channelId));
        }
    } catch (e) {
        console.error("DB: Unable to set favorites!", e);
    }
}

export async function updateStreamNotification(streamId: string, status: NotificationStatus) {
    try {
        await db.update(streamsTable).set({ notification: status })
            .where(eq(streamsTable.video_id, streamId));
    } catch (e) {
        console.error(`DB: Unable to set notification status "${status}" on stream "${streamId}"!`, e);
    }
}

export async function resetUpcomingNotifications(streamIds: string[]) {
    try {
        await db.update(streamsTable).set({
            notification: "none"
        }).where(inArray(streamsTable.video_id, streamIds));
    } catch (e) {
        console.error("DB: Unable to set notification status \"none\" on resetting streams!", e);
    }
}
