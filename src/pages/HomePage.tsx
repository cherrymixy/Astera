import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SessionData, ConstellationData, Star, Connection } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../api/client';

interface MapConstellation {
    session: SessionData;
    stars: Star[];
    connections: Connection[];
    cx: number;
    cy: number;
}

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;

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

    // Touch refs for mobile
    const touchRef = useRef<{
        mode: 'none' | 'pan' | 'pinch';
        startX: number; startY: number;
        camX: number; camY: number;
        initialDist: number; initialZoom: number;
    }>({ mode: 'none', startX: 0, startY: 0, camX: 0, camY: 0, initialDist: 0, initialZoom: 1 });

    useEffect(() => {
        fetchAPI<{ success: boolean; data: SessionData[] }>('/api/sessions')
            .then(res => setSessions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Build map constellations from sessions — random placement with collision avoidance
    useEffect(() => {
        if (sessions.length === 0) {
            constellationsRef.current = [];
            return;
        }

        const mapConstellations: MapConstellation[] = [];
        const placed: { x: number; y: number }[] = [];
        const minDist = 500; // minimum distance between constellations

        sessions.forEach((session) => {
            let stars: Star[] = [];
            let connections: Connection[] = [];
            try {
                const c: ConstellationData = JSON.parse(session.constellationJson);
                stars = c.stars || [];
                connections = c.connections || [];
            } catch { }

            // Random placement with collision avoidance
            let cx = 0, cy = 0, tries = 0;
            const range = Math.max(800, sessions.length * 350);
            do {
                cx = (Math.random() - 0.5) * range;
                cy = (Math.random() - 0.5) * range;
                tries++;
            } while (
                tries < 100 &&
                placed.some(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) < minDist)
            );
            placed.push({ x: cx, y: cy });

            mapConstellations.push({ session, stars, connections, cx, cy });
        });

        constellationsRef.current = mapConstellations;

        // Center camera on all constellations
        if (mapConstellations.length > 0) {
            const avgX = mapConstellations.reduce((s, c) => s + c.cx, 0) / mapConstellations.length;
            const avgY = mapConstellations.reduce((s, c) => s + c.cy, 0) / mapConstellations.length;
            // Auto-zoom to fit all
            let maxSpread = 1;
            mapConstellations.forEach(c => {
                const dist = Math.sqrt((c.cx - avgX) ** 2 + (c.cy - avgY) ** 2);
                if (dist > maxSpread) maxSpread = dist;
            });
            const fitZoom = Math.min(1, 400 / (maxSpread + 200));
            setCamera({ x: -avgX, y: -avgY, zoom: Math.max(MIN_ZOOM, fitZoom) });
        }
    }, [sessions]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0, h = 0;
        const dpr = window.devicePixelRatio || 1;
        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        // Background stars — huge area
        interface BGStar { x: number; y: number; s: number; b: number; speed: number; phase: number; }
        const bgStars: BGStar[] = [];
        for (let i = 0; i < 800; i++) {
            bgStars.push({
                x: Math.random() * 40000 - 20000,
                y: Math.random() * 40000 - 20000,
                s: Math.random() * 1.5 + 0.5,
                b: 0.15 + Math.random() * 0.35,
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
                const { stars, connections, cx: mapX, cy: mapY } = constellation;
                if (stars.length === 0) return;

                // Screen-space positions
                const screenStars = stars.map(star => ({
                    sx: cx + (mapX + star.x * 1.5) * z,
                    sy: cy + (mapY + star.y * 1.5) * z,
                    star,
                }));

                // Frustum cull: skip if completely offscreen
                const anyVisible = screenStars.some(s =>
                    s.sx > -100 && s.sx < w + 100 && s.sy > -100 && s.sy < h + 100
                );
                if (!anyVisible) return;

                // Connections
                connections.forEach(conn => {
                    const from = screenStars.find(s => s.star.id === conn.from);
                    const to = screenStars.find(s => s.star.id === conn.to);
                    if (!from || !to) return;
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = 'rgba(160, 185, 210, 0.45)';
                    ctx.lineWidth = Math.max(1, 2.5 * z);
                    ctx.beginPath();
                    ctx.moveTo(from.sx, from.sy);
                    ctx.lineTo(to.sx, to.sy);
                    ctx.stroke();
                });

                // Stars
                screenStars.forEach(({ sx, sy, star }) => {
                    const r = Math.max(2, (star.size * 3 + 4) * Math.max(z, 0.4));

                    // Glow
                    ctx.globalAlpha = 0.4 * star.brightness;
                    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4);
                    glow.addColorStop(0, 'rgba(180, 200, 225, 0.3)');
                    glow.addColorStop(1, 'transparent');
                    ctx.fillStyle = glow;
                    ctx.fillRect(sx - r * 4, sy - r * 4, r * 8, r * 8);

                    // Core
                    ctx.globalAlpha = 0.9 * star.brightness;
                    ctx.fillStyle = '#e8f0ff';
                    ctx.beginPath();
                    ctx.arc(sx, sy, r, 0, Math.PI * 2);
                    ctx.fill();
                });
            });

            ctx.globalAlpha = 1;
            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, [camera]);

    // === Mouse handlers ===
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

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setCamera(prev => ({
            ...prev,
            zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * factor)),
        }));
    }, []);

    // === Touch handlers for mobile ===
    const getTouchDist = (t1: React.Touch, t2: React.Touch) =>
        Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
            // Pinch zoom
            const dist = getTouchDist(e.touches[0], e.touches[1]);
            touchRef.current = {
                mode: 'pinch',
                startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                camX: camera.x, camY: camera.y,
                initialDist: dist, initialZoom: camera.zoom,
            };
        } else if (e.touches.length === 1) {
            // Pan
            touchRef.current = {
                mode: 'pan',
                startX: e.touches[0].clientX, startY: e.touches[0].clientY,
                camX: camera.x, camY: camera.y,
                initialDist: 0, initialZoom: camera.zoom,
            };
        }
    }, [camera]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        const t = touchRef.current;
        if (t.mode === 'pinch' && e.touches.length === 2) {
            const dist = getTouchDist(e.touches[0], e.touches[1]);
            const scale = dist / t.initialDist;
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, t.initialZoom * scale));
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = (midX - t.startX) / newZoom;
            const dy = (midY - t.startY) / newZoom;
            setCamera({ x: t.camX + dx, y: t.camY + dy, zoom: newZoom });
        } else if (t.mode === 'pan' && e.touches.length === 1) {
            const dx = (e.touches[0].clientX - t.startX) / camera.zoom;
            const dy = (e.touches[0].clientY - t.startY) / camera.zoom;
            setCamera(prev => ({ ...prev, x: t.camX + dx, y: t.camY + dy }));
        }
    }, [camera.zoom]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        // Detect tap for selection
        if (touchRef.current.mode === 'pan' && e.changedTouches.length === 1) {
            const t = e.changedTouches[0];
            const dx = Math.abs(t.clientX - touchRef.current.startX);
            const dy = Math.abs(t.clientY - touchRef.current.startY);
            if (dx < 10 && dy < 10) {
                // Tap → find constellation
                const canvas = canvasRef.current;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const mx = t.clientX - rect.left;
                    const my = t.clientY - rect.top;
                    const w = canvas.clientWidth;
                    const h = canvas.clientHeight;
                    const screenCx = w / 2 + camera.x * camera.zoom;
                    const screenCy = h / 2 + camera.y * camera.zoom;
                    const z = camera.zoom;

                    let found: MapConstellation | null = null;
                    let minD = Infinity;
                    constellationsRef.current.forEach(constellation => {
                        constellation.stars.forEach(star => {
                            const sx = screenCx + (constellation.cx + star.x * 1.5) * z;
                            const sy = screenCy + (constellation.cy + star.y * 1.5) * z;
                            const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
                            if (d < 40 && d < minD) { minD = d; found = constellation; }
                        });
                    });
                    setSelected(found);
                }
            }
        }
        touchRef.current.mode = 'none';
    }, [camera]);

    // Click to select constellation (desktop)
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (dragRef.current.dragging) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const screenCx = w / 2 + camera.x * camera.zoom;
        const screenCy = h / 2 + camera.y * camera.zoom;
        const z = camera.zoom;

        let found: MapConstellation | null = null;
        let minDist = Infinity;
        constellationsRef.current.forEach(constellation => {
            constellation.stars.forEach(star => {
                const sx = screenCx + (constellation.cx + star.x * 1.5) * z;
                const sy = screenCy + (constellation.cy + star.y * 1.5) * z;
                const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
                if (dist < 30 && dist < minDist) { minDist = dist; found = constellation; }
            });
        });
        setSelected(found);
    }, [camera]);

    // Detect drag vs click (desktop)
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
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#050510', cursor: dragRef.current.dragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                onMouseDown={handlePointerDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
                <button onClick={() => setCamera(p => ({ ...p, zoom: Math.min(MAX_ZOOM, p.zoom * 1.2) }))} style={zoomBtnStyle}>+</button>
                <button onClick={() => setCamera(p => ({ ...p, zoom: Math.max(MIN_ZOOM, p.zoom * 0.8) }))} style={zoomBtnStyle}>−</button>
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
                            {selected.stars[0]?.keyword || selected.session.title || '무제 별자리'}
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
                                    background: 'rgba(131, 178, 224, 0.08)',
                                    border: '1px solid rgba(131, 178, 224, 0.12)',
                                    borderRadius: '20px', color: 'rgba(255,255,255,0.5)',
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
