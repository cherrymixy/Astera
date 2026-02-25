import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SessionData, ConstellationData, Star } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../api/client';

export default function HomePage() {
    const { user, logout } = useAuth();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAPI<{ sessions: SessionData[] }>('/api/sessions')
            .then(({ sessions }) => setSessions(sessions))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#04040f', color: '#e0e8ff' }}>
            {/* 상단 바 */}
            <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                padding: '1rem 2rem', gap: '1rem',
            }}>
                <span style={{ fontSize: '0.85rem', color: 'rgba(200, 210, 255, 0.5)' }}>
                    {user?.name}님
                </span>
                <button
                    onClick={logout}
                    style={{
                        padding: '0.4rem 1rem', fontSize: '0.8rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px', color: 'rgba(200, 210, 255, 0.5)',
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255, 100, 100, 0.3)'; e.currentTarget.style.color = 'rgba(255, 140, 140, 0.8)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = 'rgba(200, 210, 255, 0.5)'; }}
                >
                    로그아웃
                </button>
            </div>

            {/* 히어로 */}
            <div style={{
                textAlign: 'center', padding: '3rem 2rem 3rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(100,130,255,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌌</div>
                <h1 style={{
                    fontSize: '2.2rem', fontWeight: '700', marginBottom: '0.75rem',
                    background: 'linear-gradient(135deg, #e0e8ff 0%, #a0b0ff 50%, #c0a0ff 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    나의 철학 별자리
                </h1>
                <p style={{
                    fontSize: '1rem', color: 'rgba(200, 210, 255, 0.5)',
                    marginBottom: '2.5rem', lineHeight: 1.6,
                }}>
                    당신의 키워드가 별이 되고, 연결이 별자리가 됩니다
                </p>

                <Link to="/session/new">
                    <button style={{
                        padding: '1rem 2.5rem', fontSize: '1rem',
                        background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.25) 0%, rgba(150, 100, 255, 0.25) 100%)',
                        border: '1px solid rgba(150, 170, 255, 0.3)',
                        borderRadius: '14px', color: '#e0e8ff', fontWeight: '500',
                        cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                        boxShadow: '0 4px 20px rgba(100, 130, 255, 0.1)',
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.4) 0%, rgba(150, 100, 255, 0.4) 100%)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.25) 0%, rgba(150, 100, 255, 0.25) 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        ✨ 새 별자리 만들기
                    </button>
                </Link>
            </div>

            {/* 갤러리 */}
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 4rem' }}>
                <h2 style={{
                    fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: '600',
                    color: 'rgba(200, 210, 255, 0.6)',
                }}>
                    나의 별자리들
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200, 210, 255, 0.3)' }}>
                        불러오는 중...
                    </div>
                ) : sessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '4rem 2rem', color: 'rgba(200, 210, 255, 0.25)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
                        <p>아직 별자리가 없습니다. 첫 번째 별자리를 만들어보세요!</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.25rem',
                    }}>
                        {sessions.map(session => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function SessionCard({ session }: { session: SessionData }) {
    const { stars, starCount } = useMemo(() => {
        try {
            const c: ConstellationData = JSON.parse(session.constellationJson);
            return { stars: c.stars || [], starCount: c.stars?.length || 0 };
        } catch {
            return { stars: [] as Star[], starCount: 0 };
        }
    }, [session.constellationJson]);

    const displayKeywords = stars.slice(0, 4);

    return (
        <Link to={`/session/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div
                style={{
                    background: 'rgba(15, 15, 40, 0.6)', borderRadius: '16px',
                    padding: '1.5rem', cursor: 'pointer', transition: 'all 0.25s',
                    border: '1px solid rgba(100, 130, 255, 0.08)', height: '100%',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(25, 25, 60, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(15, 15, 40, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {/* 미니 별자리 */}
                <div style={{
                    height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem', background: 'rgba(100, 130, 255, 0.03)',
                    borderRadius: '10px', position: 'relative', overflow: 'hidden',
                }}>
                    {displayKeywords.map((star, i) => (
                        <div key={star.id} style={{
                            position: 'absolute',
                            left: `${20 + (i * 20)}%`,
                            top: `${25 + (i % 2 === 0 ? 0 : 30)}%`,
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#c0d0ff',
                            boxShadow: '0 0 8px rgba(150, 180, 255, 0.6)',
                        }} />
                    ))}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {displayKeywords.length >= 2 && displayKeywords.slice(0, -1).map((_, i) => (
                            <line key={i}
                                x1={`${20 + (i * 20)}%`} y1={`${28 + (i % 2 === 0 ? 0 : 30)}%`}
                                x2={`${20 + ((i + 1) * 20)}%`} y2={`${28 + ((i + 1) % 2 === 0 ? 0 : 30)}%`}
                                stroke="rgba(150, 180, 255, 0.2)" strokeWidth="1"
                            />
                        ))}
                    </svg>
                    <span style={{ color: 'rgba(200, 210, 255, 0.15)', fontSize: '1.5rem' }}>🌌</span>
                </div>

                <div style={{
                    fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem',
                    color: 'rgba(220, 230, 255, 0.9)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {session.title || '나의 별자리'}
                </div>

                <div style={{
                    fontSize: '0.8rem', color: 'rgba(200, 210, 255, 0.35)',
                    display: 'flex', justifyContent: 'space-between',
                }}>
                    <span>{new Date(session.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span>⭐ {starCount}</span>
                </div>
            </div>
        </Link>
    );
}
