'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/data/site';
import { Icon } from './Icon';
import { useTickets } from './TicketProvider';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const { openTickets } = useTickets();

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };

    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    const media = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (media.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    media.addEventListener('change', onResize);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      media.removeEventListener('change', onResize);
    };
  }, [menuOpen]);

  return (
    <header className="site-header" ref={root}>
      <div className="section-shell header-inner">
        <a
          href="#top"
          className="brand"
          aria-label={site.ui.home}
          onClick={() => setMenuOpen(false)}
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
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="button button-primary header-ticket"
            onClick={() => {
              setMenuOpen(false);
              openTickets();
            }}
          >
            {site.ui.tickets}<Icon name="arrowUpRight" />
          </button>

          <button
            ref={toggle}
            className="menu-toggle"
            aria-label={menuOpen ? site.ui.closeMenu : site.ui.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(value => !value)}
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
          {site.navigation.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <span>0{index + 1}</span>
              {item.label}
              <Icon name="arrowUpRight" />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

