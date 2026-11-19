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
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const offsetTop = viewport?.offsetTop ?? 0;
      x = rect.left + offsetLeft + rect.width / 2;
      y = rect.top + offsetTop + rect.height / 2;
      const width = Math.max(window.innerWidth, offsetLeft + (viewport?.width ?? window.innerWidth));
      const height = Math.max(window.innerHeight, offsetTop + (viewport?.height ?? window.innerHeight));
      radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
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
    window.addEventListener('resize', interrupt, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    viewport?.addEventListener('resize', interrupt, { passive: true });
    viewport?.addEventListener('scroll', interrupt, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
    else motion.addListener(onMotionChange);
    run.detach = () => {
      window.removeEventListener('resize', interrupt);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
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
          duration: 300,
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
