'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '@/data/site';
import { lockBodyScroll } from '@/lib/scrollLock';
import { Icon } from './Icon';
import { useTickets } from './TicketProvider';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const hiddenRef = useRef(false);
  const menuOpenRef = useRef(false);
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

  const closeMenu = useCallback((restoreFocus = false) => {
    menuOpenRef.current = false;
    // Unlock before the browser follows an anchor in this click event.
    releaseMenuScroll();
    setMenuOpen(false);
    revealHeader(true);
    if (restoreFocus) toggle.current?.focus({ preventScroll: true });
  }, [releaseMenuScroll, revealHeader]);

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

      if (reducedMotion.matches || menuOpenRef.current || pinned.current || keyboardFocus || y < 48) {
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
    if (!menuOpen) return;
    menuUnlock.current = lockBodyScroll();

    const onKey = (event: KeyboardEvent) => {
      if (!menuOpenRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
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
      if (media.matches) closeMenu();
    };
    const resizeFrame = window.requestAnimationFrame(onResize);
    document.addEventListener('keydown', onKey);
    media.addEventListener('change', onResize);

    return () => {
      releaseMenuScroll();
      window.cancelAnimationFrame(resizeFrame);
      document.removeEventListener('keydown', onKey);
      media.removeEventListener('change', onResize);
    };
  }, [menuOpen, closeMenu, releaseMenuScroll]);

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          tabIndex={-1}
          aria-label={site.ui.closeMenu}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            closeMenu(true);
          }}
        />
      )}
      <header
        className="site-header"
        ref={root}
        data-hidden={hidden ? 'true' : 'false'}
        data-menu-open={menuOpen ? 'true' : 'false'}
        onFocusCapture={() => revealHeader()}
      >
        <div className="section-shell header-inner">
          <a
            href="#top"
            className="brand"
            aria-label={site.ui.home}
            onClick={() => closeMenu()}
          >
            <span className="brand-symbol" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="brand-wordmark">
              {site.name}<small>{site.alias}</small>
            </span>
          </a>

          <nav className="desktop-nav" aria-label={site.ui.navigationLabel}>
            {site.navigation.map(item => (
              <a key={item.href} href={item.href} onClick={() => closeMenu()}>{item.label}</a>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="button button-primary header-ticket"
              onClick={() => {
                closeMenu();
                openTickets();
              }}
            >
              {site.ui.tickets}<Icon name="arrowUpRight" />
            </button>

            <button
              type="button"
              ref={toggle}
              className="menu-toggle"
              aria-label={menuOpen ? site.ui.closeMenu : site.ui.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                if (menuOpenRef.current) closeMenu(true);
                else {
                  menuOpenRef.current = true;
                  revealHeader(true);
                  setMenuOpen(true);
                }
              }}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="mobile-nav section-shell"
            aria-label={site.ui.navigationLabel}
          >
            {site.navigation.map(item => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => closeMenu()}
              >
                {item.label}
                <Icon name="arrowUpRight" />
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}

