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

        fetchAPI<{ session: SessionData }>(`/api/sessions/${id}`)
            .then(({ session: data }) => {
                setSession(data);

                try {
                    const constellation: ConstellationData = JSON.parse(data.constellationJson);
                    setStars(constellation.stars || []);
                    setConnections(constellation.connections || []);

                    if (data.reasoningText) {
                        setPhilosophers(recommendPhilosophers(data.reasoningText));
                    }
                } catch {
                    setStars([]);
                    setConnections([]);
                }
            })
            .catch(() => {
                alert('별자리를 찾을 수 없습니다.');
                navigate('/');
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
            navigate('/');
        } catch (err: any) {
            alert('삭제에 실패했습니다: ' + (err.message || ''));
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#04040f', color: 'rgba(200, 210, 255, 0.4)',
            }}>
                별자리를 불러오는 중...
            </div>
        );
    }

    if (!session) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#04040f', color: '#e0e8ff' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* 헤더 */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/" style={{
                        color: 'rgba(200, 210, 255, 0.5)', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        textDecoration: 'none',
                    }}>
                        ← 홈으로
                    </Link>
                </div>

                {/* 제목 */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.6rem', fontWeight: '600', marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, #c0d0ff 0%, #a0b0ff 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        {session.title || '나의 별자리'}
                    </h1>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.4)' }}>
                        {new Date(session.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                        })} · ⭐ {stars.length}개의 별
                    </div>
                </div>

                {/* 별자리 캔버스 */}
                <div style={{
                    marginBottom: '2rem', borderRadius: '20px', overflow: 'hidden',
                    border: '1px solid rgba(100, 130, 255, 0.1)',
                    background: 'rgba(10, 10, 30, 0.5)',
                }}>
                    <ConstellationCanvas stars={stars} connections={connections} animated={true} interactive={true} />
                </div>

                {/* 키워드 태그 */}
                {stars.length > 0 && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                        justifyContent: 'center', marginBottom: '2rem',
                    }}>
                        {stars.map(star => (
                            <span key={star.id} style={{
                                padding: '0.4rem 0.9rem',
                                background: 'rgba(100, 130, 255, 0.1)',
                                border: '1px solid rgba(100, 130, 255, 0.2)',
                                borderRadius: '20px', fontSize: '0.85rem',
                                color: 'rgba(200, 210, 255, 0.8)',
                            }}>
                                ⭐ {star.keyword}
                            </span>
                        ))}
                    </div>
                )}

                {/* 사유 요약 */}
                {session.reasoningText && (
                    <div style={{
                        marginBottom: '2rem', padding: '2rem',
                        background: 'rgba(100, 130, 255, 0.05)',
                        borderRadius: '16px', border: '1px solid rgba(100, 130, 255, 0.1)',
                    }}>
                        <div style={{
                            fontSize: '1.1rem', lineHeight: 1.8, fontStyle: 'italic',
                            color: 'rgba(220, 230, 255, 0.9)', textAlign: 'center',
                            fontFamily: "'Noto Serif KR', serif",
                        }}>
                            "{session.reasoningText}"
                        </div>
                    </div>
                )}

                {/* 철학자 카드 */}
                {philosophers.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem',
                            color: 'rgba(200, 210, 255, 0.7)',
                        }}>
                            이 별자리와 공명하는 철학자
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1rem',
                        }}>
                            {philosophers.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPhilosopher(p)}
                                    style={{
                                        padding: '1.5rem',
                                        background: 'rgba(100, 130, 255, 0.06)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(100, 130, 255, 0.12)',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(100, 130, 255, 0.12)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(100, 130, 255, 0.06)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                        {p.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(200, 210, 255, 0.4)', marginBottom: '0.75rem' }}>
                                        {p.nameEn}
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.7)',
                                        fontStyle: 'italic', lineHeight: 1.6,
                                    }}>
                                        "{p.reasoning}"
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 철학자 모달 */}
                {selectedPhilosopher && (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(4, 4, 15, 0.85)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: '2rem',
                        }}
                        onClick={() => setSelectedPhilosopher(null)}
                    >
                        <div
                            style={{
                                background: 'rgba(15, 15, 40, 0.95)',
                                borderRadius: '20px', padding: '2.5rem', maxWidth: '550px', width: '100%',
                                border: '1px solid rgba(100, 130, 255, 0.15)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                                        {selectedPhilosopher.name}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.4)' }}>
                                        {selectedPhilosopher.nameEn}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPhilosopher(null)}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        color: 'rgba(200, 210, 255, 0.4)', fontSize: '1.5rem',
                                        cursor: 'pointer', padding: '0.25rem 0.5rem',
                                    }}
                                >×</button>
                            </div>
                            <div style={{
                                fontSize: '1.05rem', fontStyle: 'italic',
                                color: 'rgba(220, 230, 255, 0.9)', lineHeight: 1.7, marginBottom: '1.5rem',
                            }}>
                                "{selectedPhilosopher.reasoning}"
                            </div>
                            <div style={{
                                fontSize: '0.95rem', color: 'rgba(200, 210, 255, 0.7)', lineHeight: 1.8,
                            }}>
                                {selectedPhilosopher.explanation}
                            </div>
                        </div>
                    </div>
                )}

                {/* 버튼 영역 */}
                <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '0.875rem 2rem',
                            background: 'rgba(100, 130, 255, 0.12)',
                            border: '1px solid rgba(100, 130, 255, 0.25)',
                            borderRadius: '12px', color: '#c0d0ff',
                            fontSize: '0.95rem', fontWeight: '500',
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(100, 130, 255, 0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(100, 130, 255, 0.12)'; }}
                    >
                        🖼️ PNG 다운로드
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '0.875rem 2rem',
                            background: 'rgba(255, 80, 80, 0.08)',
                            border: '1px solid rgba(255, 80, 80, 0.2)',
                            borderRadius: '12px', color: 'rgba(255, 120, 120, 0.7)',
                            fontSize: '0.95rem', fontWeight: '500',
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.08)'; }}
                    >
                        🗑️ 삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
