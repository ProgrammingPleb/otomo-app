import * as SQLite from "expo-sqlite";

export const DB_NAME = "otomo";

export async function getConnection() {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL');
    await db.execAsync('PRAGMA foreign_keys = ON');

    return db;
}

export async function initDB() {
    const db = await getConnection();

    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                key TEXT NOT NULL UNIQUE,
                value TEXT NOT NULL
            );
        `);
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY,
                youtube_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                profile_picture TEXT NOT NULL,
                group_name TEXT
            );
        `);
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS streams (
                id INTEGER PRIMARY KEY,
                channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                thumbnail TEXT NOT NULL,
                time TEXT NOT NULL,
                ended BOOLEAN NOT NULL
            );
        `);
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY,
                channel_id INTEGER UNIQUE NOT NULL REFERENCES channels(id) ON DELETE CASCADE
            );
        `);
    } catch (e) {
        console.error("DB: Unable to init tables!", e);
    } finally {
        await db.closeAsync();
    }
}
