'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { site } from '@/data/site';
import { getAnchorTarget, navigateToAnchor } from '@/lib/anchorNavigation';

type PrivacyProps = { children: ReactNode; className?: string };

export function PrivacyLink({ children, className }: PrivacyProps) {
  const href = site.footer.privacy.href;

  function openPrivacy(event: MouseEvent<HTMLAnchorElement>) {
    if (href || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const disclosure = getAnchorTarget('#privacy');
    if (!disclosure || disclosure.tagName !== 'DETAILS') return;
    event.preventDefault();
    (disclosure as HTMLDetailsElement).open = true;
    navigateToAnchor('#privacy');
  }

  return <a href={href || '#privacy'} className={className} aria-controls={href ? undefined : 'privacy'} onClick={openPrivacy}>{children}</a>;
}

export function PrivacyDisclosure({ children, className }: PrivacyProps) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const revealHashTarget = () => {
      if (window.location.hash !== '#privacy' || !disclosure.current) return;
      disclosure.current.open = true;
      navigateToAnchor('#privacy');
    };
    revealHashTarget();
    // Native hash links and Back/Forward also reveal the existing text.
    window.addEventListener('hashchange', revealHashTarget);
    return () => window.removeEventListener('hashchange', revealHashTarget);
  }, []);

  return <details id="privacy" ref={disclosure} className={className}>{children}</details>;
}
