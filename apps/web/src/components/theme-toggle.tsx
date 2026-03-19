'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

function applyTheme(nextTheme: ThemeMode): void {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('grada-theme', nextTheme);
}

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolvedTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(resolvedTheme);
    setMounted(true);
  }, []);

  function handleToggle(): void {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={mounted ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : 'Toggle theme'}
      className='theme-toggle kira-focus-ring fixed right-4 top-4 z-[120] inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-panel md:right-6 md:top-6'
      onClick={handleToggle}
      type='button'
    >
      <span className='text-base leading-none'>{theme === 'dark' ? '☀' : '◐'}</span>
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
