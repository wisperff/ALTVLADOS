'use client';

import { flushSync } from 'react-dom';
import { getColorTheme, setThemeMode, THEME_STORAGE_KEY, type ColorTheme } from './theme';

type NativeCapture = {
  pendingTarget?: ColorTheme;
  cancel?: () => void;
};

type ThemeRun = {
  target: ColorTheme;
  applied: boolean;
  cancelled: boolean;
  transition?: ViewTransition;
  animation?: Animation;
  capture?: NativeCapture;
  detach?: () => void;
  origin?: Array<{ name: string; value: string; priority: string }>;
};

const directionClasses = ['theme-transition-to-light', 'theme-transition-to-dark'];
const geometryTolerance = 2;
const scaleTolerance = 0.001;
const burstQuietMs = 200;
const pointerRelayMs = 2_000;
const pointerSlop = 8;
// A skipped transition may still be taking its snapshots. Keep its lease until
// finished settles, even if the button unmounts or another controller takes over.
const documentTransitions = new WeakMap<Document, {
  capture?: NativeCapture;
  quietUntil: number;
  cancelPointer?: () => void;
}>();

/** One small imperative controller per toggle; no page or menu state is involved. */
export function createThemeTransitionController() {
  let active: ThemeRun | undefined;
  let cancelPointer: (() => void) | undefined;

  function commit(run: ThemeRun) {
    if (run.applied) return;
    run.applied = true;
    if (run.capture) run.capture.pendingTarget = undefined;
    flushSync(() => setThemeMode(run.target));
  }

  function release(run: ThemeRun) {
    if (run.capture) {
      run.capture.pendingTarget = undefined;
      run.capture.cancel = undefined;
      run.capture = undefined;
    }
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
    let state = documentTransitions.get(document);
    if (!state) {
      state = { quietUntil: 0 };
      documentTransitions.set(document, state);
    }
    state.cancelPointer?.();
    // Before the native callback, the first accepted intent is newer than the
    // live palette. Invert it before canceling, so even/odd taps are preserved.
    const previous = state.capture?.pendingTarget ??
      (active && !active.applied ? active.target : getColorTheme());
    const target: ColorTheme = previous === 'light' ? 'dark' : 'light';
    const now = window.performance.now();
    if (active || state.capture || now < state.quietUntil) {
      state.quietUntil = now + burstQuietMs;
      state.capture?.cancel?.();
      if (active) stop(active, false);
      // Repeated taps still change the actual theme, label and saved preference
      // immediately; they do not queue another whole-page capture or replay.
      flushSync(() => {
        onPrepareTransition?.();
        setThemeMode(target);
      });
      return;
    }
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
    const interruptFromInput = () => {
      if (active !== run) return;
      // Root snapshots can retarget a tap to <html>. Native finished may settle
      // before its compatibility click; keep that click in the same burst.
      state.quietUntil = Math.max(state.quietUntil, window.performance.now() + burstQuietMs);
      interrupt();
    };
    const armSnapshotClick = (pointer: PointerEvent) => {
      // Native root captures can send a whole mouse gesture to <html>, even
      // after skipping. Relay only a genuine gesture begun on an eligible header control.
      if (active !== run || !run.capture || !pointer.isTrusted || pointer.defaultPrevented ||
          pointer.target !== root || pointer.button !== 0 || pointer.isPrimary === false ||
          pointer.altKey || pointer.ctrlKey || pointer.metaKey || pointer.shiftKey) return;
      const withinControl = (control: HTMLButtonElement, x: number, y: number, requireLiveHit = false) => {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !control.isConnected || control.ownerDocument !== document ||
            control.matches(':disabled, [aria-disabled="true"]') || control.closest('[inert]') ||
            document.querySelector('dialog[open]')) return false;
        try {
          const rect = control.getBoundingClientRect();
          const style = window.getComputedStyle(control);
          return [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) &&
            style.visibility === 'visible' && style.pointerEvents !== 'none' &&
            rect.width > 0 && rect.height > 0 &&
            (control === button
              ? Math.hypot((x - rect.left - rect.width / 2) / (rect.width / 2),
                (y - rect.top - rect.height / 2) / (rect.height / 2)) <= 1
              : x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height) &&
            (!requireLiveHit || (typeof document.elementFromPoint === 'function' &&
              control.contains(document.elementFromPoint(x, y))));
        } catch {
          return false;
        }
      };
      const headerControls = button.closest('.site-header')?.querySelectorAll<HTMLButtonElement>(
        'button.header-ticket, button.menu-toggle',
      ) ?? [];
      const control = [button, ...headerControls].find(candidate => withinControl(candidate, pointer.clientX, pointer.clientY));
      if (!control) return;
      state.cancelPointer?.();
      const started = window.performance.now();
      let watching = true;
      const clear = () => {
        if (!watching) return;
        watching = false;
        window.clearTimeout(timer);
        window.removeEventListener('click', onClick, true);
        window.removeEventListener('pointerdown', clear, true);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointercancel', clear, true);
        window.removeEventListener('keydown', clear, true);
        window.removeEventListener('wheel', clear, true);
        window.removeEventListener('contextmenu', clear, true);
        window.removeEventListener('blur', clear);
        document.removeEventListener('visibilitychange', onHidden);
        if (state.cancelPointer === clear) state.cancelPointer = undefined;
        if (cancelPointer === clear) cancelPointer = undefined;
      };
      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== pointer.pointerId ||
            Math.hypot(event.clientX - pointer.clientX, event.clientY - pointer.clientY) > pointerSlop) clear();
      };
      const onHidden = () => { if (document.hidden) clear(); };
      const onClick = (event: MouseEvent) => {
        const id = 'pointerId' in event ? (event as PointerEvent).pointerId : undefined;
        const gesture = window.performance.now() - started < pointerRelayMs &&
          event.isTrusted && !event.defaultPrevented &&
          event.button === 0 && event.detail > 0 &&
          !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey &&
          (id === undefined || id === pointer.pointerId) &&
          Math.hypot(event.clientX - pointer.clientX, event.clientY - pointer.clientY) <= pointerSlop &&
          withinControl(control, pointer.clientX, pointer.clientY) && withinControl(control, event.clientX, event.clientY);
        const forward = gesture && event.target === root && withinControl(control, event.clientX, event.clientY, true);
        const direct = gesture && event.target instanceof Node && control.contains(event.target);
        // A real button-targeted click continues to React normally. Clearing
        // first also makes focus changes and re-entrant toggles safe.
        clear();
        // A busy browser can deliver mouseup/click after the input quiet window
        // expired. This is still the same accepted overlapping gesture.
        if (forward || direct) state.quietUntil = Math.max(state.quietUntil, window.performance.now() + burstQuietMs);
        if (forward) {
          control.focus({ preventScroll: true });
          if (control === button) toggle(button, onPrepareTransition);
          else control.click();
        }
      };
      cancelPointer = state.cancelPointer = clear;
      window.addEventListener('click', onClick, { capture: true });
      window.addEventListener('pointerdown', clear, { capture: true, passive: true });
      window.addEventListener('pointermove', onMove, { capture: true, passive: true });
      window.addEventListener('pointercancel', clear, { capture: true, passive: true });
      window.addEventListener('keydown', clear, { capture: true });
      window.addEventListener('wheel', clear, { capture: true, passive: true });
      window.addEventListener('contextmenu', clear, { capture: true });
      window.addEventListener('blur', clear);
      document.addEventListener('visibilitychange', onHidden);
      const timer = window.setTimeout(clear, pointerRelayMs);
    };
    const onPointerInput = (event: Event) => {
      // A real tap reaches window before React's click handler. Leave taps on
      // this control to toggle(), including events from its nested SVG icon.
      const multiTouch = event.type === 'touchstart' && 'touches' in event &&
        (event as TouchEvent).touches.length > 1;
      if (event.type === 'pointerdown') armSnapshotClick(event as PointerEvent);
      if (multiTouch || !event.composedPath().includes(button)) interruptFromInput();
    };
    const onKeyInput = (event: KeyboardEvent) => {
      const activatesButton = event.key === 'Enter' || event.key === ' ';
      if (!activatesButton || !event.composedPath().includes(button)) interruptFromInput();
    };
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
    window.addEventListener('wheel', interruptFromInput, { passive: true });
    window.addEventListener('touchstart', onPointerInput, { passive: true });
    // Restore normal CSS transitions before another control handles input.
    window.addEventListener('pointerdown', onPointerInput, { passive: true });
    window.addEventListener('pointercancel', interruptFromInput, { passive: true });
    window.addEventListener('keydown', onKeyInput, { capture: true });
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
      window.removeEventListener('wheel', interruptFromInput);
      window.removeEventListener('touchstart', onPointerInput);
      window.removeEventListener('pointerdown', onPointerInput);
      window.removeEventListener('pointercancel', interruptFromInput);
      window.removeEventListener('keydown', onKeyInput, true);
      window.removeEventListener('storage', onStorageChange);
      viewport?.removeEventListener('resize', scheduleGeometryCheck);
      viewport?.removeEventListener('scroll', scheduleGeometryCheck);
      if (typeof orientation?.removeEventListener === 'function') orientation.removeEventListener('change', interrupt);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (typeof motion.removeEventListener === 'function') motion.removeEventListener('change', onMotionChange);
      else motion.removeListener(onMotionChange);
    };

    const capture: NativeCapture = {
      pendingTarget: target,
      cancel: () => { if (active === run) stop(run, false); },
    };
    run.capture = capture;
    state.capture = capture;
    try {
      run.transition = document.startViewTransition(() => {
        if (!run.cancelled && active === run) commit(run);
      });
    } catch {
      if (state.capture === capture) state.capture = undefined;
      stop(run, true);
      return;
    }
    const finishCapture = () => {
      // Keep visual cleanup and lease release atomic. Another controller must
      // not start a snapshot between this run's finished and its class cleanup.
      try {
        release(run);
      } finally {
        if (state.capture === capture) state.capture = undefined;
      }
    };

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
    void run.transition.finished.catch(fail).finally(finishCapture).catch(fail);
  }

  return {
    toggle,
    cancel() {
      cancelPointer?.();
      if (active) stop(active, false);
    },
  };
}
