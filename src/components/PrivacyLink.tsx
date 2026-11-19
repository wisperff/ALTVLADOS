'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { site } from '@/data/site';
import { getAnchorTarget, navigateToAnchor } from '@/lib/anchorNavigation';

type PrivacyProps = { children: ReactNode; className?: string };
const privacyHighlightEvent = 'altzavod:privacy-highlight';

export function PrivacyLink({ children, className }: PrivacyProps) {
  const href = site.footer.privacy.href;

  function openPrivacy(event: MouseEvent<HTMLAnchorElement>) {
    if (href || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const disclosure = getAnchorTarget('#privacy');
    if (!disclosure || disclosure.tagName !== 'DETAILS') return;
    event.preventDefault();
    (disclosure as HTMLDetailsElement).open = true;
    window.dispatchEvent(new Event(privacyHighlightEvent));
    navigateToAnchor('#privacy', 'nearest');
  }

  return <a href={href || '#privacy'} className={className} aria-controls={href ? undefined : 'privacy'} onClick={openPrivacy}>{children}</a>;
}

export function PrivacyDisclosure({ children, className }: PrivacyProps) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const target = disclosure.current;
    if (!target) return;
    let highlightTimer: number | undefined;
    const highlight = () => {
      window.clearTimeout(highlightTimer);
      target.dataset.privacyHighlight = 'true';
      highlightTimer = window.setTimeout(() => {
        delete target.dataset.privacyHighlight;
        highlightTimer = undefined;
      }, 1000);
    };
    const revealHashTarget = () => {
      if (window.location.hash !== '#privacy') return;
      target.open = true;
      navigateToAnchor('#privacy');
    };
    revealHashTarget();
    // Native hash links and Back/Forward also reveal the existing text.
    window.addEventListener('hashchange', revealHashTarget);
    window.addEventListener(privacyHighlightEvent, highlight);
    return () => {
      window.removeEventListener('hashchange', revealHashTarget);
      window.removeEventListener(privacyHighlightEvent, highlight);
      window.clearTimeout(highlightTimer);
      delete target.dataset.privacyHighlight;
    };
  }, []);

  return <details id="privacy" ref={disclosure} className={className}>{children}</details>;
}
