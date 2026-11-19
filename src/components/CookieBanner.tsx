"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/data/site";
import { PrivacyLink } from "./PrivacyLink";

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
      const { height, bottom, left } = element.getBoundingClientRect();
      const bottomGap = Math.max(0, window.innerHeight - bottom);
      root.style.setProperty('--cookie-reserve', `${Math.ceil(height + bottomGap + 16)}px`);
      const hero = document.querySelector<HTMLElement>('.hero-bottom');
      const heroReserve = hero ? Math.max(0, hero.getBoundingClientRect().right - left + 16) : 0;
      root.style.setProperty('--cookie-hero-reserve', `${Math.ceil(heroReserve)}px`);
    };
    reserveSpace();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(reserveSpace);
    observer?.observe(element);
    window.addEventListener('resize', reserveSpace, { passive: true });
    window.visualViewport?.addEventListener('resize', reserveSpace, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', reserveSpace);
      window.visualViewport?.removeEventListener('resize', reserveSpace);
      root.style.removeProperty('--cookie-reserve');
      root.style.removeProperty('--cookie-hero-reserve');
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
      className="cookie-notice fixed z-30 flex flex-col gap-2.5 p-3.5 text-xs"
    >
      <div className="max-w-xl">
        <p id="cookie-title" className="text-xs font-semibold text-bright">{copy.title}</p>
        <p className="cookie-description text-xs leading-relaxed text-ui-muted">
          {copy.description}{" "}
          <PrivacyLink className="inline-flex min-h-11 min-w-11 items-center align-middle text-ui-link underline underline-offset-4 hover:text-bright">{copy.policyLabel}</PrivacyLink>
        </p>
      </div>
      <div className="cookie-actions grid w-full min-w-0 shrink-0 grid-cols-2 gap-2">
        <button className="button button-ghost min-h-11 w-full text-xs" type="button" onClick={() => saveChoice(false)}>
          {copy.rejectLabel}
        </button>
        <button className="button button-primary min-h-11 w-full text-xs" type="button" onClick={() => saveChoice(true)}>
          {copy.acceptLabel}
        </button>
      </div>
    </aside>
  );
}

