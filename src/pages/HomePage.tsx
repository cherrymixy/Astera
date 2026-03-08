import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SessionData, ConstellationData, Star, Connection } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../api/client';

interface MapConstellation {
    session: SessionData;
    stars: Star[];
    connections: Connection[];
    cx: number;  // center x on world map
    cy: number;  // center y on world map
}

export default function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<MapConstellation | null>(null);

    // Pan & zoom state
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
    const dragRef = useRef({ dragging: false, startX: 0, startY: 0, camX: 0, camY: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const constellationsRef = useRef<MapConstellation[]>([]);
    const animRef = useRef<number>(0);

    useEffect(() => {
        fetchAPI<{ success: boolean; data: SessionData[] }>('/api/sessions')
            .then(res => setSessions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Build map constellations from sessions
    useEffect(() => {
        if (sessions.length === 0) {
            constellationsRef.current = [];
            return;
        }

        const mapConstellations: MapConstellation[] = [];
        const cols = Math.ceil(Math.sqrt(sessions.length));
        const spacing = 400;

        sessions.forEach((session, i) => {
            let stars: Star[] = [];
            let connections: Connection[] = [];
            try {
                const c: ConstellationData = JSON.parse(session.constellationJson);
                stars = c.stars || [];
                connections = c.connections || [];
            } catch { }

            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = col * spacing;
            const cy = row * spacing;

            mapConstellations.push({ session, stars, connections, cx, cy });
        });

        constellationsRef.current = mapConstellations;

        // Center camera on all constellations
        if (mapConstellations.length > 0) {
            const avgX = mapConstellations.reduce((s, c) => s + c.cx, 0) / mapConstellations.length;
            const avgY = mapConstellations.reduce((s, c) => s + c.cy, 0) / mapConstellations.length;
            setCamera({ x: -avgX, y: -avgY, zoom: 1 });
        }
    }, [sessions]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0, h = 0;
        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Background stars
        interface BGStar { x: number; y: number; s: number; b: number; speed: number; phase: number; }
        const bgStars: BGStar[] = [];
        for (let i = 0; i < 600; i++) {
            bgStars.push({
                x: Math.random() * 20000 - 10000,
                y: Math.random() * 20000 - 10000,
                s: Math.random() * 1.5 + 0.5,
                b: 0.2 + Math.random() * 0.4,
                speed: 0.3 + Math.random() * 1,
                phase: Math.random() * Math.PI * 2,
            });
        }

        const animate = () => {
            const time = Date.now() * 0.001;
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, w, h);

            const cam = camera;
            const cx = w / 2 + cam.x * cam.zoom;
            const cy = h / 2 + cam.y * cam.zoom;
            const z = cam.zoom;

            // BG stars (parallax at 0.3x)
            bgStars.forEach(s => {
                const sx = cx + s.x * z * 0.3;
                const sy = cy + s.y * z * 0.3;
                if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) return;
                const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
                ctx.globalAlpha = s.b * twinkle;
                ctx.fillStyle = '#8090b0';
                ctx.beginPath();
                ctx.arc(sx, sy, s.s, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw constellations
            constellationsRef.current.forEach(constellation => {
                const { stars, connections, cx: mapX, cy: mapY, session } = constellation;
                if (stars.length === 0) return;

                // Calculate screen positions
                const screenStars = stars.map(star => ({
                    ...star,
                    sx: cx + (mapX + star.x * 1.5) * z,
                    sy: cy + (mapY + star.y * 1.5) * z,
                }));

                // Check if any star is visible
                const anyVisible = screenStars.some(s =>
                    s.sx > -100 && s.sx < w + 100 && s.sy > -100 && s.sy < h + 100
                );
                if (!anyVisible) return;

                // Connections
                ctx.strokeStyle = 'rgba(131, 178, 224, 0.7)';
                ctx.lineWidth = 2.5 * z;
                connections.forEach(conn => {
                    const from = screenStars.find(s => s.id === conn.from);
                    const to = screenStars.find(s => s.id === conn.to);
                    if (!from || !to) return;
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(from.sx, from.sy);
                    ctx.lineTo(to.sx, to.sy);
                    ctx.stroke();
                });

                // Stars
                screenStars.forEach(star => {
                    const r = Math.max(4, (star.size || 3) * z * 2);
                    const twinkle = 0.8 + 0.2 * Math.sin(time * 1.5 + star.brightness * 10);

                    // Glow
                    ctx.globalAlpha = 0.5 * twinkle;
                    const grad = ctx.createRadialGradient(star.sx, star.sy, 0, star.sx, star.sy, r * 5);
                    grad.addColorStop(0, 'rgba(131, 178, 224, 0.8)');
                    grad.addColorStop(1, 'rgba(131, 178, 224, 0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(star.sx, star.sy, r * 5, 0, Math.PI * 2);
                    ctx.fill();

                    // Core
                    ctx.globalAlpha = 0.95 * twinkle;
                    ctx.fillStyle = '#e8f0ff';
                    ctx.beginPath();
                    ctx.arc(star.sx, star.sy, r, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            ctx.globalAlpha = 1;
            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, [camera]);

    // Mouse handlers for pan
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, camX: camera.x, camY: camera.y };
    }, [camera]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragRef.current.dragging) return;
        const dx = (e.clientX - dragRef.current.startX) / camera.zoom;
        const dy = (e.clientY - dragRef.current.startY) / camera.zoom;
        setCamera(prev => ({ ...prev, x: dragRef.current.camX + dx, y: dragRef.current.camY + dy }));
    }, [camera.zoom]);

    const handleMouseUp = useCallback(() => {
        dragRef.current.dragging = false;
    }, []);

    // Zoom with scroll
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setCamera(prev => ({
            ...prev,
            zoom: Math.max(0.3, Math.min(3, prev.zoom * factor)),
        }));
    }, []);

    // Click to select constellation
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (dragRef.current.dragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2 + camera.x * camera.zoom;
        const cy = h / 2 + camera.y * camera.zoom;
        const z = camera.zoom;

        let found: MapConstellation | null = null;
        let minDist = Infinity;

        constellationsRef.current.forEach(constellation => {
            constellation.stars.forEach(star => {
                const sx = cx + (constellation.cx + star.x * 1.5) * z;
                const sy = cy + (constellation.cy + star.y * 1.5) * z;
                const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
                if (dist < 30 && dist < minDist) {
                    minDist = dist;
                    found = constellation;
                }
            });
        });

        setSelected(found);
    }, [camera]);

    // Detect drag vs click
    const mouseDownPos = useRef({ x: 0, y: 0 });
    const handlePointerDown = useCallback((e: React.MouseEvent) => {
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        handleMouseDown(e);
    }, [handleMouseDown]);

    const handlePointerUp = useCallback((e: React.MouseEvent) => {
        const dx = Math.abs(e.clientX - mouseDownPos.current.x);
        const dy = Math.abs(e.clientY - mouseDownPos.current.y);
        handleMouseUp();
        if (dx < 5 && dy < 5) {
            handleClick(e);
        }
    }, [handleMouseUp, handleClick]);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510', color: 'var(--text-tertiary)' }}>
                불러오는 중...
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#050510', cursor: dragRef.current.dragging ? 'grabbing' : 'grab' }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                onMouseDown={handlePointerDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            />

            {/* Top UI overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem clamp(1rem, 4vw, 2rem)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', pointerEvents: 'auto' }}>
                        <img src="/logo.svg" alt="Astera" style={{ width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>Astera</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'auto' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{user?.name}님</span>
                        <button onClick={logout} style={{
                            padding: '0.35rem 0.8rem', fontSize: '0.75rem',
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px', color: 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>로그아웃</button>
                    </div>
                </div>
            </div>

            {/* New constellation button */}
            <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <Link to="/capture">
                    <button style={{
                        padding: '0.75rem 2rem', fontSize: '0.85rem',
                        background: 'var(--accent)', border: 'none',
                        borderRadius: '10px', color: '#121212',
                        fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 20px rgba(131, 178, 224, 0.25)',
                    }}>
                        + 새 별자리
                    </button>
                </Link>
            </div>

            {/* Empty state */}
            {sessions.length === 0 && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', zIndex: 5, pointerEvents: 'none',
                }}>
                    <img src="/logo.svg" alt="" style={{ width: '48px', height: '48px', opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem' }}>아직 만든 별자리가 없어요</p>
                    <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.75rem', marginTop: '0.3rem' }}>아래 버튼으로 첫 별자리를 만들어보세요</p>
                </div>
            )}

            {/* Zoom controls */}
            <div style={{
                position: 'absolute', bottom: '2rem', right: '1.5rem', zIndex: 10,
                display: 'flex', flexDirection: 'column', gap: '0.25rem',
            }}>
                <button onClick={() => setCamera(p => ({ ...p, zoom: Math.min(3, p.zoom * 1.2) }))} style={zoomBtnStyle}>+</button>
                <button onClick={() => setCamera(p => ({ ...p, zoom: Math.max(0.3, p.zoom * 0.8) }))} style={zoomBtnStyle}>−</button>
            </div>

            {/* Selected constellation card */}
            {selected && (
                <div
                    style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)', zIndex: 20,
                        background: 'rgba(20, 22, 35, 0.95)', backdropFilter: 'blur(16px)',
                        border: 'none',
                        borderRadius: '16px', padding: '2rem',
                        maxWidth: '380px', width: '90%',
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {selected.session.title || '무제 별자리'}
                        </h2>
                        <button onClick={() => setSelected(null)} style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                            fontSize: '1.2rem', cursor: 'pointer', padding: '0',
                        }}>✕</button>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
                        {selected.stars.length}개 · {new Date(selected.session.createdAt).toLocaleDateString('ko-KR')}
                    </div>

                    {selected.stars.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                            {selected.stars.map(star => (
                                <span key={star.id} style={{
                                    padding: '0.3rem 0.7rem', fontSize: '0.75rem',
                                    background: 'rgba(131, 178, 224, 0.1)',
                                    border: '1px solid rgba(131, 178, 224, 0.15)',
                                    borderRadius: '20px', color: 'rgba(255,255,255,0.6)',
                                }}>
                                    {star.keyword}
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => navigate(`/session/${selected.session.id}`)}
                        style={{
                            width: '100%', padding: '0.7rem', fontSize: '0.85rem',
                            background: 'var(--accent)', border: 'none',
                            borderRadius: '8px', color: '#121212',
                            fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        별자리 보기
                    </button>
                </div>
            )}

            {/* Click overlay to close card */}
            {selected && (
                <div
                    style={{ position: 'absolute', inset: 0, zIndex: 15 }}
                    onClick={() => setSelected(null)}
                />
            )}
        </div>
    );
}

const zoomBtnStyle: React.CSSProperties = {
    width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '6px', color: 'rgba(255,255,255,0.5)',
    fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
};
