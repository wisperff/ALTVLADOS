'use client';

const fallbackInterval = 100;
const warmupDelay = 250;
type BrowserWindow = Window & typeof globalThis;
type Registration = { started: number; warmupAt: number | null };
type Coordinator = { watch: (element: HTMLElement) => () => void };
const coordinators = new WeakMap<Document, Coordinator>();

function createCoordinator(doc: Document, win: BrowserWindow): Coordinator {
  const pending = new Map<HTMLElement, Registration>();
  let active = true;
  let started = false;
  let observer: IntersectionObserver | null = null;
  let motion: MediaQueryList | null = null;
  let frame: number | null = null;
  let checkTimer: number | null = null;
  let warmupTimer: number | null = null;
  let warmupDue: number | null = null;
  let lastCheck = -Infinity;

  function cancelChecks() {
    if (frame !== null) win.cancelAnimationFrame(frame);
    if (checkTimer !== null) win.clearTimeout(checkTimer);
    if (warmupTimer !== null) win.clearTimeout(warmupTimer);
    frame = checkTimer = warmupTimer = warmupDue = null;
  }

  function dispose() {
    if (!active) return;
    active = false;
    cancelChecks();
    observer?.disconnect();
    win.removeEventListener('scroll', scheduleCheck);
    win.removeEventListener('resize', scheduleCheck);
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    if (motion && typeof motion.removeEventListener === 'function') motion.removeEventListener('change', onMotionChange);
    else motion?.removeListener?.(onMotionChange);
    pending.clear();
    if (coordinators.get(doc) === coordinator) coordinators.delete(doc);
  }

  function remove(element: HTMLElement, registration: Registration, visible: boolean) {
    if (pending.get(element) !== registration) return;
    pending.delete(element);
    if (visible) element.dataset.reveal = 'visible';
    else if (element.dataset.reveal === 'pending') delete element.dataset.reveal;
    try { observer?.unobserve(element); } catch { /* Disconnection below still releases the observer. */ }
    if (pending.size === 0) dispose();
  }

  function showAll() {
    if (!active) return;
    for (const [element, registration] of [...pending]) remove(element, registration, true);
    if (active) dispose();
  }

  function checkGeometry() {
    frame = null;
    if (!active || doc.hidden) return;
    lastCheck = win.performance.now();
    const height = win.innerHeight || doc.documentElement.clientHeight;
    const completed: Array<[HTMLElement, Registration, boolean]> = [];
    // Read the entire batch before changing any reveal attributes/styles.
    for (const [element, registration] of [...pending]) {
      if (!element.isConnected) {
        completed.push([element, registration, false]);
        continue;
      }
      try {
        const top = element.getBoundingClientRect().top;
        if (!Number.isFinite(top) || top <= height) completed.push([element, registration, true]);
      } catch {
        completed.push([element, registration, true]);
      }
    }
    for (const [element, registration, visible] of completed) remove(element, registration, visible);
    if (active) scheduleWarmup();
  }

  function requestCheck() {
    checkTimer = null;
    if (!active || doc.hidden || frame !== null) return;
    try { frame = win.requestAnimationFrame(checkGeometry); }
    catch { showAll(); }
  }

  function scheduleCheck() {
    if (!active || doc.hidden || frame !== null || checkTimer !== null) return;
    const wait = Math.max(0, lastCheck + fallbackInterval - win.performance.now());
    if (wait === 0) requestCheck();
    else checkTimer = win.setTimeout(requestCheck, wait);
  }

  function scheduleWarmup() {
    if (!active || doc.hidden) return;
    let next: number | null = null;
    for (const registration of pending.values()) {
      if (registration.warmupAt !== null && (next === null || registration.warmupAt < next)) next = registration.warmupAt;
    }
    if (next === warmupDue) return;
    if (warmupTimer !== null) win.clearTimeout(warmupTimer);
    warmupTimer = null;
    warmupDue = next;
    if (next === null) return;
    warmupTimer = win.setTimeout(() => {
      warmupTimer = warmupDue = null;
      if (!active) return;
      const now = win.performance.now();
      for (const registration of pending.values()) {
        if (registration.warmupAt !== null && registration.warmupAt <= now) registration.warmupAt = null;
      }
      scheduleCheck();
      scheduleWarmup();
    }, Math.max(0, next - win.performance.now()));
  }

  function onVisibilityChange() {
    if (doc.hidden) cancelChecks();
    else {
      scheduleWarmup();
      scheduleCheck();
    }
  }

  function onMotionChange() {
    if (motion?.matches) showAll();
  }

  function start() {
    started = true;
    try {
      motion = win.matchMedia('(prefers-reduced-motion: reduce)');
      if (motion.matches || typeof win.IntersectionObserver !== 'function') {
        showAll();
        return;
      }
      observer = new win.IntersectionObserver(entries => {
        if (!active || doc.hidden) return;
        const height = win.innerHeight || doc.documentElement.clientHeight;
        const completed: Array<[HTMLElement, Registration]> = [];
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const registration = pending.get(element);
          if (!registration || (Number.isFinite(entry.time) && entry.time < registration.started)) continue;
          if (entry.isIntersecting || entry.boundingClientRect?.top <= height) completed.push([element, registration]);
        }
        for (const [element, registration] of completed) remove(element, registration, true);
        if (active) scheduleWarmup();
      }, { threshold: 0.02, rootMargin: '0px 0px -10px 0px' });
      win.addEventListener('scroll', scheduleCheck, { passive: true });
      win.addEventListener('resize', scheduleCheck, { passive: true });
      doc.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
      if (typeof motion.addEventListener === 'function') motion.addEventListener('change', onMotionChange);
      else motion.addListener(onMotionChange);
      void doc.fonts?.ready.then(scheduleCheck, showAll);
    } catch {
      showAll();
    }
  }

  const coordinator: Coordinator = {
    watch(element) {
      const now = win.performance.now();
      const registration: Registration = { started: now, warmupAt: now + warmupDelay };
      pending.set(element, registration);
      if (!started) start();
      if (active && pending.get(element) === registration) {
        element.dataset.reveal = 'pending';
        try {
          observer!.observe(element);
          scheduleWarmup();
        } catch {
          showAll();
        }
      }
      return () => {
        remove(element, registration, false);
        if (active) scheduleWarmup();
      };
    },
  };
  return coordinator;
}

/** SSR stays visible; only offscreen, observed elements are ever hidden. */
export function observeReveal(element: HTMLElement): () => void {
  const doc = element.ownerDocument;
  const win = doc.defaultView as BrowserWindow | null;
  if (element.dataset.reveal === 'visible') return () => {};
  try {
    const top = win ? element.getBoundingClientRect().top : 0;
    if (!win || !Number.isFinite(top) || top <= (win.innerHeight || doc.documentElement.clientHeight)) {
      element.dataset.reveal = 'visible';
      return () => {};
    }
    let coordinator = coordinators.get(doc);
    if (!coordinator) {
      coordinator = createCoordinator(doc, win);
      coordinators.set(doc, coordinator);
    }
    return coordinator.watch(element);
  } catch {
    element.dataset.reveal = 'visible';
    return () => {};
  }
}
