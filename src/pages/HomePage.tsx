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
        fetchAPI<{ success: boolean; data: SessionData[] }>('/api/sessions')
            .then(res => setSessions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '1rem clamp(1rem, 5vw, 2rem)', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{user?.name}님</span>
                <button onClick={logout} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>로그아웃</button>
            </div>

            <div style={{ padding: '2rem clamp(1rem, 5vw, 2rem) 6rem', maxWidth: '700px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: '700', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>나의 별자리</h1>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                        당신의 키워드가 별이 되고, 연결이 별자리가 됩니다
                    </p>
                    <Link to="/capture">
                        <button style={{ padding: '0.85rem 2rem', fontSize: '0.95rem', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                            + 새 별자리
                        </button>
                    </Link>
                </div>

                {/* Sessions list */}
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem' }}>불러오는 중...</div>
                ) : sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🌌</div>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>아직 만든 별자리가 없어요</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {sessions.map(session => {
                            let starCount = 0;
                            try {
                                const c: ConstellationData = JSON.parse(session.constellationJson);
                                starCount = c.stars?.length || 0;
                            } catch { }
                            return (
                                <Link key={session.id} to={`/session/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{session.title || '무제 별자리'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                    ⭐ {starCount}개 · {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                                                </div>
                                            </div>
                                            <span style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }}>›</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
