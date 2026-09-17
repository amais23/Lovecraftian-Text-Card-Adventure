import React, { useEffect, useRef } from 'react';

export interface CustomCursorAtmosphereProps {
  isMadness?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  glow: number;
  isMadness: boolean;
}

const GOLD_PALETTE = ['#e9c46a', '#ffd700', '#d4a373', '#f4a261', '#fefae0'];
const MADNESS_PALETTE = ['#9d4edd', '#c77dff', '#7b2cbf', '#e0aaff', '#5a189a'];

export const CustomCursorAtmosphere: React.FC<CustomCursorAtmosphereProps> = ({
  isMadness = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const madnessRef = useRef(isMadness);

  useEffect(() => {
    madnessRef.current = isMadness;
  }, [isMadness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        return;
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number | null = null;
    let particles: Particle[] = [];
    const MAX_PARTICLES = 35;
    let lastMoveTime = 0;
    let lastX = 0;
    let lastY = 0;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();

    const spawnParticle = (x: number, y: number, isBurst = false) => {
      if (particles.length >= MAX_PARTICLES && !isBurst) {
        return;
      }

      const madness = madnessRef.current;
      const palette = madness ? MADNESS_PALETTE : GOLD_PALETTE;
      const color = palette[Math.floor(Math.random() * palette.length)];

      const angle = Math.random() * Math.PI * 2;
      const speed = isBurst ? Math.random() * 2.4 + 0.8 : Math.random() * 0.8 + 0.2;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (madness ? (Math.random() - 0.5) * 0.5 : 0),
        vy: Math.sin(angle) * speed - (madness ? 0.3 : 0.6), // Normal drifts up, madness floats
        size: isBurst ? Math.random() * 3.5 + 2 : Math.random() * 2.2 + 1.2,
        color,
        alpha: isBurst ? 0.9 : 0.7,
        decay: isBurst ? 0.025 : 0.035,
        glow: isBurst ? 8 : 4,
        isMadness: madness,
      });

      if (!animFrameId) {
        loop();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Throttle: spawn at most every 40ms or when distance moved > 12px
      if (now - lastMoveTime > 40 || dist > 14) {
        lastMoveTime = now;
        lastX = e.clientX;
        lastY = e.clientY;
        spawnParticle(e.clientX, e.clientY, false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Spawn burst of 5-7 particles on click
      const count = 6;
      for (let i = 0; i < count; i++) {
        spawnParticle(e.clientX, e.clientY, true);
      }
    };

    const loop = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;

        ctx.beginPath();
        if (p.isMadness) {
          // Soft tendril / diamond particle
          ctx.arc(p.x, p.y, p.size * (1 + (0.7 - p.alpha)), 0, Math.PI * 2);
        } else {
          // Warm golden spark
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      }

      if (particles.length > 0) {
        animFrameId = requestAnimationFrame(loop);
      } else {
        animFrameId = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="custom-cursor-atmosphere"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
};
