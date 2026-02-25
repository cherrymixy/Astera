import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Star, Connection, ConstellationData } from '../types';
import { placeStar, autoConnect, extractKeywords, generateTitle } from '../lib/constellationEngine';
import { fetchAPI } from '../api/client';
import ConstellationCanvas from '../components/ConstellationCanvas';
import { SpeechRecognitionService } from '../lib/stt';

interface LocationState {
    objectName?: string;
    objectDescription?: string;
    objectPrompt?: string;
    objectImage?: string;
}

export default function NewSessionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState | null;

    const [stars, setStars] = useState<Star[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [keywordInput, setKeywordInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastAddedKeyword, setLastAddedKeyword] = useState<string | null>(null);
    const [objectPrompt, setObjectPrompt] = useState<string | null>(null);

    const sttRef = useRef<SpeechRecognitionService | null>(null);
    const processedWordsRef = useRef<Set<string>>(new Set());
    const transcriptRef = useRef<string>('');

    // 별 추가
    const addStar = useCallback((keyword: string) => {
        const trimmed = keyword.trim();
        if (trimmed.length < 2) return;
        if (processedWordsRef.current.has(trimmed)) return;
        processedWordsRef.current.add(trimmed);

        setStars(prev => {
            const newStar = placeStar(trimmed, prev);
            const updated = [...prev, newStar];
            setConnections(autoConnect(updated));
            return updated;
        });
        setLastAddedKeyword(trimmed);
        setTimeout(() => setLastAddedKeyword(null), 2000);
    }, []);

    // 텍스트 입력으로 별 추가
    const handleAddKeyword = () => {
        if (!keywordInput.trim()) return;
        const keywords = keywordInput.split(/[,，、\s]+/).filter(k => k.trim().length >= 2);
        keywords.forEach(k => addStar(k));
        setKeywordInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddKeyword();
        }
    };

    // AI 키워드 추출 (문장 완성 시 호출)
    const extractWithAI = useCallback(async (sentence: string) => {
        try {
            const existingKeywords = stars.map(s => s.keyword);
            const res = await fetchAPI<{ success: boolean; data: { keywords: string[] } }>(
                '/api/ai/extract-keywords',
                {
                    method: 'POST',
                    body: JSON.stringify({ sentence, existingKeywords }),
                }
            );
            if (res.data.keywords?.length > 0) {
                res.data.keywords.forEach(k => addStar(k));
            }
        } catch (err) {
            // AI 실패 시 로컬 fallback
            console.warn('AI 추출 실패, 로컬 fallback:', err);
            const keywords = extractKeywords(sentence);
            keywords.forEach(k => addStar(k));
        }
    }, [stars, addStar]);

    // 음성 녹음
    const handleToggleRecording = async () => {
        if (isRecording) {
            sttRef.current?.stop();
            setIsRecording(false);
        } else {
            if (!SpeechRecognitionService.isSupported()) {
                alert('이 브라우저에서는 음성 인식을 지원하지 않습니다. 텍스트로 입력해주세요.');
                return;
            }
            try {
                const stt = new SpeechRecognitionService();
                stt.start((sentence, fullText) => {
                    transcriptRef.current = fullText;
                    // AI로 핵심 키워드 추출
                    extractWithAI(sentence);
                });
                sttRef.current = stt;
                setIsRecording(true);
            } catch (error) {
                alert('마이크 접근 권한이 필요합니다.');
                console.error(error);
            }
        }
    };

    // 저장 (AI 사유 생성 + API 호출)
    const handleFinish = async () => {
        if (stars.length === 0) {
            alert('키워드를 최소 1개 이상 추가해주세요.');
            return;
        }

        setSaving(true);
        sttRef.current?.stop();
        setIsRecording(false);

        const constellation: ConstellationData = { stars, connections };
        const title = generateTitle(stars);
        const keywords = stars.map(s => s.keyword);

        // AI로 사유 + 철학자 생성
        let reasoningText = '';
        try {
            const aiRes = await fetchAPI<{ success: boolean; data: { reasoning: string; philosophers: any[] } }>(
                '/api/ai/generate-reasoning',
                {
                    method: 'POST',
                    body: JSON.stringify({ keywords, transcript: transcriptRef.current }),
                }
            );
            reasoningText = aiRes.data.reasoning;
            // 철학자 정보를 constellation에 포함
            (constellation as any).philosophers = aiRes.data.philosophers;
        } catch (err) {
            console.warn('AI 사유 생성 실패:', err);
            reasoningText = `${keywords.join(', ')} — 이 별들이 만드는 별자리는 당신만의 사유 지도이다.`;
        }

        try {
            const res = await fetchAPI<{ success: boolean; data: { id: string } }>('/api/sessions', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    constellationJson: JSON.stringify(constellation),
                    reasoningText,
                    transcriptText: transcriptRef.current,
                }),
            });
            navigate(`/session/${res.data.id}`);
        } catch (err: any) {
            alert('저장에 실패했습니다: ' + (err.message || ''));
            setSaving(false);
        }
    };

    useEffect(() => {
        return () => { sttRef.current?.stop(); };
    }, []);

    // 카메라에서 인식된 사물이 있으면 첫 번째 별로 추가
    useEffect(() => {
        if (locationState?.objectName) {
            addStar(locationState.objectName);
            setObjectPrompt(locationState.objectPrompt || null);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#04040f' }}>
            {/* 헤더 */}
            <div style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(10, 10, 30, 0.8)',
                backdropFilter: 'blur(12px)',
            }}>
                <Link to="/home" style={{
                    color: 'rgba(200, 210, 255, 0.6)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                }}>
                    ← 돌아가기
                </Link>
                <div style={{ fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.5)' }}>
                    ⭐ {stars.length}개의 별
                </div>
            </div>

            {/* 메인 캔버스 영역 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', position: 'relative' }}>
                {/* 사물 인식 프롬프트 */}
                {objectPrompt && (
                    <div style={{
                        width: '100%', maxWidth: '600px', textAlign: 'center',
                        marginBottom: '1rem', padding: '1rem 1.5rem',
                        background: 'rgba(100, 130, 255, 0.06)',
                        borderRadius: '14px', border: '1px solid rgba(100, 130, 255, 0.12)',
                    }}>
                        <div style={{
                            fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7,
                            color: 'rgba(220, 230, 255, 0.85)', fontFamily: "'Noto Serif KR', serif",
                        }}>
                            "{objectPrompt}"
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(200, 210, 255, 0.3)', marginTop: '0.5rem' }}>
                            마이크로 생각을 말하거나 키워드를 입력해보세요
                        </div>
                    </div>
                )}

                <div style={{ width: '100%', maxWidth: '900px', position: 'relative' }}>
                    <ConstellationCanvas stars={stars} connections={connections} animated={true} interactive={true} />

                    {lastAddedKeyword && (
                        <div style={{
                            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                            padding: '0.5rem 1.25rem',
                            background: 'rgba(100, 130, 255, 0.15)',
                            borderRadius: '20px',
                            border: '1px solid rgba(100, 130, 255, 0.3)',
                            color: '#c0d0ff', fontSize: '0.85rem',
                            animation: 'fadeInUp 0.5s ease',
                            backdropFilter: 'blur(8px)', pointerEvents: 'none',
                        }}>
                            ✨ {lastAddedKeyword}
                        </div>
                    )}

                    {stars.length === 0 && (
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            textAlign: 'center', color: 'rgba(200, 210, 255, 0.3)', pointerEvents: 'none',
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌌</div>
                            <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                                마이크로 생각을 말하거나<br />아래에 키워드를 입력해보세요
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 컨트롤 */}
                <div style={{
                    marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '1rem', width: '100%', maxWidth: '600px',
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input
                            type="text"
                            value={keywordInput}
                            onChange={e => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="키워드를 입력하세요 (쉼표로 구분)"
                            style={{
                                flex: 1, padding: '0.875rem 1.25rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px', color: '#e0e8ff', fontSize: '0.95rem',
                                outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.4)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                        />
                        <button
                            onClick={handleAddKeyword}
                            style={{
                                padding: '0.875rem 1.25rem',
                                background: 'rgba(100, 130, 255, 0.15)',
                                border: '1px solid rgba(100, 130, 255, 0.3)',
                                borderRadius: '12px', color: '#c0d0ff', fontSize: '0.95rem',
                                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(100, 130, 255, 0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100, 130, 255, 0.15)'; }}
                        >
                            추가
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={handleToggleRecording}
                            style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: isRecording
                                    ? 'radial-gradient(circle, #ff4444 0%, #cc2222 100%)'
                                    : 'radial-gradient(circle, rgba(100,130,255,0.3) 0%, rgba(60,80,180,0.2) 100%)',
                                border: isRecording
                                    ? '2px solid rgba(255, 100, 100, 0.5)'
                                    : '2px solid rgba(100, 130, 255, 0.3)',
                                color: '#fff', fontSize: '1.5rem', cursor: 'pointer', transition: 'all 0.3s',
                                boxShadow: isRecording
                                    ? '0 0 20px rgba(255, 50, 50, 0.4)'
                                    : '0 0 15px rgba(100, 130, 255, 0.15)',
                            }}
                        >
                            {isRecording ? '⏹' : '🎤'}
                        </button>

                        <button
                            onClick={handleFinish}
                            disabled={saving || stars.length === 0}
                            style={{
                                padding: '0.875rem 2.5rem',
                                background: stars.length === 0
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                border: '1px solid rgba(150, 170, 255, 0.3)',
                                borderRadius: '12px',
                                color: stars.length === 0 ? 'rgba(255,255,255,0.2)' : '#e0e8ff',
                                fontSize: '1rem', fontWeight: '500',
                                cursor: stars.length === 0 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s', fontFamily: 'inherit',
                            }}
                            onMouseEnter={e => {
                                if (stars.length > 0) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.45) 0%, rgba(150, 100, 255, 0.45) 100%)';
                            }}
                            onMouseLeave={e => {
                                if (stars.length > 0) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)';
                            }}
                        >
                            {saving ? '저장 중...' : '별자리 완성 ✨'}
                        </button>
                    </div>

                    {isRecording && (
                        <div style={{
                            color: 'rgba(255, 100, 100, 0.8)', fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <span style={{
                                display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: '#ff4444', animation: 'pulse 1.5s infinite',
                            }} />
                            음성 인식 중...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
