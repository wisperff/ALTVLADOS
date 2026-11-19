'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { site } from '@/data/site';
import { getServerColorTheme, getColorTheme, subscribeToTheme } from '@/lib/theme';
import { createThemeTransitionController } from '@/lib/themeTransition';

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getColorTheme, getServerColorTheme);
  const transition = useRef<ReturnType<typeof createThemeTransitionController> | null>(null);
  useEffect(() => () => transition.current?.cancel(), []);
  const copy = site.ui.theme;
  const label = theme === 'light' ? copy.switchToDark : copy.switchToLight;

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={event => {
        transition.current ??= createThemeTransitionController();
        transition.current.toggle(event.currentTarget);
      }}
    >
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
