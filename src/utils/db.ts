import { AppChannel, AppVideo } from "@/model/app";
import { SettingsData } from "@/model/settings";
import { eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { channelsTable, favoritesTable, lastCheckedTable, settingsTable, streamsTable } from "../../db/schema";

export const DB_NAME = "otomo";
export const expo = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true });
export const db = drizzle(expo);

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
        console.error("DB: Unable to get settings!", e);
    }
}

export async function getSettings() {
    const settings: SettingsData = {
        apiKey: ""
    };

    try {
        const data = await db.select({
            key: settingsTable.key,
            value: settingsTable.value
        }).from(settingsTable);

        for (const row of data) {
            switch (row.key) {
                case "apiKey":
                    settings.apiKey = row.value;
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
        await db.insert(settingsTable).values(
            { key: "apiKey", value: settings.apiKey }
        ).onConflictDoUpdate({
            target: settingsTable.key,
            set: { value: settings.apiKey }
        });
    } catch (e) {
        console.error("DB: Unable to get settings!", e);
    }
}

export async function refreshStreams(
    videos: AppVideo[],
    onChannelNotFound: (channelId: string) => Promise<AppChannel | undefined>
) {
    try {
        // Check for streams not in the current list and assume they have ended
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 1);
        const dayStreamsRaw = await db.select({
            video_id: streamsTable.video_id
        }).from(streamsTable).where(gte(streamsTable.time, checkDate.getTime()));
        const dayStreams = dayStreamsRaw.map((video) => video.video_id);
        const currentLivestreams = videos.map((video) => video.video_id);
        for (const video of dayStreams) {
            if (!currentLivestreams.includes(video)) {
                await db.update(streamsTable).set({
                    ended: 1
                }).where(eq(streamsTable.video_id, video));
            }
        }

        // Now check and update streams that are live or upcoming
        for (const video of videos) {
            const channelDbId = await getChannelDbId(video.channel.id);
            if (!channelDbId) {
                continue;       // Drop if for some reason the channel is still not in the DB
            }

            await db.insert(streamsTable).values({
                channel_id: channelDbId,
                title: video.title,
                video_id: video.video_id,
                time: video.time,
                ended: video.ended ? 1: 0
            }).onConflictDoUpdate({
                target: streamsTable.video_id,
                set: { title: video.title, time: video.time }
            });
        }
    } catch (e) {
        console.error("DB: Unable to set streams!", e);
    } finally {
        console.log("Added all streams!");
    }
}

export async function getChannelDbId(channelId: string) {
    try {
        const data = await db.select({ id: channelsTable.id }).from(channelsTable).where(eq(channelsTable.youtube_id, channelId));

        if (data.length < 1) {
            return;
        }

        return data[0].id;
    } catch (e) {
        console.error(`DB: Unable to get channel database ID! ${channelId}`, e);
    }
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

export async function refreshChannels(channels: AppChannel[]) {
    try {
        for (const channel of channels) {
            await updateOneChannel(channel);
        }
    } catch (e) {
        console.error("DB: Unable to set channels!", e);
    } finally {
        console.log("Added all channels!");
    }
}

export async function updateOneChannel(channel: AppChannel) {
    try {
        await db.insert(channelsTable).values({
            youtube_id: channel.id,
            name: channel.name,
            romaji: channel.romaji,
            profile_picture: channel.profile_picture,
            group_name: channel.group,
            inactive: channel.is_inactive ? 1 : 0,
            is_group_channel: channel.is_group_channel ? 1 : 0,
            organization: channel.organization
        }).onConflictDoUpdate({
            target: channelsTable.youtube_id,
            set: {
                name: channel.name,
                romaji: channel.romaji,
                profile_picture: channel.profile_picture,
                group_name: channel.group,
                inactive: channel.is_inactive ? 1 : 0,
                is_group_channel: channel.is_group_channel ? 1 : 0,
                organization: channel.organization
            }
        });
    } catch (e) {
        console.error("DB: Unable to set channel!", e);
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
