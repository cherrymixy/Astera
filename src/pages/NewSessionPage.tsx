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
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050510', overflow: 'hidden' }}>
            {/* 헤더 */}
            <div style={{ padding: '0.75rem clamp(1rem, 5vw, 1.5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Link to="/home" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textDecoration: 'none' }}>← 돌아가기</Link>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>{stars.length}개의 별</div>
            </div>

            {/* 사물 프롬프트 */}
            {objectPrompt && (
                <div style={{ padding: '0 clamp(1rem, 5vw, 1.5rem)', flexShrink: 0 }}>
                    <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.6, color: 'rgba(255,255,255,0.4)' }}>"{objectPrompt}"</div>
                    </div>
                </div>
            )}

            {/* 캔버스 — flex:1로 남은 공간 전부 사용 */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem clamp(0.5rem, 3vw, 1.5rem)', position: 'relative' }}>
                <div style={{ width: '100%', maxWidth: '900px', height: '100%', position: 'relative' }}>
                    <ConstellationCanvas stars={stars} connections={connections} animated={true} interactive={true} fillParent={true} />
                    {lastAddedKeyword && (
                        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', padding: '0.35rem 0.9rem', background: 'rgba(131,178,224,0.12)', borderRadius: '20px', color: 'var(--accent)', fontSize: '0.8rem', animation: 'fadeIn 0.4s ease', pointerEvents: 'none' }}>
                            {lastAddedKeyword}
                        </div>
                    )}
                    {stars.length === 0 && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>
                            <div style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>마이크로 생각을 말하거나<br />아래에 키워드를 입력해보세요</div>
                        </div>
                    )}
                </div>
            </div>

            {/* 하단 컨트롤 — 항상 보임 */}
            <div style={{ flexShrink: 0, padding: '0.75rem clamp(1rem, 5vw, 1.5rem) 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', background: '#050510' }}>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                    <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={handleKeyDown}
                        placeholder="키워드를 입력하세요"
                        style={{ flex: 1, padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={handleAddKeyword}
                        style={{ padding: '0.7rem 1rem', background: 'rgba(131,178,224,0.12)', border: 'none', borderRadius: '10px', color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>추가</button>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <button onClick={handleToggleRecording}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', background: isRecording ? '#e03030' : 'rgba(131,178,224,0.12)', border: 'none', color: isRecording ? 'white' : 'var(--accent)', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
                        {isRecording ? '⏹' : '🎤'}
                    </button>
                    <button onClick={handleFinish} disabled={saving || stars.length === 0}
                        style={{ padding: '0.7rem 1.8rem', background: stars.length === 0 ? 'rgba(255,255,255,0.04)' : 'var(--accent)', border: 'none', borderRadius: '10px', color: stars.length === 0 ? 'rgba(255,255,255,0.2)' : '#121212', fontSize: '0.85rem', fontWeight: '600', cursor: stars.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'opacity 0.2s', opacity: saving ? 0.5 : 1 }}>
                        {saving ? '저장 중...' : '별자리 완성'}
                    </button>
                </div>

                {isRecording && (
                    <div style={{ color: '#e03030', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e03030', animation: 'pulse 1.5s infinite' }} />
                        음성 인식 중...
                    </div>
                )}
            </div>
        </div>
    );
}

