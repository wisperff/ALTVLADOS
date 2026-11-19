function pixels(value: string): number {
  const result = Number.parseFloat(value);
  return Number.isFinite(result) ? result : 0;
}

export function getAnchorTarget(href: string): HTMLElement | null {
  if (typeof document === 'undefined' || !href.startsWith('#') || href.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(href.slice(1)));
  } catch {
    return null;
  }
}

function focusTarget(target: HTMLElement) {
  const temporary = !target.hasAttribute('tabindex') && target.tabIndex < 0;
  if (temporary) {
    target.setAttribute('tabindex', '-1');
    const restore = () => {
      if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex');
      target.removeEventListener('blur', restore);
    };
    target.addEventListener('blur', restore, { once: true });
    target.focus({ preventScroll: true });
    if (document.activeElement !== target) restore();
  } else {
    target.focus({ preventScroll: true });
  }
}

// Called after a mobile menu has finished closing and released its body lock.
// Native scrolling remains interruptible; history/back/forward are browser-owned.
export function navigateToAnchor(href: string, block: 'start' | 'nearest' = 'start'): boolean {
  const target = getAnchorTarget(href);
  if (!target) return false;

  const x = window.scrollX;
  const y = window.scrollY;
  const root = document.documentElement;
  const behavior = root.style.getPropertyValue('scroll-behavior');
  const priority = root.style.getPropertyPriority('scroll-behavior');
  root.style.setProperty('scroll-behavior', 'auto', 'important');
  try {
    focusTarget(target);
    // Older WebViews can ignore preventScroll and inherit smooth focus motion.
    if (window.scrollX !== x || window.scrollY !== y) {
      window.scrollTo({ left: x, top: y, behavior: 'auto' });
    }
  } finally {
    if (behavior) root.style.setProperty('scroll-behavior', behavior, priority);
    else root.style.removeProperty('scroll-behavior');
  }
  const offset = pixels(window.getComputedStyle(root).scrollPaddingTop) +
    pixels(window.getComputedStyle(target).scrollMarginTop);
  const maximum = Math.max(0, root.scrollHeight - window.innerHeight);
  const destination = Math.max(0, Math.min(maximum, window.scrollY + target.getBoundingClientRect().top - offset));
  const hash = new URL(href, window.location.href).hash;

  if (window.location.hash !== hash) window.history.pushState(window.history.state, '', hash);
  if (block === 'nearest') {
    const rect = target.getBoundingClientRect();
    const bottom = window.innerHeight - pixels(window.getComputedStyle(root).scrollPaddingBottom) -
      pixels(window.getComputedStyle(target).scrollMarginBottom);
    const above = rect.top < offset - 2;
    const below = rect.bottom > bottom + 2;
    // Native nearest alignment leaves fully visible or viewport-spanning blocks in place.
    if (above !== below) {
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
    return true;
  }
  if (Math.abs(window.scrollY - destination) > 2) {
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
  return true;
}
