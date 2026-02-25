const { getDb, initDb } = require('../../lib/db');
const { verifyToken, unauthorized } = require('../../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const decoded = verifyToken(req);
    if (!decoded) return unauthorized(res);

    try {
        await initDb();
        const db = getDb();

        if (req.method === 'GET') {
            const result = await db.execute({
                sql: 'SELECT id, title, constellation_json, reasoning_text, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
                args: [decoded.id]
            });

            const sessions = result.rows.map(s => ({
                id: s.id,
                title: s.title,
                constellationJson: s.constellation_json,
                reasoningText: s.reasoning_text,
                createdAt: s.created_at,
            }));

            return res.json({ success: true, data: sessions });
        }

        if (req.method === 'POST') {
            const { title, constellationJson, reasoningText, transcriptText } = req.body || {};

            if (!constellationJson) {
                return res.status(400).json({ success: false, error: '별자리 데이터가 필요합니다.' });
            }

            const id = uuidv4();

            await db.execute({
                sql: 'INSERT INTO sessions (id, user_id, title, constellation_json, reasoning_text, transcript_text) VALUES (?, ?, ?, ?, ?, ?)',
                args: [id, decoded.id, title || null, constellationJson, reasoningText || null, transcriptText || null]
            });

            return res.status(201).json({
                success: true,
                data: { id, title, constellationJson, reasoningText, createdAt: new Date().toISOString() }
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
};
