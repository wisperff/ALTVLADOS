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
const geometryTolerance = 2;
const scaleTolerance = 0.001;

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
    let orientation: ScreenOrientation | undefined;
    let coarseViewport: boolean;
    const readGeometry = () => {
      if (!button.isConnected) throw new Error('Theme control is disconnected');
      const rect = button.getBoundingClientRect();
      const geometry = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        layoutWidth: root.clientWidth,
        visualWidth: viewport ? viewport.width : window.innerWidth,
        scale: viewport ? viewport.scale : 1,
        offsetLeft: viewport ? viewport.offsetLeft : 0,
        offsetTop: viewport ? viewport.offsetTop : 0,
        angle: orientation?.angle ?? 0,
      };
      if (!Object.values(geometry).every(Number.isFinite) ||
          geometry.width <= 0 || geometry.height <= 0 ||
          geometry.windowWidth <= 0 || geometry.windowHeight <= 0 ||
          geometry.layoutWidth <= 0 || geometry.visualWidth <= 0 || geometry.scale <= 0) {
        throw new Error('Theme geometry is unavailable');
      }
      return geometry;
    };
    let baseline: ReturnType<typeof readGeometry>;
    try {
      // The class removes header motion/blur before this synchronous layout read.
      // Its React visibility state must agree before the native snapshots begin.
      if (onPrepareTransition) flushSync(onPrepareTransition);
      orientation = window.screen?.orientation;
      baseline = readGeometry();
      coarseViewport = window.matchMedia('(pointer: coarse)').matches;
      // Fixed controls and root snapshots share CSS viewport coordinates.
      // Adding visualViewport offsets shifts the wave away from the button.
      x = Math.round(baseline.x);
      y = Math.round(baseline.y);
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
    let geometryFrame: number | undefined;
    const checkGeometry = () => {
      geometryFrame = undefined;
      if (active !== run || run.cancelled) return;
      try {
        const current = readGeometry();
        // Compare with the original unrounded geometry, never the previous
        // sample: a series of small shifts must not conceal cumulative drift.
        const moved = (['x', 'y', 'width', 'height', 'windowWidth', 'layoutWidth', 'visualWidth', 'offsetLeft', 'offsetTop'] as const)
          .some(key => Math.abs(current[key] - baseline[key]) > geometryTolerance);
        const zoomed = Math.abs(current.scale - baseline.scale) > scaleTolerance + Number.EPSILON;
        const rotated = current.angle !== baseline.angle;
        // Mobile browser chrome can change height/offset without moving the
        // fixed control. A fine-pointer desktop window resize still invalidates
        // its snapshots even when the control stays in the same place.
        const resizedDesktop = !coarseViewport &&
          Math.abs(current.windowHeight - baseline.windowHeight) > geometryTolerance;
        if (moved || zoomed || rotated || resizedDesktop) interrupt();
      } catch {
        interrupt();
      }
    };
    const scheduleGeometryCheck = () => {
      if (active !== run || run.cancelled || geometryFrame !== undefined) return;
      try {
        geometryFrame = window.requestAnimationFrame(checkGeometry);
      } catch {
        interrupt();
      }
    };
    const onMotionChange = () => { if (motion.matches) interrupt(); };
    const onVisibilityChange = () => { if (document.hidden) interrupt(); };
    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      // A newer cross-tab preference owns the live palette. Never let this
      // pending snapshot update overwrite it or keep showing an older palette.
      if (active === run) stop(run, false);
    };
    window.addEventListener('resize', scheduleGeometryCheck, { passive: true });
    window.addEventListener('orientationchange', interrupt, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    // Restore normal CSS transitions before another control handles input.
    window.addEventListener('pointerdown', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt, { capture: true });
    window.addEventListener('storage', onStorageChange);
    viewport?.addEventListener('resize', scheduleGeometryCheck, { passive: true });
    viewport?.addEventListener('scroll', scheduleGeometryCheck, { passive: true });
    if (typeof orientation?.addEventListener === 'function') orientation.addEventListener('change', interrupt);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
    else motion.addListener(onMotionChange);
    run.detach = () => {
      if (geometryFrame !== undefined) window.cancelAnimationFrame(geometryFrame);
      geometryFrame = undefined;
      window.removeEventListener('resize', scheduleGeometryCheck);
      window.removeEventListener('orientationchange', interrupt);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('pointerdown', interrupt);
      window.removeEventListener('keydown', interrupt, true);
      window.removeEventListener('storage', onStorageChange);
      viewport?.removeEventListener('resize', scheduleGeometryCheck);
      viewport?.removeEventListener('scroll', scheduleGeometryCheck);
      if (typeof orientation?.removeEventListener === 'function') orientation.removeEventListener('change', interrupt);
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
