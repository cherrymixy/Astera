import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
            return;
        }

        // 중복 확인
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            res.status(409).json({ error: '이미 가입된 이메일입니다.' });
            return;
        }

        // 비밀번호 해싱
        const passwordHash = await bcrypt.hash(password, 10);

        // 사용자 생성
        const { data: user, error } = await supabase
            .from('users')
            .insert({ email, password_hash: passwordHash, name })
            .select('id, email, name, created_at')
            .single();

        if (error || !user) {
            res.status(500).json({ error: '회원가입에 실패했습니다.' });
            return;
        }

        // JWT 발급
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({ token, user });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
            return;
        }

        // 사용자 조회
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash, created_at')
            .eq('email', email)
            .single();

        if (error || !user) {
            res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // 비밀번호 확인
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
            return;
        }

        // JWT 발급
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        const { password_hash: _, ...safeUser } = user;
        res.json({ token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, created_at')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
            return;
        }

        res.json({ user });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

export default router;
