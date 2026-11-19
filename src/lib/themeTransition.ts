'use client';

import { flushSync } from 'react-dom';
import { getColorTheme, setThemeMode, THEME_STORAGE_KEY, type ColorTheme } from './theme';

type ThemeRun = {
  target: ColorTheme;
  applied: boolean;
  cancelled: boolean;
  transition?: ViewTransition;
  animation?: Animation;
  detach?: () => void;
  origin?: Array<{ name: string; value: string; priority: string }>;
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
    const root = document.documentElement;
    root.classList.remove('theme-transitioning', ...directionClasses);
    for (const saved of run.origin || []) {
      if (saved.value) root.style.setProperty(saved.name, saved.value, saved.priority);
      else root.style.removeProperty(saved.name);
    }
  }

  function stop(run: ThemeRun, applyPending: boolean) {
    if (run.cancelled) return;
    run.cancelled = true;
    try {
      run.transition?.skipTransition();
    } finally {
      try {
        if (applyPending) commit(run);
      } finally {
        release(run);
      }
    }
  }

  function toggle(button: HTMLButtonElement, onPrepareTransition?: () => void) {
    // A second tap can arrive before the browser takes its first snapshot.
    // Commit that intent once, then invert it; stale callbacks cannot win later.
    if (active) stop(active, true);
    const target: ColorTheme = getColorTheme() === 'light' ? 'dark' : 'light';
    const root = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof document.startViewTransition !== 'function' ||
        typeof root.animate !== 'function' || motion.matches || document.hidden) {
      flushSync(() => {
        onPrepareTransition?.();
        setThemeMode(target);
      });
      return;
    }

    const run: ThemeRun = { target, applied: false, cancelled: false };
    active = run;
    root.classList.add('theme-transitioning', `theme-transition-to-${target}`);

    let x: number;
    let y: number;
    let radius: number;
    const viewport = window.visualViewport;
    try {
      // The class removes header motion/blur before this synchronous layout read.
      // Its React visibility state must agree before the native snapshots begin.
      if (onPrepareTransition) flushSync(onPrepareTransition);
      const rect = button.getBoundingClientRect();
      // Fixed controls and root snapshots share CSS viewport coordinates.
      // Adding visualViewport offsets shifts the wave away from the button.
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
      radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      run.origin = ['--theme-x', '--theme-y'].map(name => ({
        name, value: root.style.getPropertyValue(name), priority: root.style.getPropertyPriority(name),
      }));
      root.style.setProperty('--theme-x', `${x}px`);
      root.style.setProperty('--theme-y', `${y}px`);
    } catch {
      stop(run, true);
      return;
    }

    const interrupt = () => { if (active === run) stop(run, true); };
    const onMotionChange = () => { if (motion.matches) interrupt(); };
    const onVisibilityChange = () => { if (document.hidden) interrupt(); };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      // A newer cross-tab preference owns the live palette. Never let this
      // pending snapshot update overwrite it or keep showing an older palette.
      if (active === run) stop(run, false);
    };
    window.addEventListener('resize', interrupt, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    // Restore normal CSS transitions before another control handles input.
    window.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt, { capture: true });
    window.addEventListener('storage', onStorageChange);
    viewport?.addEventListener('resize', interrupt, { passive: true });
    viewport?.addEventListener('scroll', interrupt, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
    else motion.addListener(onMotionChange);
    run.detach = () => {
      window.removeEventListener('resize', interrupt);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('pointerdown', interrupt);
      window.removeEventListener('keydown', interrupt, true);
      window.removeEventListener('storage', onStorageChange);
      viewport?.removeEventListener('resize', interrupt);
      viewport?.removeEventListener('scroll', interrupt);
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
          duration: 250,
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
    // Deal with a failed update before finally releases this run's class/fill.
    // A skipped older transition must never clean up a newer wave.
    void run.transition.finished.catch(fail).finally(() => release(run)).catch(fail);
  }

  return {
    toggle,
    cancel() { if (active) stop(active, false); },
  };
}
