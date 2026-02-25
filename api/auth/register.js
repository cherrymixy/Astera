const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb, initDb } = require('../../lib/db');
const { createToken } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        await initDb();
        const db = getDb();
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: '이름, 이메일, 비밀번호는 필수입니다.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, error: '비밀번호는 6자 이상이어야 합니다.' });
        }

        const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: '이미 사용 중인 이메일입니다.' });
        }

        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute({
            sql: 'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
            args: [id, name, email, hashedPassword]
        });

        const token = createToken({ id, name, email });

        res.status(201).json({
            success: true,
            data: { token, user: { id, name, email } }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
};
