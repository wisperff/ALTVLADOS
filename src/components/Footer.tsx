import { site } from '@/data/site';
import { Icon } from './Icon';

export function Footer() {
  const footer = site.footer;
  const offerUrl = footer.offer.href || site.tickets.offerUrl;
  return (
    <footer className="site-footer">
      <div className="section-shell !py-10 sm:!py-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <a href="#top" className="inline-flex items-baseline gap-3" aria-label={site.ui.home}>
              <span className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight">{site.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-detail">/{site.alias}</span>
            </a>
            <p className="mt-3 text-sm text-detail">{footer.tagline}</p>
          </div>
          <nav aria-label={site.ui.navigationLabel}>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {site.navigation.map(item => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-11 items-center text-xs text-copy underline-offset-4 hover:underline">{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="#top" className="flex min-h-11 w-fit items-center gap-4 text-xs text-copy">{site.ui.backToTop}<span className="flex h-10 w-10 items-center justify-center border border-edge-medium"><Icon name="arrowUpRight" className="h-4 w-4" /></span></a>
        </div>

        <div className="mt-10 grid gap-6 border-t border-edge-subtle pt-7 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="text-xs text-secondary">{footer.legalName}</p>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-detail">{footer.legalDetails}</p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <a href={footer.privacy.href || '#privacy'} className="text-xs underline decoration-edge-decoration underline-offset-4">{footer.privacy.label}</a>
            {offerUrl ? <a href={offerUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline decoration-edge-decoration underline-offset-4">{footer.offer.label}</a> : <p className="text-xs text-detail">{footer.offer.pendingLabel}</p>}
          </div>
        </div>

        {!footer.privacy.href && (
          <details id="privacy" className="mt-7 scroll-mt-24 border-t border-edge-subtle pt-5 text-xs text-detail">
            <summary className="w-fit cursor-pointer py-2 text-secondary">{footer.privacy.title}</summary>
            <p className="mt-3 max-w-3xl leading-relaxed">{footer.privacy.body}</p>
          </details>
        )}
        <div className="mt-7 flex flex-col justify-between gap-3 border-t border-edge-subtle pt-6 font-mono text-[10px] tracking-wide text-detail sm:flex-row">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <p>{footer.credit}</p>
        </div>
      </div>
    </footer>
  );
}
