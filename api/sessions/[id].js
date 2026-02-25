const { getDb, initDb } = require('../../lib/db');
const { verifyToken, unauthorized } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const decoded = verifyToken(req);
    if (!decoded) return unauthorized(res);

    try {
        await initDb();
        const db = getDb();
        const { id } = req.query;

        if (req.method === 'GET') {
            const result = await db.execute({
                sql: 'SELECT id, title, constellation_json, reasoning_text, transcript_text, created_at FROM sessions WHERE id = ? AND user_id = ?',
                args: [id, decoded.id]
            });

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: '별자리를 찾을 수 없습니다.' });
            }

            const s = result.rows[0];
            return res.json({
                success: true,
                data: {
                    id: s.id,
                    title: s.title,
                    constellationJson: s.constellation_json,
                    reasoningText: s.reasoning_text,
                    transcriptText: s.transcript_text,
                    createdAt: s.created_at,
                }
            });
        }

        if (req.method === 'DELETE') {
            await db.execute({
                sql: 'DELETE FROM sessions WHERE id = ? AND user_id = ?',
                args: [id, decoded.id]
            });

            return res.json({ success: true });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Session detail error:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
};
