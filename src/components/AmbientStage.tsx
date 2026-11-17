'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function AmbientStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;

    if (!stage || typeof IntersectionObserver === 'undefined') return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );

    const desktop = window.matchMedia(
      '(min-width: 768px) and (hover: hover) and (pointer: fine)',
    );

    let visible = false;

    const sync = () => {
      stage.dataset.ambient = visible && desktop.matches &&
        !reducedMotion.matches && !document.hidden
        ? 'running'
        : 'still';
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0.05 });

    observer.observe(stage);

    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    desktop.addEventListener('change', sync);

    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      desktop.removeEventListener('change', sync);
      stage.dataset.ambient = 'still';
    };
  }, []);

  return (
    <div
      ref={ref}
      className="hero-art ambient-stage"
      data-ambient="still"
    >
      {children}

      <div className="stage-decoration" aria-hidden="true">
        <span className="stage-light" />
        <span className="stage-corner stage-corner-top" />
        <span className="stage-corner stage-corner-bottom" />

        <span className="stage-signal">
          <i /><i /><i /><i /><i />
        </span>

        <span className="stage-scale">
          <i /><i /><i /><i /><i /><i /><i />
        </span>
      </div>
    </div>
  );
}
