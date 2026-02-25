import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 이미 로그인 상태면 홈으로
    if (!loading && user) {
        return <Navigate to="/home" replace />;
    }

    // 배경 별 애니메이션
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.3,
                speed: 0.3 + Math.random() * 1.5,
                opacity: Math.random(),
            });
        }

        let animId: number;
        const animate = () => {
            ctx.fillStyle = '#04040f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 중앙 글로우
            const glow = ctx.createRadialGradient(
                canvas.width / 2, canvas.height * 0.4, 0,
                canvas.width / 2, canvas.height * 0.4, canvas.width * 0.5
            );
            glow.addColorStop(0, 'rgba(80, 100, 200, 0.06)');
            glow.addColorStop(0.5, 'rgba(60, 80, 180, 0.03)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const time = Date.now() * 0.001;
            stars.forEach(star => {
                const twinkle = 0.3 + 0.7 * Math.sin(time * star.speed + star.opacity * Math.PI * 2) ** 2;
                ctx.globalAlpha = twinkle * 0.8;
                ctx.fillStyle = '#c0d0ff';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* 배경 캔버스 */}
            <canvas ref={canvasRef} style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* 콘텐츠 */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* 네비게이션 */}
                <nav style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.5rem 3rem',
                    background: 'rgba(4, 4, 15, 0.3)',
                    backdropFilter: 'blur(12px)',
                }}>
                    <div style={{
                        fontSize: '1.2rem', fontWeight: '600',
                        color: 'rgba(200, 210, 255, 0.9)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        🌌 Astera
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/login">
                            <button style={{
                                padding: '0.6rem 1.5rem', fontSize: '0.9rem',
                                background: 'transparent',
                                border: '1px solid rgba(150, 170, 255, 0.25)',
                                borderRadius: '10px', color: 'rgba(200, 210, 255, 0.8)',
                                cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(150, 170, 255, 0.5)'; e.currentTarget.style.background = 'rgba(100, 130, 255, 0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(150, 170, 255, 0.25)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                로그인
                            </button>
                        </Link>
                        <Link to="/register">
                            <button style={{
                                padding: '0.6rem 1.5rem', fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                border: '1px solid rgba(150, 170, 255, 0.3)',
                                borderRadius: '10px', color: '#e0e8ff',
                                cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                                fontWeight: '500',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.45) 0%, rgba(150, 100, 255, 0.45) 100%)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)'; }}
                            >
                                시작하기
                            </button>
                        </Link>
                    </div>
                </nav>

                {/* 히어로 섹션 */}
                <section style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    minHeight: 'calc(100vh - 200px)',
                    padding: '4rem 2rem',
                }}>
                    <div style={{
                        fontSize: '4rem', marginBottom: '1.5rem',
                        animation: 'fadeIn 1s ease',
                    }}>
                        🌌
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '700',
                        marginBottom: '1.25rem', lineHeight: 1.2,
                        background: 'linear-gradient(135deg, #e0e8ff 0%, #a0b0ff 40%, #c0a0ff 70%, #e0c0ff 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        animation: 'fadeIn 1s ease 0.2s both',
                    }}>
                        당신의 생각이<br />별자리가 되는 곳
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: 'rgba(200, 210, 255, 0.5)',
                        maxWidth: '500px', lineHeight: 1.7,
                        marginBottom: '3rem',
                        animation: 'fadeIn 1s ease 0.4s both',
                    }}>
                        키워드를 말하면 별이 태어나고,<br />
                        생각의 연결이 당신만의 별자리를 그립니다.<br />
                        철학자들이 당신의 사유에 공명합니다.
                    </p>

                    <div style={{
                        display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
                        animation: 'fadeIn 1s ease 0.6s both',
                    }}>
                        <Link to="/register">
                            <button style={{
                                padding: '1.1rem 3rem', fontSize: '1.1rem',
                                background: 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)',
                                border: '1px solid rgba(150, 170, 255, 0.35)',
                                borderRadius: '16px', color: '#e0e8ff', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit',
                                boxShadow: '0 8px 32px rgba(100, 130, 255, 0.15)',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.5) 0%, rgba(150, 100, 255, 0.5) 100%)';
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(100, 130, 255, 0.25)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 130, 255, 0.3) 0%, rgba(150, 100, 255, 0.3) 100%)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(100, 130, 255, 0.15)';
                                }}
                            >
                                ✨ 별자리 만들기
                            </button>
                        </Link>
                    </div>
                </section>

                {/* 기능 소개 */}
                <section style={{
                    padding: '4rem 2rem 6rem',
                    maxWidth: '1000px', margin: '0 auto',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1.5rem',
                    }}>
                        {[
                            { emoji: '🎤', title: '말하면 별이 됩니다', desc: '마이크로 키워드를 말하거나 직접 입력하세요. 각 단어가 밤하늘의 별이 됩니다.' },
                            { emoji: '✨', title: '연결이 별자리를 만듭니다', desc: '별들이 자동으로 연결되어 당신만의 고유한 별자리 패턴이 탄생합니다.' },
                            { emoji: '📜', title: '철학자가 공명합니다', desc: '당신의 사유에 공명하는 철학자들의 관점과 해석을 만나보세요.' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                padding: '2rem',
                                background: 'rgba(15, 15, 40, 0.5)',
                                borderRadius: '18px',
                                border: '1px solid rgba(100, 130, 255, 0.08)',
                                transition: 'all 0.3s',
                                animation: `fadeIn 0.8s ease ${0.8 + i * 0.15}s both`,
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(100, 130, 255, 0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{item.emoji}</div>
                                <h3 style={{
                                    fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem',
                                    color: 'rgba(220, 230, 255, 0.9)',
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    fontSize: '0.9rem', color: 'rgba(200, 210, 255, 0.45)',
                                    lineHeight: 1.7,
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 푸터 */}
                <footer style={{
                    textAlign: 'center', padding: '2rem',
                    borderTop: '1px solid rgba(100, 130, 255, 0.06)',
                    color: 'rgba(200, 210, 255, 0.2)',
                    fontSize: '0.8rem',
                }}>
                    © 2026 Astera · 나의 철학 별자리
                </footer>
            </div>
        </div>
    );
}
