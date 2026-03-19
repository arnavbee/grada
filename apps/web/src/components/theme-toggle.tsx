'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

function applyTheme(nextTheme: ThemeMode): void {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('grada-theme', nextTheme);
}

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const resolvedTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(resolvedTheme);
  }, []);

  function handleThemeChange(nextTheme: ThemeMode): void {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className='theme-toggle theme-toggle-icon kira-focus-ring fixed right-4 top-4 z-[140] shadow-2xl md:right-6 md:top-6'
      onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      type='button'
    >
      <span aria-hidden='true'>{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}
