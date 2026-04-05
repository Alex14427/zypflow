'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  className = '',
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasStarted, setHasStarted] = useState(false);

  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true);
      spring.set(value);
    }
  }, [isInView, hasStarted, spring, value]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <motion.span>{hasStarted ? display : 0}</motion.span>
      {suffix}
    </motion.span>
  );
}
