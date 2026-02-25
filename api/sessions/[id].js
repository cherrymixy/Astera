const { getDb } = require('../../lib/db');
const { verifyToken, unauthorized } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const decoded = verifyToken(req);
    if (!decoded) return unauthorized(res);

    const db = getDb();
    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const { data, error } = await db
                .from('sessions')
                .select('id, title, constellation_json, reasoning_text, transcript_text, created_at')
                .eq('id', id)
                .eq('user_id', decoded.id)
                .single();

            if (error || !data) {
                return res.status(404).json({ success: false, error: '별자리를 찾을 수 없습니다.' });
            }

            return res.json({
                success: true,
                data: {
                    id: data.id,
                    title: data.title,
                    constellationJson: data.constellation_json,
                    reasoningText: data.reasoning_text,
                    transcriptText: data.transcript_text,
                    createdAt: data.created_at,
                }
            });
        }

        if (req.method === 'DELETE') {
            const { error } = await db
                .from('sessions')
                .delete()
                .eq('id', id)
                .eq('user_id', decoded.id);

            if (error) throw error;

            return res.json({ success: true });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('Session detail error:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
};
