'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GsapRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Animation preset */
  variant?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'clip';
  /** Delay in seconds */
  delay?: number;
  /** Duration in seconds */
  duration?: number;
  /** How far into the viewport before triggering (0-1) */
  start?: string;
}

const VARIANTS = {
  'fade-up': { from: { y: 60, opacity: 0 }, to: { y: 0, opacity: 1 } },
  'fade-left': { from: { x: -60, opacity: 0 }, to: { x: 0, opacity: 1 } },
  'fade-right': { from: { x: 60, opacity: 0 }, to: { x: 0, opacity: 1 } },
  'scale': { from: { scale: 0.9, opacity: 0 }, to: { scale: 1, opacity: 1 } },
  'clip': { from: { clipPath: 'inset(100% 0% 0% 0%)' }, to: { clipPath: 'inset(0% 0% 0% 0%)' } },
};

export function GsapReveal({
  children,
  className,
  variant = 'fade-up',
  delay = 0,
  duration = 0.8,
  start = 'top 85%',
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { from, to } = VARIANTS[variant];

    gsap.fromTo(el, from, {
      ...to,
      duration,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [variant, delay, duration, start]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
