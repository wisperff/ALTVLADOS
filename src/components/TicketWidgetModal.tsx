"use client";

import Script from "next/script";
import { useLayoutEffect, useRef, useState } from "react";
import { site, type Show } from "@/data/site";
import { REDUCED_EXIT_MS, TICKET_EXIT_MS } from "@/lib/motion";
import { lockBodyScroll } from "@/lib/scrollLock";
import { CarpetPattern } from "./CarpetPattern";

type Props = {
  show?: Show;
  isOpen: boolean;
  revision: number;
  onClose: () => void;
  onExited: (revision: number) => void;
};

const BACKDROP_MOVEMENT_LIMIT = 8;

type BackdropGesture = {
  pointerId: number;
  x: number;
  y: number;
};

function outsideDialog(dialog: HTMLDialogElement, x: number, y: number) {
  const bounds = dialog.getBoundingClientRect();
  return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
}

function secureUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function TicketEmbed({ embedUrl, title, loadingLabel }: {
  embedUrl: string;
  title: string;
  loadingLabel: string;
}) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <p role="status" className="ticket-loading-note text-sm text-ui-muted">{loadingLabel}</p>}
      <iframe
        title={title}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="payment"
        onLoad={() => setLoading(false)}
        className="h-[55dvh] min-h-80 w-full border-0 bg-operator"
      />
    </>
  );
}

export default function TicketWidgetModal({ show, isOpen, revision, onClose, onExited }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropGesture = useRef<BackdropGesture | null>(null);
  const copy = site.tickets;
  const embedUrl = secureUrl(show?.embedUrl || copy.embedUrl);
  const scriptUrl = secureUrl(copy.scriptUrl);
  const offerUrl = secureUrl(copy.offerUrl);
  const demo = copy.provider === "demo" || (site.showsSection.mode === 'demo' && !!show);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockScroll = lockBodyScroll();
    if (!dialog.open) dialog.showModal();

    return () => {
      unlockScroll();
      // Native close can restore focus too; thaw the saved page position first.
      dialog.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const viewport = window.visualViewport;
    if (!dialog || !viewport) return;
    let frame: number | undefined;

    const syncViewport = () => {
      frame = undefined;
      dialog.style.setProperty("--ticket-viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--ticket-viewport-top", `${viewport.offsetTop}px`);
    };
    const scheduleViewport = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(syncViewport);
    };

    syncViewport();
    viewport.addEventListener("resize", scheduleViewport);
    viewport.addEventListener("scroll", scheduleViewport);
    return () => {
      viewport.removeEventListener("resize", scheduleViewport);
      viewport.removeEventListener("scroll", scheduleViewport);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      dialog.style.removeProperty("--ticket-viewport-height");
      dialog.style.removeProperty("--ticket-viewport-top");
    };
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let firstFrame: number | undefined;
    let secondFrame: number | undefined;
    let closeTimer: number | undefined;

    if (isOpen) {
      if (dialog.dataset.state === "closing" || dialog.dataset.state === "open") {
        // Reopening keeps the same native dialog, focus and scroll lock.
        dialog.dataset.state = "open";
      } else {
        dialog.dataset.state = "opening";
        // Let the initial opacity/transform paint before starting the entrance.
        firstFrame = window.requestAnimationFrame(() => {
          secondFrame = window.requestAnimationFrame(() => { dialog.dataset.state = "open"; });
        });
      }
    } else {
      backdropGesture.current = null;
      dialog.dataset.state = "closing";
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? REDUCED_EXIT_MS : TICKET_EXIT_MS;
      closeTimer = window.setTimeout(() => onExited(revision), duration);
    }

    return () => {
      if (firstFrame !== undefined) window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) window.cancelAnimationFrame(secondFrame);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [isOpen, revision, onExited]);

  return (
    <dialog
      ref={dialogRef}
      data-state="opening"
      aria-labelledby="ticket-title"
      aria-describedby="ticket-description"
      className="ticket-dialog z-50 m-auto w-[calc(100%_-_2rem)] max-w-2xl p-0 text-bright"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onPointerDown={(event) => {
        backdropGesture.current = null;
        if (event.target !== event.currentTarget || event.button !== 0 || event.isPrimary === false) return;
        if (outsideDialog(event.currentTarget, event.clientX, event.clientY)) {
          backdropGesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        }
      }}
      onPointerMove={(event) => {
        const gesture = backdropGesture.current;
        if (gesture?.pointerId === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > BACKDROP_MOVEMENT_LIMIT) {
          backdropGesture.current = null;
        }
      }}
      onPointerUp={(event) => {
        const gesture = backdropGesture.current;
        backdropGesture.current = null;
        if (!gesture || gesture.pointerId !== event.pointerId || event.target !== event.currentTarget) return;
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) <= BACKDROP_MOVEMENT_LIMIT && outsideDialog(event.currentTarget, event.clientX, event.clientY)) onClose();
      }}
      onPointerCancel={() => { backdropGesture.current = null; }}
    >
      <button
        type="button"
        aria-label={copy.closeLabel}
        onClick={onClose}
        className="ticket-close absolute z-10 flex h-11 w-11 items-center justify-center"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>

      <CarpetPattern />

      <div className="ticket-scroll" tabIndex={0} role="region" aria-labelledby="ticket-title">
        <div className="ticket-content">
          <div className="ticket-copy-surface">
            <p className="ticket-kicker text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ink">{demo ? copy.demoLabel : copy.provider}</p>
            <h2 id="ticket-title" className="ticket-heading font-bold uppercase tracking-tight">{show?.title || copy.title}</h2>
            <p id="ticket-description" className="mt-3 max-w-lg text-sm leading-relaxed text-ui-muted">{copy.description}</p>
          </div>

          {demo ? (
            <div className="ticket-inset tonal-card">
              <svg aria-hidden="true" className="h-10 w-10 text-accent-ink" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 10h30v7a3 3 0 0 0 0 6v7H5v-7a3 3 0 0 0 0-6v-7Z" /><path d="M25 10v20" strokeDasharray="3 3" /></svg>
              <h3 className="mt-6 whitespace-pre-line text-2xl font-semibold">{copy.demoTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ui-muted">{copy.demoDescription}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {copy.methods.map((method) => <span className="pill-tag text-xs" key={method}>{method}</span>)}
              </div>
              <p className="ticket-methods-note text-xs leading-relaxed text-ui-faint">{copy.methodsNote}</p>
              <button
                type="button"
                className="button button-primary mt-7 w-full text-sm"
                onClick={onClose}
              >
                {copy.demoAction}
              </button>
              <p className="ticket-status text-center text-xs leading-relaxed text-ui-faint">{copy.demoStatus}</p>
            </div>
          ) : embedUrl ? (
            <div className="ticket-copy-surface">
              <TicketEmbed
                key={embedUrl}
                embedUrl={embedUrl}
                title={copy.title}
                loadingLabel={copy.loadingLabel}
              />
              {scriptUrl && <Script id="altzavod-ticket-operator" src={scriptUrl} strategy="lazyOnload" />}
              <a className="mt-4 inline-flex min-h-11 items-center text-sm text-ui-secondary underline underline-offset-4 hover:text-bright" href={embedUrl} target="_blank" rel="noopener noreferrer">{copy.fallbackLabel}</a>
              <p className="ticket-security-note text-xs leading-relaxed text-ui-faint">{copy.securityNote}</p>
            </div>
          ) : <p role="status" className="ticket-config-error ticket-inset tonal-card text-sm leading-relaxed text-ui-secondary">{copy.configError}</p>}

          {!demo && offerUrl && <a className="ticket-copy-surface inline-flex min-h-11 items-center text-xs text-ui-faint underline underline-offset-4 hover:text-ui-link" href={offerUrl} target="_blank" rel="noopener noreferrer">{copy.offerLabel}</a>}
        </div>
      </div>
    </dialog>
  );
}

