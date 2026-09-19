import { BackendChannel } from "@/model/backend";
import { HolodexVideo } from "@/model/holodex";
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
    videos: HolodexVideo[],
    onChannelNotFound: (channelId: string) => Promise<BackendChannel | undefined>
) {
    try {
        // Check for streams not in the current list and assume they have ended
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - 1);
        const dayStreamsRaw = await db.select({
            video_id: streamsTable.video_id
        }).from(streamsTable).where(gte(streamsTable.time, checkDate.getTime()));
        const dayStreams = dayStreamsRaw.map((video) => video.video_id);
        const currentLivestreams = videos.map((video) => video.id);
        for (const video of dayStreams) {
            if (!currentLivestreams.includes(video)) {
                await db.update(streamsTable).set({
                    ended: 1
                }).where(eq(streamsTable.video_id, video));
            }
        }

        // Now check and update streams that are live or upcoming
        for (const video of videos) {
            if (video.type == "stream") {
                const channelFetch = await db.select({
                    id: channelsTable.id
                })
                    .from(channelsTable)
                    .where(eq(channelsTable.youtube_id, video.channel.id));
                let channelId = channelFetch.length > 0 ? channelFetch[0].id : null;
                if (channelId === null) {
                    const channelData = await onChannelNotFound(video.channel.id);
                    if (!channelData) {
                        continue;       // TODO: Check if we can fallback to a sane backend
                    }
                    const channelAddResp = await db.insert(channelsTable).values({
                        youtube_id: video.channel.id,
                        name: channelData.name,
                        romaji: channelData.romaji,
                        profile_picture: channelData.profile_picture,
                        group_name: channelData.group,
                        inactive: 0,
                        is_group_channel: channelData.is_group_channel ? 1 : 0,
                        organization: channelData.organization
                    }).returning({ insertedId: channelsTable.id });
                    channelId = channelAddResp[0].insertedId ?? 0;
                }
                const epochTime = (video.start_actual != null ?
                    new Date(video.start_actual).getTime() :
                    new Date(video.start_scheduled ?? 0).getTime());
                await db.insert(streamsTable).values({
                    channel_id: channelId,
                    title: video.title,
                    video_id: video.id,
                    time: epochTime,
                    ended: 0
                }).onConflictDoUpdate({
                    target: streamsTable.video_id,
                    set: { title: video.title, time: epochTime }
                });
            }
        }
    } catch (e) {
        console.error("DB: Unable to set streams!", e);
    } finally {
        console.log("Added all streams!");
    }
}

export async function refreshChannels(channels: BackendChannel[]) {
    try {
        for (const channel of channels) {
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
        }
    } catch (e) {
        console.error("DB: Unable to set channels!", e);
    } finally {
        console.log("Added all channels!");
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
