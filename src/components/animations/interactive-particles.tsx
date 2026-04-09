'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseX: number;
  baseY: number;
  phase: number;
}

interface InteractiveParticlesProps {
  className?: string;
  particleCount?: number;
  interactive?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = [
  'rgba(210, 102, 69, 0.6)',  // terracotta
  'rgba(210, 102, 69, 0.3)',  // terracotta faint
  'rgba(168, 85, 247, 0.5)',  // purple
  'rgba(168, 85, 247, 0.25)', // purple faint
  'rgba(255, 255, 255, 0.08)', // white ghost
  'rgba(255, 255, 255, 0.04)', // white ultra faint
];

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

function isReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function InteractiveParticles({
  className = '',
  particleCount,
  interactive = true,
  colors = DEFAULT_COLORS,
}: InteractiveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const rafRef = useRef<number>(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const getCount = useCallback(() => {
    if (particleCount) return particleCount;
    if (typeof window === 'undefined') return 200;
    if (window.innerWidth < 640) return 80;
    if (window.innerWidth < 1024) return 150;
    return 280;
  }, [particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = isReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      const count = getCount();
      particlesRef.current = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y,
          baseX: x, baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    function drawParticles(time: number) {
      ctx!.clearRect(0, 0, w, h);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const interactRadius = 140;
      const mobile = isMobile();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reduced) {
          // Organic sine drift
          p.x += p.vx + Math.sin(time * 0.001 + p.phase) * 0.15;
          p.y += p.vy + Math.cos(time * 0.0008 + p.phase) * 0.15;

          // Mouse repulsion
          if (interactive && mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < interactRadius && dist > 0) {
              const force = (interactRadius - dist) / interactRadius;
              const angle = Math.atan2(dy, dx);
              p.x += Math.cos(angle) * force * 3;
              p.y += Math.sin(angle) * force * 3;
            }
          }

          // Gentle spring back toward base position
          p.x += (p.baseX - p.x) * 0.003;
          p.y += (p.baseY - p.y) * 0.003;

          // Wrap edges
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }

        // Draw particle
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();
      }

      // Connection lines (desktop only, limited)
      if (!mobile && !reduced) {
        const maxDist = 100;
        ctx!.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          let connections = 0;
          for (let j = i + 1; j < particles.length && connections < 2; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.06;
              ctx!.strokeStyle = `rgba(255,255,255,${alpha})`;
              ctx!.beginPath();
              ctx!.moveTo(particles[i].x, particles[i].y);
              ctx!.lineTo(particles[j].x, particles[j].y);
              ctx!.stroke();
              connections++;
            }
          }
        }
      }

      if (!reduced) {
        rafRef.current = requestAnimationFrame(drawParticles);
      }
    }

    resize();
    initParticles();

    if (reduced) {
      // Draw once, static
      drawParticles(0);
    } else {
      rafRef.current = requestAnimationFrame(drawParticles);
    }

    // Mouse/touch handlers
    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    }
    function onMouseLeave() {
      mouseRef.current = { ...mouseRef.current, active: false };
    }
    function onTouchMove(e: TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top, active: true };
    }
    function onTouchEnd() {
      mouseRef.current = { ...mouseRef.current, active: false };
    }

    if (interactive) {
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
      canvas.addEventListener('touchmove', onTouchMove, { passive: true });
      canvas.addEventListener('touchend', onTouchEnd);
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      resize();
      initParticles();
    });
    resizeObserverRef.current.observe(canvas.parentElement!);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      resizeObserverRef.current?.disconnect();
    };
  }, [colors, getCount, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto ${className}`}
      style={{ display: 'block' }}
    />
  );
}
