'use client';

import { useEffect } from 'react';

/**
 * Lightweight smooth scroll enhancer.
 * Applies a CSS-only inertia feel without adding a heavy library like Lenis.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add smooth-scroll class to html for enhanced scroll feel
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return <>{children}</>;
}
