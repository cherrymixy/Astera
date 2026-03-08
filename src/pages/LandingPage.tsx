import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    life: number;
    maxLife: number;
    angle: number;
    orbitRadius: number;
    orbitSpeed: number;
}

export default function LandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999, active: false });
    const particlesRef = useRef<Particle[]>([]);
    const animRef = useRef<number>(0);

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

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
        };
        const handleMouseLeave = () => {
            mouseRef.current = { ...mouseRef.current, active: false };
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        const spawnParticle = (mx: number, my: number) => {
            const angle = Math.random() * Math.PI * 2;
            const orbitRadius = 15 + Math.random() * 100;
            const maxLife = 120 + Math.random() * 180;

            particlesRef.current.push({
                x: mx + Math.cos(angle) * orbitRadius * 0.3,
                y: my + Math.sin(angle) * orbitRadius * 0.3,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 0.8 + Math.random() * 1.8,
                opacity: 0.3 + Math.random() * 0.7,
                life: 0,
                maxLife,
                angle,
                orbitRadius,
                orbitSpeed: (0.008 + Math.random() * 0.025) * (Math.random() > 0.5 ? 1 : -1),
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            // Spawn particles near mouse
            if (mouse.active && particlesRef.current.length < 120) {
                for (let i = 0; i < 2; i++) {
                    spawnParticle(mouse.x, mouse.y);
                }
            }

            // Update & draw
            particlesRef.current = particlesRef.current.filter(p => {
                p.life++;
                if (p.life > p.maxLife) return false;

                // Orbit around mouse
                if (mouse.active) {
                    p.angle += p.orbitSpeed;
                    const targetX = mouse.x + Math.cos(p.angle) * p.orbitRadius;
                    const targetY = mouse.y + Math.sin(p.angle) * p.orbitRadius;
                    p.vx += (targetX - p.x) * 0.02;
                    p.vy += (targetY - p.y) * 0.02;
                } else {
                    // Drift away slowly when mouse leaves
                    p.vx += (Math.random() - 0.5) * 0.05;
                    p.vy += (Math.random() - 0.5) * 0.05;
                }

                p.vx *= 0.95;
                p.vy *= 0.95;
                p.x += p.vx;
                p.y += p.vy;

                // Fade in/out
                const lifeRatio = p.life / p.maxLife;
                let alpha = p.opacity;
                if (lifeRatio < 0.1) alpha *= lifeRatio / 0.1;
                if (lifeRatio > 0.7) alpha *= (1 - lifeRatio) / 0.3;
                if (!mouse.active) alpha *= Math.max(0, 1 - (p.life - p.maxLife * 0.5) / (p.maxLife * 0.5));

                // Glow
                ctx.globalAlpha = alpha * 0.3;
                const glow = p.size * 4;
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
                gradient.addColorStop(0, 'rgba(190, 200, 255, 0.6)');
                gradient.addColorStop(1, 'rgba(150, 170, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#d8ddf5';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();

                return true;
            });

            ctx.globalAlpha = 1;
            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    if (!loading && user) return <Navigate to="/home" replace />;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#06060c' }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            />

            <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                {/* Nav */}
                <nav style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem clamp(1.5rem, 5vw, 3rem)',
                    pointerEvents: 'auto',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)',
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
                                color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                로그인
                            </button>
                        </Link>
                        <Link to="/register">
                            <button style={{
                                padding: '0.5rem 1.2rem', fontSize: '0.85rem',
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px', color: 'var(--text-primary)',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
                                transition: 'background 0.2s',
                            }}>
                                시작하기
                            </button>
                        </Link>
                    </div>
                </nav>

                {/* Hero */}
                <section style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textAlign: 'center',
                    minHeight: 'calc(100vh - 80px)',
                    padding: '0 clamp(1.5rem, 5vw, 2rem)',
                }}>
                    <div style={{ marginBottom: '2rem', animation: 'fadeIn 1s ease' }}>
                        <img src="/logo.svg" alt="Astera" style={{ width: '48px', height: '48px', opacity: 0.9 }} />
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: '500',
                        marginBottom: '1rem', lineHeight: 1.35,
                        color: 'var(--text-primary)', letterSpacing: '-0.02em',
                        animation: 'fadeIn 1s ease 0.15s both',
                    }}>
                        당신의 생각이<br />별자리가 되는 곳
                    </h1>

                    <p style={{
                        fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                        color: 'var(--text-secondary)', maxWidth: '380px',
                        lineHeight: 1.7, marginBottom: '2.5rem',
                        animation: 'fadeIn 1s ease 0.3s both',
                    }}>
                        키워드를 말하면 별이 태어나고,<br />
                        생각의 연결이 당신만의 별자리를 그립니다.
                    </p>

                    <div style={{ animation: 'fadeIn 1s ease 0.45s both', pointerEvents: 'auto' }}>
                        <Link to="/register">
                            <button style={{
                                padding: '0.8rem 2rem', fontSize: '0.9rem',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '10px', color: 'var(--text-primary)',
                                fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all 0.25s',
                                backdropFilter: 'blur(8px)',
                            }}>
                                별자리 만들기
                            </button>
                        </Link>
                    </div>

                    <div style={{
                        display: 'flex', gap: '1.5rem', marginTop: '3rem',
                        animation: 'fadeIn 1s ease 0.6s both',
                    }}>
                        {[
                            { icon: '🎤', label: '음성으로 별 만들기' },
                            { icon: '✨', label: '별자리 연결' },
                            { icon: '📜', label: '철학자 공명' },
                        ].map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.8rem', color: 'var(--text-tertiary)',
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </section>

                <footer style={{
                    textAlign: 'center', padding: '1.5rem',
                    color: 'var(--text-tertiary)', fontSize: '0.7rem',
                }}>
                    © 2026 Astera
                </footer>
            </div>
        </div>
    );
}
