'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };
  const ringX = useSpring(mouseX, springConfig);
  const ringY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Hide on touch devices
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setVisible(true);

    function onMove(e: MouseEvent) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }

    function onOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="drag"]');
      if (interactive) {
        if (interactive.hasAttribute('data-cursor')) {
          setDragging(interactive.getAttribute('data-cursor') === 'drag');
          setHovering(false);
        } else {
          setHovering(true);
          setDragging(false);
        }
      } else {
        setHovering(false);
        setDragging(false);
      }
    }

    function onLeave() {
      setVisible(false);
    }
    function onEnter() {
      setVisible(true);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
    };
  }, [mouseX, mouseY]);

  if (!visible) return null;

  const ringSize = hovering ? 48 : dragging ? 56 : 32;

  return (
    <>
      {/* Dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
        style={{
          width: 8,
          height: 8,
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      {/* Ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border border-white/60 mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: dragging ? 0.4 : 1,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      />
      {/* Drag label */}
      {dragging && (
        <motion.div
          className="pointer-events-none fixed left-0 top-0 z-[9999] text-[10px] font-semibold uppercase tracking-[0.2em] text-white mix-blend-difference"
          style={{
            x: ringX,
            y: ringY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Drag
        </motion.div>
      )}
      {/* Hide default cursor globally */}
      <style jsx global>{`
        * { cursor: none !important; }
      `}</style>
    </>
  );
}
