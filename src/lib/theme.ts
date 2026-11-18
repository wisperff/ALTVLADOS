'use client';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ColorTheme = Exclude<ThemeMode, 'auto'>;

export const THEME_STORAGE_KEY = 'altzavod-theme';
const THEME_EVENT = 'altzavod:theme-change';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: light)';

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function readStoredMode(): ThemeMode {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : 'auto';
  } catch {
    // Private browsing and embedded browsers may deny access to localStorage.
    return 'auto';
  }
}

export function getThemeMode(): ThemeMode {
  const mode = document.documentElement.dataset.themeMode;
  return isThemeMode(mode) ? mode : 'auto';
}

export function getServerThemeMode(): ThemeMode {
  return 'auto';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const theme: ColorTheme = mode === 'auto'
    ? (window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'light' : 'dark')
    : mode;

  root.dataset.theme = theme;
  root.dataset.themeMode = mode;
  root.style.colorScheme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    meta.content = theme === 'light' ? '#efede8' : '#09090b';
    meta.removeAttribute('media');
  });
}

export function setThemeMode(mode: ThemeMode) {
  applyTheme(mode);
  try {
    if (mode === 'auto') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // The chosen theme still works for this visit when persistence is blocked.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeToTheme(onChange: () => void) {
  const system = window.matchMedia(SYSTEM_THEME_QUERY);
  const onSystemChange = () => {
    if (getThemeMode() === 'auto') applyTheme('auto');
  };
  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(readStoredMode());
    onChange();
  };

  // The head script initializes this before paint; this also covers CSP/no-script
  // fallbacks without changing the server snapshot used for hydration.
  if (!isThemeMode(document.documentElement.dataset.themeMode)) applyTheme(readStoredMode());
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onStorageChange);
  if (typeof system.addEventListener === 'function') system.addEventListener('change', onSystemChange);
  else system.addListener(onSystemChange);

  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onStorageChange);
    if (typeof system.removeEventListener === 'function') system.removeEventListener('change', onSystemChange);
    else system.removeListener(onSystemChange);
  };
}
