'use client';

import { useLayoutEffect, useRef } from 'react';

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bar = ref.current;
    if (!bar) return;

    const root = document.documentElement;
    const body = document.body;
    let frame: number | null = null;
    let maximum = 0;
    let measure = true;
    let active = true;

    function update() {
      frame = null;
      if (!active) return;

      const fixed = body.style.position === 'fixed';
      if (measure && !fixed) {
        maximum = Math.max(0, root.scrollHeight - window.innerHeight);
        measure = false;
      } else if (fixed && maximum === 0) {
        // Covers mounting inside an already locked mobile page as well.
        maximum = Math.max(0, Math.max(root.scrollHeight, body.scrollHeight) - window.innerHeight);
      }

      // The shared iOS scroll lock stores the physical offset in body.top.
      const fixedTop = Number.parseFloat(body.style.top);
      const offset = fixed && Number.isFinite(fixedTop) ? -fixedTop : window.scrollY;
      const progress = maximum > 0 ? Math.min(1, Math.max(0, offset / maximum)) : 0;
      bar!.style.transform = `scaleX(${progress})`;
    }

    function schedule() {
      if (active && frame === null) frame = window.requestAnimationFrame(update);
    }

    function layoutChanged() {
      if (!active) return;
      measure = true;
      schedule();
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', layoutChanged, { passive: true });
    window.addEventListener('pageshow', layoutChanged);
    window.visualViewport?.addEventListener('resize', layoutChanged, { passive: true });

    const sizes = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(layoutChanged) : undefined;
    sizes?.observe(root);
    sizes?.observe(body);
    // Re-measure after lock/unlock even if a WebView omits its scroll event.
    const lock = typeof window.MutationObserver === 'function' ? new window.MutationObserver(layoutChanged) : undefined;
    lock?.observe(body, { attributes: true, attributeFilter: ['style'] });
    void document.fonts?.ready.then(layoutChanged, layoutChanged);

    return () => {
      active = false;
      if (frame !== null) window.cancelAnimationFrame(frame);
      sizes?.disconnect();
      lock?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', layoutChanged);
      window.removeEventListener('pageshow', layoutChanged);
      window.visualViewport?.removeEventListener('resize', layoutChanged);
    };
  }, []);

  return <div ref={ref} className="scroll-progress" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />;
}
