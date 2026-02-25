const { getDb, initDb } = require('../lib/db');

module.exports = async function handler(req, res) {
    const checks = {
        TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
        TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
        JWT_SECRET: !!process.env.JWT_SECRET,
        url_prefix: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.substring(0, 15) + '...' : 'NOT SET',
    };

    try {
        await initDb();
        const db = getDb();
        const result = await db.execute('SELECT 1 as ok');
        checks.db_connected = true;
        checks.db_result = result.rows[0];
    } catch (error) {
        checks.db_connected = false;
        checks.db_error = error.message;
    }

    res.json({ success: true, checks, timestamp: new Date().toISOString() });
};
