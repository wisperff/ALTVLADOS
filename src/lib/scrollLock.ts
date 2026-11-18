type SavedScrollStyles = {
  overflow: string;
  paddingRight: string;
  overscrollBehavior: string;
  compensation: string;
  compensationPriority: string;
};

const locks = new Set<symbol>();
let saved: SavedScrollStyles | undefined;

// Menu and ticket dialog may overlap during a single React commit.
export function lockBodyScroll(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  const token = Symbol('scroll-lock');
  const body = document.body;
  const root = document.documentElement;

  if (locks.size === 0) {
    saved = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
      overscrollBehavior: body.style.overscrollBehavior,
      compensation: root.style.getPropertyValue('--scrollbar-compensation'),
      compensationPriority: root.style.getPropertyPriority('--scrollbar-compensation'),
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
  }

  locks.add(token);
  return () => {
    if (!locks.delete(token) || locks.size !== 0 || !saved) return;
    body.style.overflow = saved.overflow;
    body.style.paddingRight = saved.paddingRight;
    body.style.overscrollBehavior = saved.overscrollBehavior;
    if (saved.compensation) {
      root.style.setProperty('--scrollbar-compensation', saved.compensation, saved.compensationPriority);
    } else {
      root.style.removeProperty('--scrollbar-compensation');
    }
    saved = undefined;
  };
}
