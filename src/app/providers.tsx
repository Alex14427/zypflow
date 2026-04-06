'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast';
import { SmoothScroll } from '@/components/animations/smooth-scroll';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <ThemeProvider>
        <SmoothScroll>
          <ToastProvider>{children}</ToastProvider>
        </SmoothScroll>
      </ThemeProvider>
    </PHProvider>
  );
}
