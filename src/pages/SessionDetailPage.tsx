import { useEffect, useState } from 'react';
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

                    // AI 생성 철학자가 있으면 사용, 없으면 로컬 fallback
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
        const canvas = document.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `constellation-${id?.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-tertiary)' }}>별자리를 불러오는 중...</div>;
    }

    if (!session) return null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'clamp(1rem, 5vw, 2rem) clamp(1rem, 5vw, 1.5rem)' }}>
                {/* Back */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <Link to="/home" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', textDecoration: 'none' }}>← 홈으로</Link>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.5rem)', fontWeight: '700', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                        {session.title || '나의 별자리'}
                    </h1>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        {new Date(session.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · ⭐ {stars.length}개의 별
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>
                    <ConstellationCanvas stars={stars} connections={connections} animated={true} interactive={true} />
                </div>

                {/* Tags */}
                {stars.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        {stars.map(star => (
                            <span key={star.id} style={{ padding: '0.35rem 0.75rem', background: 'var(--accent-soft)', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--accent)' }}>
                                {star.keyword}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reasoning */}
                {session.reasoningText && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.8, fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            "{session.reasoningText}"
                        </div>
                    </div>
                )}

                {/* Philosophers */}
                {philosophers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                            이 별자리와 공명하는 철학자
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(220px, 100%), 1fr))`, gap: '0.75rem' }}>
                            {philosophers.map(p => (
                                <div key={p.id} onClick={() => setSelectedPhilosopher(p)}
                                    style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.2rem' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>{p.nameEn}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>"{p.reasoning}"</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal */}
                {selectedPhilosopher && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'clamp(1rem, 5vw, 2rem)' }}
                        onClick={() => setSelectedPhilosopher(null)}>
                        <div style={{ background: '#16161f', borderRadius: 'var(--radius-lg)', padding: 'clamp(1.5rem, 5vw, 2.5rem)', maxWidth: '500px', width: '100%' }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.2rem' }}>{selectedPhilosopher.name}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{selectedPhilosopher.nameEn}</div>
                                </div>
                                <button onClick={() => setSelectedPhilosopher(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                                "{selectedPhilosopher.reasoning}"
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                                {selectedPhilosopher.explanation}
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleExport} className="btn-secondary" style={{ fontSize: '0.9rem' }}>🖼️ PNG 다운로드</button>
                    <button onClick={handleDelete} style={{ padding: '0.9rem 1.5rem', background: 'var(--danger)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ 삭제</button>
                </div>
            </div>
        </div>
    );
}

