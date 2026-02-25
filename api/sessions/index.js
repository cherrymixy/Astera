const { getDb } = require('../../lib/db');
const { verifyToken, unauthorized } = require('../../lib/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const decoded = verifyToken(req);
    if (!decoded) return unauthorized(res);

    const db = getDb();

    try {
        if (req.method === 'GET') {
            const { data, error } = await db
                .from('sessions')
                .select('id, title, constellation_json, reasoning_text, created_at')
                .eq('user_id', decoded.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const sessions = (data || []).map(s => ({
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

            const { error } = await db
                .from('sessions')
                .insert({
                    id,
                    user_id: decoded.id,
                    title: title || null,
                    constellation_json: constellationJson,
                    reasoning_text: reasoningText || null,
                    transcript_text: transcriptText || null,
                });

            if (error) throw error;

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
