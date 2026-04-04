'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'zypflow-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const nextTheme = storedTheme === 'dark' || (!storedTheme && prefersDark.matches) ? 'dark' : 'light';
    setThemeState(nextTheme);
    applyTheme(nextTheme);

    const handleChange = (event: MediaQueryListEvent) => {
      const currentStoredTheme = window.localStorage.getItem(STORAGE_KEY);
      if (currentStoredTheme) return;

      const systemTheme = event.matches ? 'dark' : 'light';
      setThemeState(systemTheme);
      applyTheme(systemTheme);
    };

    prefersDark.addEventListener('change', handleChange);
    return () => prefersDark.removeEventListener('change', handleChange);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        setThemeState(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      },
      toggleTheme: () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setThemeState(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}
