'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let observer: IntersectionObserver | null = null;
    let motion: MediaQueryList | null = null;
    let frame: number | null = null;
    let fallbackTimer: number | null = null;
    let finished = false;

    function stopWatching() {
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('visibilitychange', onViewportChange);
      if (motion && typeof motion.removeEventListener === 'function') {
        motion.removeEventListener('change', onMotionChange);
      } else motion?.removeListener?.(onMotionChange);
      frame = null;
      fallbackTimer = null;
    }

    function show() {
      if (finished) return;
      finished = true;
      element!.dataset.reveal = 'visible';
      stopWatching();
    }

    function checkGeometry() {
      if (finished) return;
      try {
        // Проверяем верх блока, чтобы быстрый скролл мимо него тоже раскрыл контент.
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        if (motion?.matches || element!.getBoundingClientRect().top <= viewportHeight) show();
      } catch {
        show();
      }
    }

    function onViewportChange() {
      if (finished || frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        checkGeometry();
      });
    }

    function onMotionChange() {
      if (motion?.matches) show();
    }

    function scheduleFallback() {
      if (finished) return;
      fallbackTimer = window.setTimeout(() => {
        fallbackTimer = null;
        checkGeometry();
      }, 250);
    }

    try {
      motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motion.matches || typeof window.IntersectionObserver !== 'function') {
        show();
        return stopWatching;
      }

      // Без JS всё видно; уже видимый или пройденный блок никогда не скрываем.
      checkGeometry();
      if (finished) return stopWatching;
      element.dataset.reveal = 'pending';

      window.addEventListener('scroll', onViewportChange, { passive: true });
      window.addEventListener('resize', onViewportChange, { passive: true });
      document.addEventListener('visibilitychange', onViewportChange, { passive: true });
      if (typeof motion.addEventListener === 'function') {
        motion.addEventListener('change', onMotionChange);
      } else motion.addListener(onMotionChange);
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) show();
        else checkGeometry();
      }, { threshold: 0.02, rootMargin: '0px 0px -10px 0px' });
      observer.observe(element);
      checkGeometry();
      scheduleFallback();
      // После загрузки шрифтов геометрия может измениться без скролла.
      void document.fonts?.ready.then(checkGeometry, show);
    } catch {
      show();
    }

    return () => {
      finished = true;
      stopWatching();
      // Повторный запуск эффекта в Strict Mode начинает с видимого контента.
      if (element.dataset.reveal === 'pending') delete element.dataset.reveal;
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
