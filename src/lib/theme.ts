import { site } from '@/data/site';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = site.theme.storageKey;

const themeColors: Record<Theme, string> = {
  dark: '#060706',
  light: '#f2f0e9',
};

const listeners = new Set<() => void>();
let transitionTimer: number | undefined;

function validatedTheme(value: string | null): Theme {
  return value === 'light' ? 'light' : 'dark';
}

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }

  meta.content = themeColors[theme];
}

function notifyListeners() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
  applyThemeToDocument(validatedTheme(event.newValue));
  notifyListeners();
}

export function subscribeTheme(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener('storage', onStorage);
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

export function getThemeSnapshot(): Theme {
  if (typeof document === 'undefined') return 'dark';

  return document.documentElement.dataset.theme === 'light'
    ? 'light'
    : 'dark';
}

export function getServerThemeSnapshot(): Theme {
  return 'dark';
}

export function setTheme(theme: Theme) {
  const nextTheme = validatedTheme(theme);
  const root = document.documentElement;

  root.setAttribute('data-theme-transition', '');

  if (transitionTimer !== undefined) {
    window.clearTimeout(transitionTimer);
  }

  applyThemeToDocument(nextTheme);

  transitionTimer = window.setTimeout(() => {
    root.removeAttribute('data-theme-transition');
    transitionTimer = undefined;
  }, 300);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // Switching still works when storage is blocked or full.
  }

  notifyListeners();
}

// Runs before the body is displayed and does not enable transitions.
const serializedKey = JSON.stringify(THEME_STORAGE_KEY)
  .replace(/</g, '\\u003c');

export const themeBootstrapScript = `(function(){var t='dark';try{var s=window.localStorage.getItem(${serializedKey});if(s==='light'||s==='dark')t=s;}catch(e){}var r=document.documentElement;r.removeAttribute('data-theme-transition');r.dataset.theme=t;r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}m.content=t==='light'?'#f2f0e9':'#060706';})();`;
