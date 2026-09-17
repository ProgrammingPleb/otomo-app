import { HolodexVideo } from "@/model/holodex";
import { SettingsData } from "@/model/settings";
import { eq, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { channelsTable, settingsTable, streamsTable } from "../../db/schema";

export const DB_NAME = "otomo";
export const expo = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true });
export const db = drizzle(expo);

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

export async function refreshStreams(videos: HolodexVideo[]) {
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
                    const channelAddResp = await db.insert(channelsTable).values({
                        youtube_id: video.channel.id,
                        name: video.channel.name,
                        profile_picture: video.channel.photo,
                        group_name: video.channel.suborg.slice(2).replace("EN ", "")
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
