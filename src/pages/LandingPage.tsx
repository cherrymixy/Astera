import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    if (!loading && user) return <Navigate to="/home" replace />;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resize();
        window.addEventListener('resize', resize);

        const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
        for (let i = 0; i < 150; i++) {
            stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.5 + 0.3, speed: 0.3 + Math.random() * 1.5, opacity: Math.random() });
        }
        let animId: number;
        const animate = () => {
            ctx.fillStyle = '#09090f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const time = Date.now() * 0.001;
            stars.forEach(star => {
                const twinkle = 0.3 + 0.7 * Math.sin(time * star.speed + star.opacity * Math.PI * 2) ** 2;
                ctx.globalAlpha = twinkle * 0.6;
                ctx.fillStyle = '#b0b8d0';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Nav */}
                <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem clamp(1rem, 5vw, 3rem)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        🌌 Astera
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/login">
                            <button style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                                로그인
                            </button>
                        </Link>
                        <Link to="/register">
                            <button style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500' }}>
                                시작하기
                            </button>
                        </Link>
                    </div>
                </nav>

                {/* Hero */}
                <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 'calc(100vh - 200px)', padding: '3rem clamp(1.5rem, 5vw, 2rem)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.8s ease' }}>🌌</div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '700', marginBottom: '1rem', lineHeight: 1.25, color: 'var(--text-primary)', letterSpacing: '-0.03em', animation: 'fadeIn 0.8s ease 0.1s both' }}>
                        당신의 생각이<br />별자리가 되는 곳
                    </h1>
                    <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.7, marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease 0.2s both' }}>
                        키워드를 말하면 별이 태어나고,<br />
                        생각의 연결이 당신만의 별자리를 그립니다.
                    </p>
                    <div style={{ animation: 'fadeIn 0.8s ease 0.3s both' }}>
                        <Link to="/register">
                            <button style={{ padding: '0.95rem 2.5rem', fontSize: '1rem', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                                별자리 만들기
                            </button>
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section style={{ padding: '2rem clamp(1.5rem, 5vw, 2rem) 5rem', maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '1rem' }}>
                        {[
                            { emoji: '🎤', title: '말하면 별이 됩니다', desc: '키워드를 말하거나 입력하면 밤하늘의 별이 됩니다.' },
                            { emoji: '✨', title: '연결이 별자리를 만듭니다', desc: '별들이 연결되어 당신만의 별자리 패턴이 탄생합니다.' },
                            { emoji: '📜', title: '철학자가 공명합니다', desc: '당신의 사유에 공명하는 철학자들을 만나보세요.' },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '1.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', animation: `fadeIn 0.6s ease ${0.4 + i * 0.1}s both` }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    © 2026 Astera
                </footer>
            </div>
        </div>
    );
}
