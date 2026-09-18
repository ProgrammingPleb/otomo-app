import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
    id: int().primaryKey({autoIncrement: true}),
    key: text().notNull().unique(),
    value: text().notNull(),
});

export const channelsTable = sqliteTable("channels", {
    id: int().primaryKey({autoIncrement: true}),
    youtube_id: text().notNull().unique(),
    name: text().notNull(),
    profile_picture: text().notNull(),
    group_name: text(),
    inactive: int().notNull()
});

export const streamsTable = sqliteTable("streams", {
    id: int().primaryKey({autoIncrement: true}),
    channel_id: int().notNull().references(() => channelsTable.id, { onDelete: "cascade" }),
    title: text().notNull(),
    video_id: text().notNull().unique(),
    time: int().notNull(),
    ended: int().notNull()
});

export const favoritesTable = sqliteTable("favorites", {
    id: int().primaryKey({autoIncrement: true}),
    channel_id: int().unique().notNull().references(() => channelsTable.id, { onDelete: "cascade" })
});

export const lastCheckedTable = sqliteTable("last_checked", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull().unique(),
    time: int().notNull()
})
