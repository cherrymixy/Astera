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
            const count = Math.floor((w * h) / 12000);
            stars = [];
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
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
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, w, h);

            stars.forEach(s => {
                const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
                ctx.globalAlpha = s.brightness * twinkle;
                ctx.fillStyle = '#c0c8e0';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, []);

    if (!loading && user) return <Navigate to="/home" replace />;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#050510' }}>
            <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
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
                    <Link to="/login">
                        <button style={{
                            padding: '0.5rem 1.2rem', fontSize: '0.85rem',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', color: 'rgba(255,255,255,0.85)',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                        }}>
                            시작하기
                        </button>
                    </Link>
                </nav>

                <section style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    minHeight: 'calc(100vh - 80px)',
                    padding: '0 clamp(1.5rem, 5vw, 2rem)',
                }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: '300',
                        marginBottom: '1.5rem', lineHeight: 1.4,
                        color: 'rgba(255,255,255,0.92)',
                        letterSpacing: '0.06em',
                        animation: 'fadeIn 1.5s ease both',
                    }}>
                        당신의 생각이 철학이 되는 곳
                    </h1>

                    <p style={{
                        fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)',
                        color: 'rgba(255,255,255,0.35)', maxWidth: '420px',
                        lineHeight: 1.8,
                        letterSpacing: '0.02em',
                        animation: 'fadeIn 1.5s ease 0.3s both',
                    }}>
                        내 주변 사물을 업로드하고 편하게 말해보세요.<br />
                        내 생각이 곧 철학이 되고, 내 철학이 하나의 별자리가 됩니다.
                    </p>
                </section>
            </div>
        </div>
    );
}
