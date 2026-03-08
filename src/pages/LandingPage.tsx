import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';

// — Simplex-like noise (2D) —
function createNoise() {
    const perm = new Uint8Array(512);
    const grad = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [0, 1], [0, -1],
    ];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

    function dot(gi: number, x: number, y: number) {
        const g = grad[gi % 8];
        return g[0] * x + g[1] * y;
    }
    function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a: number, b: number, t: number) { return a + t * (b - a); }

    return function noise2D(x: number, y: number): number {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = fade(xf);
        const v = fade(yf);

        const aa = perm[perm[xi] + yi];
        const ab = perm[perm[xi] + yi + 1];
        const ba = perm[perm[xi + 1] + yi];
        const bb = perm[perm[xi + 1] + yi + 1];

        return lerp(
            lerp(dot(aa, xf, yf), dot(ba, xf - 1, yf), u),
            lerp(dot(ab, xf, yf - 1), dot(bb, xf - 1, yf - 1), u),
            v
        );
    };
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    depth: number; // 0~1, for parallax
}

export default function LandingPage() {
    const { user, loading } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const animRef = useRef<number>(0);
    const noiseRef = useRef(createNoise());
    const particlesRef = useRef<Particle[]>([]);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const noise = noiseRef.current;

        let w = 0, h = 0;

        const initParticles = () => {
            const count = Math.min(1800, Math.floor((w * h) / 800));
            const particles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const depth = Math.random();
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: 0,
                    vy: 0,
                    size: 0.4 + depth * 1.6,
                    alpha: 0.15 + depth * 0.5,
                    depth,
                });
            }
            particlesRef.current = particles;
        };

        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            initParticles();
        };
        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseLeave = () => {
            mouseRef.current = { x: -9999, y: -9999 };
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        const animate = () => {
            timeRef.current += 0.003;
            const t = timeRef.current;
            const mouse = mouseRef.current;

            // Semi-transparent clear for subtle trails
            ctx.fillStyle = 'rgba(6, 6, 12, 0.15)';
            ctx.fillRect(0, 0, w, h);

            const noiseScale = 0.0015;
            const mouseRadius = 300;

            particlesRef.current.forEach(p => {
                // Flow field from noise
                const nx = p.x * noiseScale;
                const ny = p.y * noiseScale;
                const n = noise(nx + t * 0.5, ny + t * 0.3);
                const angle = n * Math.PI * 4;

                // Base flow velocity (depth affects speed — parallax)
                const speed = 0.3 + p.depth * 0.7;
                let fx = Math.cos(angle) * speed;
                let fy = Math.sin(angle) * speed;

                // Mouse influence — broad, smooth distortion
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouseRadius) {
                    const force = ((mouseRadius - dist) / mouseRadius) ** 2;
                    const mAngle = Math.atan2(dy, dx);
                    // Swirl + push
                    fx += Math.cos(mAngle + Math.PI * 0.5) * force * 2.5;
                    fy += Math.sin(mAngle + Math.PI * 0.5) * force * 2.5;
                    fx += Math.cos(mAngle) * force * 1.2;
                    fy += Math.sin(mAngle) * force * 1.2;
                }

                p.vx += (fx - p.vx) * 0.08;
                p.vy += (fy - p.vy) * 0.08;
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < -10) p.x = w + 10;
                if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                if (p.y > h + 10) p.y = -10;

                // Draw
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = `rgba(200, 210, 240, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            animRef.current = requestAnimationFrame(animate);
        };

        // Initial fill to prevent flash
        ctx.fillStyle = '#06060c';
        ctx.fillRect(0, 0, w, h);

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
