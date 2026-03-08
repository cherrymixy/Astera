import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Star, Connection } from '../types';

interface ConstellationCanvasProps {
    stars: Star[];
    connections: Connection[];
    animated?: boolean;
    interactive?: boolean;
    fillParent?: boolean;
}

function generateBackgroundStars(count: number, w: number, h: number) {
    const bgStars: { x: number; y: number; size: number; twinkleSpeed: number; twinkleOffset: number }[] = [];
    for (let i = 0; i < count; i++) {
        bgStars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 1.5 + 0.3,
            twinkleSpeed: 0.5 + Math.random() * 2,
            twinkleOffset: Math.random() * Math.PI * 2,
        });
    }
    return bgStars;
}

export default function ConstellationCanvas({
    stars,
    connections,
    animated = true,
    interactive = true,
    fillParent = false,
}: ConstellationCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const backgroundStars = useMemo(
        () => generateBackgroundStars(120, dimensions.width, dimensions.height),
        [dimensions.width, dimensions.height]
    );

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const maxWidth = Math.min(containerWidth, 900);
                let h: number;
                if (fillParent && containerRef.current.parentElement) {
                    h = containerRef.current.parentElement.offsetHeight;
                } else {
                    h = Math.max(300, Math.min(maxWidth * 0.75, 650));
                }
                setDimensions({ width: maxWidth, height: h });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => {
            window.removeEventListener('resize', updateDimensions);
            resizeObserver.disconnect();
        };
    }, []);

    const { width, height } = dimensions;

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    }, []);

    const handleMouseLeave = useCallback(() => {
        mouseRef.current.active = false;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || e.touches.length === 0) return;
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top, active: true };
    }, []);

    const handleTouchEnd = useCallback(() => {
        mouseRef.current.active = false;
    }, []);

    const starMap = useMemo(() => {
        const map = new Map<string, Star>();
        stars.forEach(s => map.set(s.id, s));
        return map;
    }, [stars]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width === 0 || height === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const time = (currentTime - startTime) * 0.001;
            const mouse = mouseRef.current;

            const bgGrad = ctx.createRadialGradient(
                width * 0.5, height * 0.4, 0,
                width * 0.5, height * 0.4, Math.max(width, height) * 0.8
            );
            bgGrad.addColorStop(0, '#0a0a16');
            bgGrad.addColorStop(0.5, '#070710');
            bgGrad.addColorStop(1, '#04040c');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            backgroundStars.forEach(bg => {
                const alpha = animated
                    ? 0.3 + 0.5 * Math.sin(time * bg.twinkleSpeed + bg.twinkleOffset) ** 2
                    : 0.5;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(bg.x, bg.y, bg.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            connections.forEach(conn => {
                const fromStar = starMap.get(conn.from);
                const toStar = starMap.get(conn.to);
                if (!fromStar || !toStar) return;

                const fx = (fromStar.x / 800) * width;
                const fy = (fromStar.y / 600) * height;
                const tx = (toStar.x / 800) * width;
                const ty = (toStar.y / 600) * height;

                ctx.save();
                ctx.globalAlpha = animated
                    ? 0.25 + 0.1 * Math.sin(time * 0.8)
                    : 0.3;
                ctx.strokeStyle = 'rgba(160, 185, 210, 0.4)';
                ctx.lineWidth = 1;
                ctx.shadowColor = 'rgba(131, 178, 224, 0.2)';
                ctx.shadowBlur = 3;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                ctx.restore();
            });

            stars.forEach((star, idx) => {
                const sx = (star.x / 800) * width;
                const sy = (star.y / 600) * height;

                let isHovered = false;
                let hoverInfluence = 0;
                if (interactive && mouse.active) {
                    const dx = mouse.x - sx;
                    const dy = mouse.y - sy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        isHovered = true;
                        hoverInfluence = 1 - dist / 80;
                    }
                }

                const baseSize = star.size * 3;
                const twinkle = animated ? Math.sin(time * 2 + idx * 1.5) * 0.5 + 0.5 : 0.7;
                const hoverScale = isHovered ? 1 + hoverInfluence * 0.8 : 1;
                const renderSize = (baseSize + twinkle * 2) * hoverScale;

                ctx.save();
                const glowRadius = renderSize * 4;
                const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
                const glowAlpha = (0.15 + twinkle * 0.1) * star.brightness;
                glow.addColorStop(0, `rgba(180, 200, 225, ${glowAlpha})`);
                glow.addColorStop(0.3, `rgba(131, 178, 224, ${glowAlpha * 0.5})`);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.fillRect(sx - glowRadius, sy - glowRadius, glowRadius * 2, glowRadius * 2);

                ctx.globalAlpha = star.brightness;
                ctx.fillStyle = isHovered ? '#ffffff' : `hsl(210, ${30 + idx * 3}%, ${82 + twinkle * 12}%)`;
                ctx.shadowColor = 'rgba(180, 200, 225, 0.5)';
                ctx.shadowBlur = renderSize * 1.5;
                ctx.beginPath();
                ctx.arc(sx, sy, renderSize, 0, Math.PI * 2);
                ctx.fill();

                if (star.size > 1.5) {
                    ctx.globalAlpha = (0.3 + twinkle * 0.2) * star.brightness;
                    ctx.strokeStyle = 'rgba(180, 200, 220, 0.4)';
                    ctx.lineWidth = 0.5;
                    const rayLen = renderSize * 3;
                    ctx.beginPath();
                    ctx.moveTo(sx - rayLen, sy);
                    ctx.lineTo(sx + rayLen, sy);
                    ctx.moveTo(sx, sy - rayLen);
                    ctx.lineTo(sx, sy + rayLen);
                    ctx.stroke();
                }

                const showLabel = isHovered || !animated;
                if (showLabel) {
                    ctx.globalAlpha = isHovered ? 1 : 0.7;
                    ctx.fillStyle = '#d8e0ee';
                    ctx.font = `${isHovered ? 14 : 12}px 'Space Grotesk', 'Noto Sans KR', sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    ctx.shadowBlur = 6;
                    ctx.fillText(star.keyword, sx, sy - renderSize - 10);
                }

                ctx.restore();
            });

            if (interactive && mouse.active) {
                ctx.save();
                const cursorGlow = ctx.createRadialGradient(
                    mouse.x, mouse.y, 0,
                    mouse.x, mouse.y, 60
                );
                cursorGlow.addColorStop(0, 'rgba(131, 178, 224, 0.05)');
                cursorGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = cursorGlow;
                ctx.fillRect(mouse.x - 60, mouse.y - 60, 120, 120);
                ctx.restore();
            }

            const vignette = ctx.createRadialGradient(
                width / 2, height / 2, Math.min(width, height) * 0.35,
                width / 2, height / 2, Math.min(width, height) * 0.75
            );
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, 'rgba(4, 4, 12, 0.4)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);

            if (animated) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        if (animated) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            animate(performance.now());
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [width, height, stars, connections, starMap, backgroundStars, animated, interactive]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', maxWidth: '900px', margin: '0 auto', height: fillParent ? '100%' : 'auto' }}
        >
            <canvas
                ref={canvasRef}
                onMouseMove={interactive ? handleMouseMove : undefined}
                onMouseLeave={interactive ? handleMouseLeave : undefined}
                onTouchMove={interactive ? handleTouchMove : undefined}
                onTouchEnd={interactive ? handleTouchEnd : undefined}
                onTouchCancel={interactive ? handleTouchEnd : undefined}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    borderRadius: '16px',
                    cursor: interactive ? 'crosshair' : 'default',
                    touchAction: 'none',
                }}
            />
        </div>
    );
}
