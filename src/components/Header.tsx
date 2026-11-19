'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { site } from '@/data/site';
import { lockBodyScroll } from '@/lib/scrollLock';
import { getAnchorTarget, navigateToAnchor } from '@/lib/anchorNavigation';
import { MENU_EXIT_MS, REDUCED_EXIT_MS } from '@/lib/motion';
import { Icon } from './Icon';
import { useTickets } from './TicketProvider';
import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

type MenuPhase = 'closed' | 'opening' | 'open' | 'closing';
type CloseRequest = { restoreFocus?: boolean; afterExit?: () => void };

export function Header() {
  const [menuPhase, setMenuPhase] = useState<MenuPhase>('closed');
  const menuMounted = menuPhase !== 'closed';
  const menuExpanded = menuPhase === 'opening' || menuPhase === 'open';
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef(false);
  const menuOpenRef = useRef(false);
  const phaseRef = useRef<MenuPhase>('closed');
  const revision = useRef(0);
  const enterFrame = useRef<number | null>(null);
  const enterFinalFrame = useRef<number | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);
  const pendingClose = useRef<CloseRequest | null>(null);
  const pinned = useRef(false);
  const menuUnlock = useRef<(() => void) | null>(null);
  const resetScroll = useRef<((pin: boolean) => void) | null>(null);
  const { openTickets } = useTickets();

  const setHeaderHidden = useCallback((value: boolean) => {
    if (hiddenRef.current === value) return;
    hiddenRef.current = value;
    setHidden(value);
  }, []);

  const revealHeader = useCallback((pin = false) => {
    if (pin) pinned.current = true;
    setHeaderHidden(false);
    resetScroll.current?.(pin);
  }, [setHeaderHidden]);

  const releaseMenuScroll = useCallback(() => {
    const unlock = menuUnlock.current;
    menuUnlock.current = null;
    unlock?.();
  }, []);

  const applyPhase = useCallback((next: MenuPhase) => {
    phaseRef.current = next;
    menuOpenRef.current = next !== 'closed';
    setMenuPhase(next);
  }, []);

  const cancelMenuMotion = useCallback(() => {
    if (enterFrame.current !== null) window.cancelAnimationFrame(enterFrame.current);
    if (enterFinalFrame.current !== null) window.cancelAnimationFrame(enterFinalFrame.current);
    window.clearTimeout(exitTimer.current);
    enterFrame.current = null;
    enterFinalFrame.current = null;
    exitTimer.current = undefined;
  }, []);

  const finishClose = useCallback((version: number) => {
    if (revision.current !== version || phaseRef.current !== 'closing') return;
    exitTimer.current = undefined;
    const request = pendingClose.current;
    pendingClose.current = null;
    // Fixed-body restoration must finish before native anchor/ticket actions.
    releaseMenuScroll();
    applyPhase('closed');
    revealHeader(true);
    if (request?.afterExit) request.afterExit();
    else if (request?.restoreFocus) toggle.current?.focus({ preventScroll: true });
  }, [applyPhase, releaseMenuScroll, revealHeader]);

  const closeMenu = useCallback((request: CloseRequest = {}) => {
    if (phaseRef.current === 'closing') return;
    if (phaseRef.current === 'closed') {
      revealHeader(true);
      request.afterExit?.();
      return;
    }
    const version = ++revision.current;
    cancelMenuMotion();
    pendingClose.current = request;
    applyPhase('closing');
    revealHeader(true);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? REDUCED_EXIT_MS : MENU_EXIT_MS;
    exitTimer.current = window.setTimeout(() => finishClose(version), delay);
  }, [applyPhase, cancelMenuMotion, finishClose, revealHeader]);

  const openMenu = useCallback(() => {
    const previous = phaseRef.current;
    if (previous === 'open' || previous === 'opening') return;
    const version = ++revision.current;
    cancelMenuMotion();
    pendingClose.current = null;
    revealHeader(true);
    // Reverse an in-flight exit from its current composited position.
    if (previous === 'closing') {
      applyPhase('open');
      return;
    }
    applyPhase('opening');
    enterFrame.current = window.requestAnimationFrame(() => {
      enterFrame.current = null;
      if (revision.current !== version || phaseRef.current !== 'opening') return;
      enterFinalFrame.current = window.requestAnimationFrame(() => {
        enterFinalFrame.current = null;
        if (revision.current === version && phaseRef.current === 'opening') applyPhase('open');
      });
    });
  }, [applyPhase, cancelMenuMotion, revealHeader]);

  const dismissImmediately = useCallback(() => {
    revision.current++;
    cancelMenuMotion();
    pendingClose.current = null;
    releaseMenuScroll();
    applyPhase('closed');
    revealHeader(true);
  }, [applyPhase, cancelMenuMotion, releaseMenuScroll, revealHeader]);

  const onAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!menuOpenRef.current || !getAnchorTarget(href)) {
      revealHeader(true);
      return;
    }
    event.preventDefault();
    closeMenu({ afterExit: () => { navigateToAnchor(href); } });
  };

  useLayoutEffect(() => {
    if (!menuMounted) return;
    menuUnlock.current = lockBodyScroll();
    return releaseMenuScroll;
  }, [menuMounted, releaseMenuScroll]);

  useEffect(() => () => {
    revision.current++;
    cancelMenuMotion();
    pendingClose.current = null;
    phaseRef.current = 'closed';
    menuOpenRef.current = false;
    releaseMenuScroll();
  }, [cancelMenuMotion, releaseMenuScroll]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const readY = () => Math.max(0, window.scrollY);
    let lastY = readY();
    let direction = 0;
    let distance = 0;
    let frame: number | null = null;
    let settleTimer: number | undefined;

    const reset = (pin: boolean) => {
      lastY = readY();
      direction = 0;
      distance = 0;
      if (pin) keepPinned();
    };

    function keepPinned() {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        pinned.current = false;
        settleTimer = undefined;
        reset(false);
      }, 180);
    }

    const update = () => {
      frame = null;
      if (pinned.current) keepPinned();
      const y = readY();
      const delta = y - lastY;
      lastY = y;
      const active = document.activeElement;
      const keyboardFocus = active instanceof HTMLElement &&
        root.current?.contains(active) && active.matches(':focus-visible');

      if (reducedMotion.matches || document.documentElement.classList.contains('theme-transitioning') || menuOpenRef.current || pinned.current || keyboardFocus || y < 48) {
        direction = 0;
        distance = 0;
        setHeaderHidden(false);
        return;
      }
      if (delta === 0) return;

      const nextDirection = delta > 0 ? 1 : -1;
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (direction > 0 && y > 96 && distance > 10) {
        setHeaderHidden(true);
        distance = 0;
      } else if (direction < 0 && distance > 8) {
        setHeaderHidden(false);
        distance = 0;
      }
    };

    const onScroll = () => {
      if (reducedMotion.matches) return;
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const onMotionChange = () => {
      reset(false);
      if (reducedMotion.matches) setHeaderHidden(false);
    };

    resetScroll.current = reset;
    if (pinned.current) keepPinned();
    window.addEventListener('scroll', onScroll, { passive: true });
    reducedMotion.addEventListener('change', onMotionChange);
    return () => {
      window.removeEventListener('scroll', onScroll);
      reducedMotion.removeEventListener('change', onMotionChange);
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      resetScroll.current = null;
    };
  }, [setHeaderHidden]);

  useEffect(() => {
    if (!menuMounted) return;

    const onKey = (event: KeyboardEvent) => {
      if (!menuOpenRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu({ restoreFocus: true });
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = root.current?.querySelectorAll<HTMLElement>(
        'a.brand, .header-actions button:not([disabled]), .mobile-nav a[href]',
      );
      const first = focusable?.[0];
      const last = focusable?.[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    const media = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (media.matches) dismissImmediately();
    };
    const resizeFrame = window.requestAnimationFrame(() => {
      if (media.matches) dismissImmediately();
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.addEventListener('popstate', dismissImmediately);
    media.addEventListener('change', onResize);

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('popstate', dismissImmediately);
      media.removeEventListener('change', onResize);
    };
  }, [menuMounted, closeMenu, dismissImmediately]);

  return (
    <>
      {menuMounted && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          data-state={menuPhase}
          tabIndex={-1}
          aria-label={site.ui.closeMenu}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            closeMenu({ restoreFocus: true });
          }}
        />
      )}
      <header
        className="site-header"
        ref={root}
        data-hidden={hidden ? 'true' : 'false'}
        data-menu-open={menuMounted ? 'true' : 'false'}
        onFocusCapture={() => revealHeader()}
      >
        <div className="section-shell header-inner">
          <a
            href="#top"
            className="brand"
            aria-label={site.ui.home}
            onClick={event => onAnchorClick(event, '#top')}
          >
            <BrandMark className="header-brand-mark" decorative />
            <span className="brand-wordmark">
              {site.name}<small>{site.alias}</small>
            </span>
          </a>

          <nav className="desktop-nav" aria-label={site.ui.navigationLabel}>
            {site.navigation.map(item => (
              <a key={item.href} href={item.href} onClick={() => revealHeader(true)}>{item.label}</a>
            ))}
          </nav>

          <div className="header-actions">
            <ThemeToggle onPrepareTransition={() => revealHeader(true)} />
            <button
              type="button"
              className="button button-primary header-ticket"
              onClick={() => closeMenu({ afterExit: openTickets })}
            >
              {site.ui.tickets}<Icon name="arrowUpRight" />
            </button>

            <button
              type="button"
              ref={toggle}
              className="menu-toggle"
              aria-label={menuExpanded ? site.ui.closeMenu : site.ui.menu}
              aria-expanded={menuExpanded}
              aria-controls="mobile-navigation"
              onClick={() => {
                if (phaseRef.current === 'open' || phaseRef.current === 'opening') closeMenu({ restoreFocus: true });
                else openMenu();
              }}
            >
              <Icon name={menuExpanded ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuMounted && (
          <div className="mobile-menu-panel" data-state={menuPhase}>
            <nav
              id="mobile-navigation"
              className="mobile-nav section-shell"
              data-state={menuPhase}
              aria-label={site.ui.navigationLabel}
            >
              {site.navigation.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{ '--menu-index': index } as CSSProperties}
                  onClick={event => onAnchorClick(event, item.href)}
                >
                  {item.label}
                  <Icon name="arrowUpRight" />
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

