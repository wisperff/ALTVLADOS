'use client';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ColorTheme = Exclude<ThemeMode, 'auto'>;

export const THEME_STORAGE_KEY = 'altzavod-theme';
const THEME_EVENT = 'altzavod:theme-change';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: light)';
// Keep this visit's explicit choice when storage is denied or full. It must
// survive StrictMode resubscriptions and later mounts of the theme control.
let transientMode: ThemeMode | undefined;

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'auto' || value === 'light' || value === 'dark';
}

function readStoredMode(): ThemeMode | undefined {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : 'auto';
  } catch {
    // Private browsing and embedded browsers may deny access to localStorage.
    // An unreadable value must not erase a preference the head script obtained.
    return undefined;
  }
}

export function getThemeMode(): ThemeMode {
  const mode = document.documentElement.dataset.themeMode;
  return isThemeMode(mode) ? mode : 'auto';
}

export function getColorTheme(): ColorTheme {
  const theme = document.documentElement.dataset.theme;
  if (theme === 'light' || theme === 'dark') return theme;
  const mode = getThemeMode();
  return mode === 'auto'
    ? (window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'light' : 'dark')
    : mode;
}

export function getServerColorTheme(): ColorTheme {
  return 'dark';
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
    transientMode = undefined;
  } catch {
    // The chosen theme still works for this visit when persistence is blocked.
    transientMode = mode;
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function subscribeToTheme(onChange: () => void) {
  const system = window.matchMedia(SYSTEM_THEME_QUERY);
  const onSystemChange = () => {
    if (getThemeMode() !== 'auto') return;
    applyTheme('auto');
    onChange();
  };
  const onStorageChange = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    transientMode = undefined;
    applyTheme(readStoredMode() ?? getThemeMode());
    onChange();
  };

  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onStorageChange);
  if (typeof system.addEventListener === 'function') system.addEventListener('change', onSystemChange);
  else system.addListener(onSystemChange);

  // A preference can change between the head script and hydration. Subscribe
  // first, then reconcile so that neither this gap nor a missing script leaves
  // an old palette active. Failed writes retain the newer in-session choice.
  applyTheme(transientMode ?? readStoredMode() ?? getThemeMode());

  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onStorageChange);
    if (typeof system.removeEventListener === 'function') system.removeEventListener('change', onSystemChange);
    else system.removeListener(onSystemChange);
  };
}
