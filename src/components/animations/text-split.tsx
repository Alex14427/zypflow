'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TextSplitProps {
  children: string;
  className?: string;
  /** Split by 'words' or 'chars' */
  splitBy?: 'words' | 'chars';
  /** Stagger delay between each element */
  stagger?: number;
  /** Animation style */
  variant?: 'rise' | 'blur' | 'slide';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function TextSplit({
  children,
  className,
  splitBy = 'words',
  stagger = 0.04,
  variant = 'rise',
  as: Tag = 'h2',
}: TextSplitProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Split text into spans
    const text = el.textContent || '';
    const units = splitBy === 'words' ? text.split(' ') : text.split('');
    el.innerHTML = units
      .map((unit) => {
        const content = splitBy === 'words' ? unit : unit === ' ' ? '&nbsp;' : unit;
        return `<span class="inline-block overflow-hidden"><span class="gsap-split-unit inline-block">${content}</span></span>${splitBy === 'words' ? ' ' : ''}`;
      })
      .join('');

    const targets = el.querySelectorAll('.gsap-split-unit');

    const fromVars =
      variant === 'blur'
        ? { y: 20, opacity: 0, filter: 'blur(8px)' }
        : variant === 'slide'
          ? { y: '110%' }
          : { y: 40, opacity: 0, rotateX: 30 };

    const toVars =
      variant === 'blur'
        ? { y: 0, opacity: 1, filter: 'blur(0px)' }
        : variant === 'slide'
          ? { y: '0%' }
          : { y: 0, opacity: 1, rotateX: 0 };

    gsap.fromTo(targets, fromVars, {
      ...toVars,
      duration: 0.7,
      stagger,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    return () => {
      ScrollTrigger.getAll()
        .filter((t) => t.trigger === el)
        .forEach((t) => t.kill());
    };
  }, [children, splitBy, stagger, variant]);

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
      {children}
    </Tag>
  );
}
