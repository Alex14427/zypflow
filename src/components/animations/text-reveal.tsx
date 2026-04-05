'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useInView } from 'framer-motion';

interface TextRevealProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  staggerChildren?: number;
}

export function TextReveal({
  children,
  className = '',
  as: Tag = 'h1',
  delay = 0,
  staggerChildren = 0.035,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const words = children.split(' ');

  return (
    <Tag className={className} ref={ref as React.RefObject<HTMLHeadingElement>}>
      <motion.span
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{
          visible: { transition: { staggerChildren, delayChildren: delay } },
          hidden: {},
        }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.3em' }}
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`} style={{ overflow: 'hidden', display: 'inline-block' }}>
            <motion.span
              style={{ display: 'inline-block' }}
              variants={{
                hidden: { y: '110%', opacity: 0, rotateX: 45 },
                visible: {
                  y: '0%',
                  opacity: 1,
                  rotateX: 0,
                  transition: {
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  },
                },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
