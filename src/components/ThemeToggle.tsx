'use client';

import { useSyncExternalStore } from 'react';
import { site } from '@/data/site';
import { getServerThemeMode, getThemeMode, setThemeMode, subscribeToTheme, type ThemeMode } from '@/lib/theme';

const nextMode: Record<ThemeMode, ThemeMode> = { auto: 'light', light: 'dark', dark: 'auto' };

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribeToTheme, getThemeMode, getServerThemeMode);
  const copy = site.ui.theme;
  const label = `${copy.label}: ${copy.modes[mode]}. ${copy.switchLabel}: ${copy.modes[nextMode[mode]]}`;

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => setThemeMode(nextMode[getThemeMode()])}
    >
      <svg className="theme-icon" data-mode="auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4v16a8 8 0 0 0 0-16Z" fill="currentColor" stroke="none" />
      </svg>
      <svg className="theme-icon" data-mode="light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
      <svg className="theme-icon" data-mode="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5a8.5 8.5 0 1 0 10.6 10.6Z" />
      </svg>
    </button>
  );
}
