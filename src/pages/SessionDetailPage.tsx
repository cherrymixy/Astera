import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SessionData, ConstellationData, Star, Connection } from '../types';
import { Philosopher, recommendPhilosophers } from '../lib/philosophers';
import { fetchAPI } from '../api/client';
import ConstellationCanvas from '../components/ConstellationCanvas';

export default function SessionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [stars, setStars] = useState<Star[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [philosophers, setPhilosophers] = useState<Philosopher[]>([]);
    const [selectedPhilosopher, setSelectedPhilosopher] = useState<Philosopher | null>(null);

    useEffect(() => {
        if (!id) return;

        fetchAPI<{ success: boolean; data: SessionData }>(`/api/sessions/${id}`)
            .then(res => {
                const data = res.data;
                setSession(data);

                try {
                    const constellation: ConstellationData = JSON.parse(data.constellationJson);
                    setStars(constellation.stars || []);
                    setConnections(constellation.connections || []);

                    if ((constellation as any).philosophers?.length > 0) {
                        setPhilosophers((constellation as any).philosophers);
                    } else if (data.reasoningText) {
                        setPhilosophers(recommendPhilosophers(data.reasoningText));
                    }
                } catch {
                    setStars([]);
                    setConnections([]);
                }
            })
            .catch(() => {
                alert('별자리를 찾을 수 없습니다.');
                navigate('/home');
            })
            .finally(() => setLoading(false));
    }, [id, navigate]);

    const handleExport = () => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return;

        // Create a temporary canvas to get full resolution image
        const tempCanvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(canvas, 0, 0);

        tempCanvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${stars[0]?.keyword || 'constellation'}-${id?.slice(0, 8)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png');
    };

    const handleDelete = async () => {
        if (!confirm('이 별자리를 삭제할까요?')) return;
        try {
            await fetchAPI(`/api/sessions/${id}`, { method: 'DELETE' });
            navigate('/home');
        } catch (err: any) {
            alert('삭제에 실패했습니다: ' + (err.message || ''));
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510', color: 'rgba(255,255,255,0.3)' }}>별자리를 불러오는 중...</div>;
    }

    if (!session) return null;

    const displayTitle = stars[0]?.keyword || session.title || '나의 별자리';

    return (
        <div style={{ minHeight: '100vh', background: '#050510', color: 'rgba(255,255,255,0.9)' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem clamp(1rem, 5vw, 1.5rem)' }}>
                {/* Back */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/home" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '0.02em' }}>← 홈으로</Link>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: '300', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                        {displayTitle}
                    </h1>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.03em' }}>
                        {new Date(session.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · {stars.length}개의 별
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ marginBottom: '2rem', borderRadius: '14px', overflow: 'hidden' }}>
                    <ConstellationCanvas stars={stars} connections={connections} animated={true} interactive={true} />
                </div>

                {/* Tags */}
                {stars.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
                        {stars.map(star => (
                            <span key={star.id} style={{
                                padding: '0.35rem 0.85rem',
                                background: 'rgba(131, 178, 224, 0.08)',
                                border: '1px solid rgba(131, 178, 224, 0.12)',
                                borderRadius: '20px', fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.55)',
                            }}>
                                {star.keyword}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reasoning */}
                {session.reasoningText && (
                    <div style={{ marginBottom: '2.5rem', padding: '1.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.9, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                            "{session.reasoningText}"
                        </div>
                    </div>
                )}

                {/* Philosophers */}
                {philosophers.length > 0 && (
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '0.9rem', fontWeight: '400', marginBottom: '1rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>
                            이 별자리와 공명하는 철학자
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(220px, 100%), 1fr))`, gap: '0.75rem' }}>
                            {philosophers.map(p => (
                                <div key={p.id} onClick={() => setSelectedPhilosopher(p)}
                                    style={{
                                        padding: '1.25rem', background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.15rem' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginBottom: '0.5rem' }}>{p.nameEn}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', lineHeight: 1.6 }}>"{p.reasoning}"</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal */}
                {selectedPhilosopher && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'clamp(1rem, 5vw, 2rem)' }}
                        onClick={() => setSelectedPhilosopher(null)}>
                        <div style={{ background: 'rgba(16, 16, 24, 0.98)', borderRadius: '16px', padding: 'clamp(1.5rem, 5vw, 2.5rem)', maxWidth: '480px', width: '100%' }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '0.15rem' }}>{selectedPhilosopher.name}</h3>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>{selectedPhilosopher.nameEn}</div>
                                </div>
                                <button onClick={() => setSelectedPhilosopher(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                                "{selectedPhilosopher.reasoning}"
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
                                {selectedPhilosopher.explanation}
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ textAlign: 'center', paddingBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button onClick={handleExport} style={{
                        padding: '0.7rem 1.3rem', fontSize: '0.8rem',
                        background: 'rgba(255,255,255,0.06)', border: 'none',
                        borderRadius: '8px', color: 'rgba(255,255,255,0.45)',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>PNG 다운로드</button>
                    <button onClick={handleDelete} style={{
                        padding: '0.7rem 1.3rem', fontSize: '0.8rem',
                        background: 'rgba(255, 80, 80, 0.08)', border: 'none',
                        borderRadius: '8px', color: 'rgba(255, 120, 120, 0.7)',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}>삭제</button>
                </div>
            </div>
        </div>
    );
}
