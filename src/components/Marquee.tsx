'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Keep the existing CSS track moving only while it can be seen. */
export function Marquee({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ticker = ref.current;
    if (!ticker) return;

    let active = true;
    let nearby = true;
    let observer: IntersectionObserver | null = null;

    function sync() {
      if (!active) return;
      if (document.hidden || !nearby) ticker!.dataset.tickerPaused = 'true';
      else delete ticker!.dataset.tickerPaused;
    }

    document.addEventListener('visibilitychange', sync);
    sync();

    if (typeof window.IntersectionObserver === 'function') {
      try {
        observer = new window.IntersectionObserver((entries) => {
          if (!active || !observer) return;
          const entry = entries.find((item) => item.target === ticker);
          if (!entry) return;
          nearby = entry.isIntersecting;
          sync();
        }, { rootMargin: '64px 0px', threshold: 0 });
        observer.observe(ticker);
      } catch {
        // Embedded browsers without a working observer keep the CSS fallback.
        observer?.disconnect();
        observer = null;
        nearby = true;
        sync();
      }
    }

    return () => {
      active = false;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      delete ticker.dataset.tickerPaused;
    };
  }, []);

  return <div ref={ref} className="ticker" aria-hidden="true">{children}</div>;
}
