'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface HorizontalCarouselProps {
  children: ReactNode[];
  className?: string;
  cardWidth?: number;
  gap?: number;
}

export function HorizontalCarousel({
  children,
  className = '',
  cardWidth = 380,
  gap = 24,
}: HorizontalCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [maxDrag, setMaxDrag] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = children.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function calc() {
      const viewW = container!.clientWidth;
      const totalW = count * cardWidth + (count - 1) * gap;
      setMaxDrag(Math.max(0, totalW - viewW));
    }
    calc();

    const observer = new ResizeObserver(calc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [count, cardWidth, gap]);

  function snapToNearest() {
    const currentX = x.get();
    const snapWidth = cardWidth + gap;
    const idx = Math.round(-currentX / snapWidth);
    const clamped = Math.max(0, Math.min(idx, count - 1));
    setActiveIndex(clamped);
    animate(x, -clamped * snapWidth, { type: 'spring', damping: 30, stiffness: 300 });
  }

  function goTo(idx: number) {
    const snapWidth = cardWidth + gap;
    setActiveIndex(idx);
    animate(x, -idx * snapWidth, { type: 'spring', damping: 30, stiffness: 300 });
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="overflow-hidden" data-cursor="drag">
        <motion.div
          className="flex"
          style={{ x, gap }}
          drag="x"
          dragConstraints={{ left: -maxDrag, right: 0 }}
          dragElastic={0.1}
          onDragEnd={snapToNearest}
        >
          {children.map((child, i) => (
            <motion.div
              key={i}
              className="shrink-0"
              style={{ width: cardWidth }}
            >
              {child}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-8 bg-brand-purple'
                  : 'w-2 bg-[var(--app-text-soft)] hover:bg-[var(--app-text-muted)]'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
