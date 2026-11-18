"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/data/site";

function subscribeToStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function hasSavedChoice() {
  try {
    return window.localStorage.getItem(site.cookies.storageKey) === "accepted";
  } catch {
    return false;
  }
}

// Keep the banner absent during static rendering and the first hydration pass.
const getServerSnapshot = () => true;

export function CookieBanner() {
  const [dismissed, setDismissed] = useState(false);
  const accepted = useSyncExternalStore(subscribeToStorage, hasSavedChoice, getServerSnapshot);
  const copy = site.cookies;
  const banner = useRef<HTMLElement>(null);
  const visible = !accepted && !dismissed;

  useLayoutEffect(() => {
    const element = banner.current;
    if (!visible || !element) return;

    const root = document.documentElement;
    const reserveSpace = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      root.style.setProperty('--cookie-reserve', `${height + 32}px`);
    };
    reserveSpace();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(reserveSpace);
    observer?.observe(element);
    window.addEventListener('resize', reserveSpace, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', reserveSpace);
      root.style.removeProperty('--cookie-reserve');
    };
  }, [visible]);

  function saveChoice(persist: boolean) {
    if (persist) {
      try {
        window.localStorage.setItem(copy.storageKey, "accepted");
      } catch {
        // The banner can still be dismissed in browsers with disabled storage.
      }
    }
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <aside
      ref={banner}
      aria-labelledby="cookie-title"
      className="cookie-notice fixed bottom-4 left-4 right-4 z-30 mx-auto flex max-w-5xl flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="max-w-xl">
        <p id="cookie-title" className="text-sm font-semibold text-bright">{copy.title}</p>
        <p className="mt-2 text-xs leading-relaxed text-ui-muted">
          {copy.description}{" "}
          <a className="text-ui-link underline underline-offset-4 hover:text-bright" href={site.footer.privacy.href || '#privacy'}>{copy.policyLabel}</a>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <button className="button button-ghost min-h-11 text-xs" type="button" onClick={() => saveChoice(false)}>
          {copy.rejectLabel}
        </button>
        <button className="button button-primary min-h-11 text-xs" type="button" onClick={() => saveChoice(true)}>
          {copy.acceptLabel}
        </button>
      </div>
    </aside>
  );
}

