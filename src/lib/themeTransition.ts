'use client';

import { flushSync } from 'react-dom';
import { getColorTheme, setThemeMode, type ColorTheme } from './theme';

type ThemeRun = {
  target: ColorTheme;
  applied: boolean;
  cancelled: boolean;
  transition?: ViewTransition;
  animation?: Animation;
  detach?: () => void;
};

const directionClasses = ['theme-transition-to-light', 'theme-transition-to-dark'];

/** One small imperative controller per toggle; no page or menu state is involved. */
export function createThemeTransitionController() {
  let active: ThemeRun | undefined;

  function commit(run: ThemeRun) {
    if (run.applied) return;
    run.applied = true;
    flushSync(() => setThemeMode(run.target));
  }

  function release(run: ThemeRun) {
    run.animation?.cancel();
    run.animation = undefined;
    run.detach?.();
    run.detach = undefined;
    if (active !== run) return;
    active = undefined;
    document.documentElement.classList.remove(...directionClasses);
  }

  function stop(run: ThemeRun, applyPending: boolean) {
    if (run.cancelled) return;
    run.cancelled = true;
    try {
      if (applyPending) commit(run);
    } finally {
      run.animation?.cancel();
      run.transition?.skipTransition();
      release(run);
    }
  }

  function toggle(button: HTMLButtonElement) {
    // A second tap can arrive before the browser takes its first snapshot.
    // Commit that intent once, then invert it; stale callbacks cannot win later.
    if (active) stop(active, true);
    const target: ColorTheme = getColorTheme() === 'light' ? 'dark' : 'light';
    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof document.startViewTransition !== 'function' ||
        typeof root.animate !== 'function' || motion.matches || document.hidden) {
      flushSync(() => setThemeMode(target));
      return;
    }

    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const run: ThemeRun = { target, applied: false, cancelled: false };
    active = run;
    root.classList.add(`theme-transition-to-${target}`);

    const interrupt = () => { if (active === run) stop(run, true); };
    const onMotionChange = () => { if (motion.matches) interrupt(); };
    const onVisibilityChange = () => { if (document.hidden) interrupt(); };
    window.addEventListener('resize', interrupt, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
    else motion.addListener(onMotionChange);
    run.detach = () => {
      window.removeEventListener('resize', interrupt);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (typeof motion.removeEventListener === 'function') motion.removeEventListener('change', onMotionChange);
      else motion.removeListener(onMotionChange);
    };

    try {
      run.transition = document.startViewTransition(() => {
        if (!run.cancelled && active === run) commit(run);
      });
    } catch {
      stop(run, true);
      return;
    }

    // Skipped snapshots and unsupported pseudo-element animation must never
    // prevent the preference from changing or leave an unhandled rejection.
    const fail = () => { if (active === run) stop(run, true); };
    void run.transition.updateCallbackDone.catch(fail);
    void run.transition.ready.then(() => {
      if (run.cancelled || active !== run) return;
      const from = `circle(0px at ${x}px ${y}px)`;
      const to = `circle(${radius}px at ${x}px ${y}px)`;
      try {
        const pseudoElement = target === 'light' ? '::view-transition-new(root)' : '::view-transition-old(root)';
        run.animation = root.animate({ clipPath: target === 'light' ? [from, to] : [to, from] }, {
          duration: 480,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
          pseudoElement,
        });
        void run.animation.finished.catch(() => {});
        // Some early implementations silently ignore the pseudo-element option.
        // Never clip the live document when that happens.
        if (!run.animation.effect || !('pseudoElement' in run.animation.effect) ||
            run.animation.effect.pseudoElement !== pseudoElement) fail();
      } catch {
        fail();
      }
    }, fail).catch(fail);
    void run.transition.finished.then(() => release(run), fail);
  }

  return {
    toggle,
    cancel() { if (active) stop(active, false); },
  };
}
