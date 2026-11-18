type InlineStyle = [property: string, value: string, priority: string];
type SavedScrollStyles = {
  bodyStyles: InlineStyle[];
  compensation: InlineStyle;
  fixed: boolean;
  x: number;
  y: number;
};

const bodyProperties = ['overflow', 'padding-right', 'overscroll-behavior', 'position', 'top', 'left', 'right', 'width'];

function readStyle(style: CSSStyleDeclaration, property: string): InlineStyle {
  return [property, style.getPropertyValue(property), style.getPropertyPriority(property)];
}

function restoreStyle(style: CSSStyleDeclaration, [property, value, priority]: InlineStyle) {
  if (value) style.setProperty(property, value, priority);
  else style.removeProperty(property);
}

const locks = new Set<symbol>();
let saved: SavedScrollStyles | undefined;

// Menu and ticket dialog may overlap during a single React commit.
export function lockBodyScroll(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  const token = Symbol('scroll-lock');
  const body = document.body;
  const root = document.documentElement;

  if (locks.size === 0) {
    const fixed = window.matchMedia('(max-width: 1023px)').matches &&
      (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
    saved = {
      bodyStyles: bodyProperties.map(property => readStyle(body.style, property)),
      compensation: readStyle(root.style, '--scrollbar-compensation'),
      fixed,
      x: window.scrollX,
      y: window.scrollY,
    };
    const stableGutter = window.CSS?.supports?.('scrollbar-gutter', 'stable') ?? false;
    const scrollbar = Math.max(0, window.innerWidth - root.clientWidth);

    if (!stableGutter && scrollbar > 0) {
      const padding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${padding + scrollbar}px`;
      root.style.setProperty('--scrollbar-compensation', `${scrollbar}px`);
    }
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    if (fixed) {
      // iOS WebKit can scroll the page through overflow:hidden; freeze its viewport instead.
      body.style.position = 'fixed';
      body.style.top = `${-saved.y}px`;
      body.style.left = `${-saved.x}px`;
      body.style.right = '0';
      body.style.width = '100%';
    }
  }

  locks.add(token);
  return () => {
    if (!locks.delete(token) || locks.size !== 0 || !saved) return;
    const snapshot = saved;
    saved = undefined;
    snapshot.bodyStyles.forEach(style => restoreStyle(body.style, style));
    restoreStyle(root.style, snapshot.compensation);
    if (snapshot.fixed) {
      // Restore before focus/anchor navigation; the site's smooth scrolling must not animate this.
      const behavior = readStyle(root.style, 'scroll-behavior');
      root.style.setProperty('scroll-behavior', 'auto', 'important');
      try {
        window.scrollTo({ left: snapshot.x, top: snapshot.y, behavior: 'auto' });
      } finally {
        restoreStyle(root.style, behavior);
      }
    }
  };
}
