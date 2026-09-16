import { HolodexVideo } from "@/model/holodex";
import { SettingsData } from "@/model/settings";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import { channelsTable, settingsTable, streamsTable } from "../../db/schema";

export const DB_NAME = "otomo";
const expo = SQLite.openDatabaseSync(DB_NAME);
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

export async function setStreams(videos: HolodexVideo[]) {
    try {
        for (const video of videos) {
            if (video.type == "stream") {
                const channelFetch = await db.select({
                    id: channelsTable.youtube_id
                })
                    .from(channelsTable)
                    .where(eq(channelsTable.youtube_id, video.channel.id));
                let channelId = channelFetch[0].id;
                if (channelId === null) {
                    const channelAddResp = await db.insert(channelsTable).values({
                        youtube_id: video.channel.id,
                        name: video.channel.name,
                        profile_picture: video.channel.photo,
                        group_name: video.channel.suborg
                    }).returning({ insertedId: channelsTable.youtube_id });
                    channelId = channelAddResp[0].insertedId ?? "";
                }
                await db.insert(streamsTable).values({
                    channel_id: Number.parseInt(channelId),
                    title: video.title,
                    video_id: video.id,
                    time: video.start_actual != null ? video.start_actual : video.start_scheduled
                })
            }
        }
    } catch (e) {
        console.error("DB: Unable to get settings!", e);
    } finally {
        console.log("Added all streams!");
    }
}
