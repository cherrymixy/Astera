import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0, h = 0;

        interface Star { x: number; y: number; size: number; brightness: number; speed: number; phase: number; }
        let stars: Star[] = [];

        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;

            // Sparse, subtle stars
            const count = Math.floor((w * h) / 12000);
            stars = [];
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h * 0.75, // mostly upper area
                    size: Math.random() * 1.2 + 0.2,
                    brightness: 0.2 + Math.random() * 0.5,
                    speed: 0.3 + Math.random() * 1.5,
                    phase: Math.random() * Math.PI * 2,
                });
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            const time = Date.now() * 0.001;

            // Deep space background
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, w, h);

            // Stars — gentle twinkle, no interaction
            stars.forEach(s => {
                const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
                ctx.globalAlpha = s.brightness * twinkle;
                ctx.fillStyle = '#c0c8e0';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // Planet horizon glow at bottom
            const horizonY = h * 0.92;

            // Outer atmospheric glow (wide, soft blue)
            const atmosGlow = ctx.createRadialGradient(
                w * 0.5, h * 1.35, 0,
                w * 0.5, h * 1.35, h * 0.7
            );
            atmosGlow.addColorStop(0, 'rgba(60, 120, 200, 0.12)');
            atmosGlow.addColorStop(0.3, 'rgba(40, 90, 170, 0.06)');
            atmosGlow.addColorStop(0.6, 'rgba(20, 50, 120, 0.02)');
            atmosGlow.addColorStop(1, 'rgba(5, 5, 16, 0)');
            ctx.fillStyle = atmosGlow;
            ctx.fillRect(0, 0, w, h);

            // Horizon light line
            const lineGrad = ctx.createLinearGradient(0, horizonY - 2, 0, horizonY + 30);
            lineGrad.addColorStop(0, 'rgba(120, 170, 255, 0.25)');
            lineGrad.addColorStop(0.15, 'rgba(80, 140, 230, 0.08)');
            lineGrad.addColorStop(1, 'rgba(5, 5, 16, 0)');

            // Curved horizon
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(w * 0.5, h * 1.35, w * 0.85, h * 0.5, 0, Math.PI * 1.15, Math.PI * 1.85);
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = lineGrad;
            ctx.fillRect(0, horizonY - 40, w, 100);

            // Planet surface subtle glow
            const surfaceGrad = ctx.createRadialGradient(
                w * 0.5, h * 1.35, h * 0.35,
                w * 0.5, h * 1.35, h * 0.52
            );
            surfaceGrad.addColorStop(0, 'rgba(10, 15, 30, 0.9)');
            surfaceGrad.addColorStop(0.5, 'rgba(15, 25, 50, 0.4)');
            surfaceGrad.addColorStop(1, 'rgba(5, 5, 16, 0)');
            ctx.fillStyle = surfaceGrad;
            ctx.fillRect(0, 0, w, h);

            // Rim light on the horizon edge
            const rimGlow = ctx.createRadialGradient(
                w * 0.5, h * 1.35, h * 0.42,
                w * 0.5, h * 1.35, h * 0.46
            );
            rimGlow.addColorStop(0, 'rgba(100, 160, 255, 0)');
            rimGlow.addColorStop(0.7, 'rgba(100, 160, 255, 0.15)');
            rimGlow.addColorStop(1, 'rgba(100, 160, 255, 0)');
            ctx.fillStyle = rimGlow;
            ctx.fillRect(0, 0, w, h);

            ctx.restore();

            // Center light bloom above horizon
            const bloom = ctx.createRadialGradient(
                w * 0.5, horizonY, 0,
                w * 0.5, horizonY, w * 0.35
            );
            bloom.addColorStop(0, 'rgba(100, 160, 255, 0.08)');
            bloom.addColorStop(0.3, 'rgba(60, 110, 200, 0.03)');
            bloom.addColorStop(1, 'rgba(5, 5, 16, 0)');
            ctx.fillStyle = bloom;
            ctx.fillRect(0, 0, w, h);

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    if (!loading && user) return <Navigate to="/home" replace />;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#050510' }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Nav */}
                <nav style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem clamp(1.5rem, 5vw, 3rem)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        fontSize: '1rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '-0.01em',
                    }}>
                        <img src="/logo.svg" alt="Astera" style={{ width: '18px', height: '18px' }} />
                        Astera
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link to="/login">
                            <button style={{
                                padding: '0.5rem 1.1rem', fontSize: '0.85rem',
                                background: 'none', border: 'none',
                                color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                로그인
                            </button>
                        </Link>
                        <Link to="/register">
                            <button style={{
                                padding: '0.5rem 1.2rem', fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', color: 'rgba(255,255,255,0.85)',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                            }}>
                                시작하기
                            </button>
                        </Link>
                    </div>
                </nav>

                {/* Hero — centered above horizon */}
                <section style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    minHeight: 'calc(100vh - 200px)',
                    padding: '0 clamp(1.5rem, 5vw, 2rem)',
                    paddingBottom: '15vh',
                }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: '300',
                        marginBottom: '0.6rem', lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.92)',
                        letterSpacing: '0.08em',
                        animation: 'fadeIn 1.5s ease both',
                    }}>
                        당신의 생각이
                    </h1>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: '300',
                        marginBottom: '2rem', lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.92)',
                        letterSpacing: '0.08em',
                        animation: 'fadeIn 1.5s ease 0.2s both',
                    }}>
                        별자리가 되는 곳
                    </h1>

                    <p style={{
                        fontSize: 'clamp(0.75rem, 1.5vw, 0.85rem)',
                        color: 'rgba(255,255,255,0.35)', maxWidth: '400px',
                        lineHeight: 1.8, marginBottom: '2.5rem',
                        letterSpacing: '0.02em',
                        animation: 'fadeIn 1.5s ease 0.5s both',
                    }}>
                        키워드를 말하면 별이 태어나고,<br />
                        생각의 연결이 당신만의 별자리를 그립니다.
                    </p>

                    <div style={{ animation: 'fadeIn 1.5s ease 0.8s both' }}>
                        <Link to="/register">
                            <button style={{
                                padding: '0.7rem 2.2rem', fontSize: '0.8rem',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '6px', color: 'rgba(255,255,255,0.7)',
                                fontWeight: '400', cursor: 'pointer', fontFamily: 'inherit',
                                letterSpacing: '0.1em',
                                transition: 'all 0.3s',
                            }}>
                                별자리 만들기
                            </button>
                        </Link>
                    </div>
                </section>

                {/* Bottom labels */}
                <div style={{
                    position: 'absolute', bottom: '2.5rem', left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: 'clamp(2rem, 6vw, 5rem)',
                    animation: 'fadeIn 2s ease 1.2s both',
                }}>
                    {[
                        { ko: '음성 인식', en: 'Voice Input' },
                        { ko: '별자리 연결', en: 'Constellation' },
                        { ko: '철학적 공명', en: 'Resonance' },
                        { ko: '사유의 지도', en: 'Thought Map' },
                    ].map((item, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)',
                                fontWeight: '400', letterSpacing: '0.05em', marginBottom: '0.2rem',
                            }}>
                                {item.ko}
                            </div>
                            <div style={{
                                fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)',
                                fontWeight: '300', letterSpacing: '0.08em',
                            }}>
                                {item.en}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
