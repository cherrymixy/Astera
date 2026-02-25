import { Router, Response } from 'express';
import { supabase } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// 모든 세션 라우트는 인증 필요
router.use(authMiddleware);

// GET /api/sessions — 내 세션 목록 (최신순)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('id, title, constellation_json, reasoning_text, created_at')
            .eq('user_id', req.userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            res.status(500).json({ error: '세션 목록을 불러올 수 없습니다.' });
            return;
        }

        // snake_case → camelCase 변환
        const sessions = (data || []).map(s => ({
            id: s.id,
            title: s.title,
            constellationJson: s.constellation_json,
            reasoningText: s.reasoning_text,
            createdAt: s.created_at,
        }));

        res.json({ sessions });
    } catch (err) {
        console.error('List sessions error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// GET /api/sessions/:id — 세션 상세
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.userId)
            .single();

        if (error || !data) {
            res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
            return;
        }

        const session = {
            id: data.id,
            title: data.title,
            constellationJson: data.constellation_json,
            reasoningText: data.reasoning_text,
            transcriptText: data.transcript_text,
            createdAt: data.created_at,
        };

        res.json({ session });
    } catch (err) {
        console.error('Get session error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/sessions — 새 세션 생성
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { title, constellationJson, reasoningText, transcriptText } = req.body;

        if (!constellationJson) {
            res.status(400).json({ error: '별자리 데이터가 필요합니다.' });
            return;
        }

        const { data, error } = await supabase
            .from('sessions')
            .insert({
                user_id: req.userId,
                title,
                constellation_json: constellationJson,
                reasoning_text: reasoningText || null,
                transcript_text: transcriptText || null,
            })
            .select('id, title, constellation_json, reasoning_text, created_at')
            .single();

        if (error || !data) {
            console.error('Insert error:', error);
            res.status(500).json({ error: '세션 저장에 실패했습니다.' });
            return;
        }

        const session = {
            id: data.id,
            title: data.title,
            constellationJson: data.constellation_json,
            reasoningText: data.reasoning_text,
            createdAt: data.created_at,
        };

        res.status(201).json({ session });
    } catch (err) {
        console.error('Create session error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// DELETE /api/sessions/:id — 세션 삭제
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.userId);

        if (error) {
            res.status(500).json({ error: '삭제에 실패했습니다.' });
            return;
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Delete session error:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

export default router;
