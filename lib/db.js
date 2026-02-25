const { createClient } = require('@libsql/client');

let db = null;
let initialized = false;

function getDb() {
    if (!db) {
        if (process.env.TURSO_DATABASE_URL) {
            db = createClient({
                url: process.env.TURSO_DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN
            });
        } else {
            db = createClient({
                url: 'file:./data/astera.db'
            });
        }
    }
    return db;
}

async function initDb() {
    if (initialized) return;
    const client = getDb();

    await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT,
            constellation_json TEXT NOT NULL,
            reasoning_text TEXT,
            transcript_text TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    initialized = true;
}

module.exports = { getDb, initDb };
