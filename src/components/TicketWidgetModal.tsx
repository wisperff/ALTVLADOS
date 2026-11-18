"use client";

import Script from "next/script";
import { useLayoutEffect, useRef, useState } from "react";
import { site, type Show } from "@/data/site";
import { lockBodyScroll } from "@/lib/scrollLock";

type Props = {
  show?: Show;
  isOpen: boolean;
  revision: number;
  onClose: () => void;
  onExited: (revision: number) => void;
};

const CLOSE_DURATION = 150;

function secureUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export default function TicketWidgetModal({ show, isOpen, revision, onClose, onExited }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [frameLoading, setFrameLoading] = useState(true);
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
      dialog.close();
      unlockScroll();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
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
      dialog.dataset.state = "closing";
      closeTimer = window.setTimeout(() => onExited(revision), CLOSE_DURATION);
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
      className="ticket-dialog z-50 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto p-0 text-bright"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="relative p-6 sm:p-9">
        <button
          type="button"
          aria-label={copy.closeLabel}
          onClick={onClose}
          className="ticket-close absolute right-3 top-3 flex h-11 w-11 items-center justify-center sm:right-5 sm:top-5"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>

        <p className="pr-12 text-[10px] font-bold uppercase tracking-[0.2em] text-accent-ink">{demo ? copy.demoLabel : copy.provider}</p>
        <h2 id="ticket-title" className="mt-4 pr-10 text-3xl font-bold uppercase tracking-tight sm:text-4xl">{show?.title || copy.title}</h2>
        <p id="ticket-description" className="mt-3 max-w-lg text-sm leading-relaxed text-ui-muted">{copy.description}</p>

        {demo ? (
          <div className="ticket-inset tonal-card mt-8 p-6 sm:p-8">
            <svg aria-hidden="true" className="h-10 w-10 text-accent-ink" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 10h30v7a3 3 0 0 0 0 6v7H5v-7a3 3 0 0 0 0-6v-7Z" /><path d="M25 10v20" strokeDasharray="3 3" /></svg>
            <h3 className="mt-6 whitespace-pre-line text-2xl font-semibold">{copy.demoTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-muted">{copy.demoDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {copy.methods.map((method) => <span className="pill-tag text-xs" key={method}>{method}</span>)}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ui-faint">{copy.methodsNote}</p>
            <button
              type="button"
              className="button button-primary mt-7 w-full text-sm"
              onClick={onClose}
            >
              {copy.demoAction}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-ui-faint">{copy.demoStatus}</p>
          </div>
        ) : embedUrl ? (
          <div className="mt-7">
            {frameLoading && <p role="status" className="mb-3 text-sm text-ui-muted">{copy.loadingLabel}</p>}
            <iframe
              title={copy.title}
              src={embedUrl}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="payment"
              onLoad={() => setFrameLoading(false)}
              className="h-[55dvh] min-h-80 w-full border-0 bg-operator"
            />
            {scriptUrl && <Script id="altzavod-ticket-operator" src={scriptUrl} strategy="lazyOnload" />}
            <a className="mt-4 inline-flex min-h-11 items-center text-sm text-ui-secondary underline underline-offset-4 hover:text-bright" href={embedUrl} target="_blank" rel="noopener noreferrer">{copy.fallbackLabel}</a>
            <p className="mt-3 text-xs leading-relaxed text-ui-faint">{copy.securityNote}</p>
          </div>
        ) : <p role="status" className="ticket-inset tonal-card mt-7 p-6 text-sm leading-relaxed text-ui-secondary">{copy.configError}</p>}

        {!demo && offerUrl && <a className="mt-5 inline-flex min-h-11 items-center text-xs text-ui-faint underline underline-offset-4 hover:text-ui-link" href={offerUrl} target="_blank" rel="noopener noreferrer">{copy.offerLabel}</a>}
      </div>
    </dialog>
  );
}

