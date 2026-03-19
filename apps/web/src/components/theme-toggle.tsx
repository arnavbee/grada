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

  function handleThemeChange(nextTheme: ThemeMode): void {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
      aria-label={mounted ? `Current theme: ${theme}` : 'Theme switcher'}
      className='theme-toggle fixed right-4 top-4 z-[140] flex items-center gap-2 rounded-full px-2 py-2 shadow-2xl md:right-6 md:top-6 md:gap-3'
      role='group'
    >
      <span className='hidden pl-2 text-[11px] font-semibold uppercase tracking-[0.18em] md:inline'>
        Theme
      </span>
      <div
        className='flex items-center gap-1 rounded-full p-1'
        style={{ background: 'var(--kira-toggle-track)' }}
      >
        <button
          aria-pressed={theme === 'light'}
          className='theme-toggle-option kira-focus-ring'
          data-active={theme === 'light'}
          onClick={() => handleThemeChange('light')}
          type='button'
        >
          <span>Light</span>
        </button>
        <button
          aria-pressed={theme === 'dark'}
          className='theme-toggle-option kira-focus-ring'
          data-active={theme === 'dark'}
          onClick={() => handleThemeChange('dark')}
          type='button'
        >
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
}
