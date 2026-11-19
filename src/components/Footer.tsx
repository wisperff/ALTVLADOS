import { site } from '@/data/site';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';
import { PrivacyDisclosure, PrivacyLink } from './PrivacyLink';
import { RagRugRunner } from './RagRugRunner';

export function Footer() {
  const footer = site.footer;
  const offerUrl = footer.offer.href || site.tickets.offerUrl;
  return (
    <footer className="site-footer" style={{ paddingBottom: 'var(--cookie-reserve, 0px)' }}>
      <div className="section-shell !py-10 sm:!py-14">
        <div className="footer-main flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <a href="#top" className="footer-brand inline-flex max-w-full items-center gap-3" aria-label={site.ui.home}>
              <BrandMark className="footer-brand-mark h-10 w-10 shrink-0" />
              <span className="footer-brand-copy min-w-0">
                <span className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase tracking-tight">{site.name}</span>
                <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-detail">/{site.alias}</span>
              </span>
            </a>
            <p className="footer-tagline mt-3 text-sm text-detail">{footer.tagline}</p>
          </div>
          <nav aria-label={site.ui.navigationLabel} className="footer-nav min-w-0">
            <ul className="flex flex-wrap items-center gap-2">
              {site.navigation.map(item => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-11 items-center text-xs text-copy underline-offset-4 hover:underline">{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="#top" className="footer-back-to-top flex min-h-11 w-fit items-center gap-4 text-xs text-copy">{site.ui.backToTop}<span className="flex h-10 w-10 items-center justify-center border border-edge-medium"><Icon name="arrowUpRight" className="h-4 w-4" /></span></a>
        </div>

        <div className="footer-rug-zone">
          <div className="footer-rug-art pointer-events-none select-none" aria-hidden="true">
            <RagRugRunner className="footer-rug-runner" orientation="horizontal" />
          </div>
          <div className="footer-rug-legal footer-rug-panel">
            <p className="text-xs text-secondary">{footer.legalName}</p>
            <p className="footer-legal-details mt-2 max-w-lg text-xs leading-relaxed text-detail">{footer.legalDetails}</p>
          </div>
          <div className="footer-legal-links footer-rug-links footer-rug-panel">
            <PrivacyLink className="inline-flex min-h-11 items-center text-xs underline decoration-edge-decoration underline-offset-4">{footer.privacy.label}</PrivacyLink>
            {offerUrl ? <a href={offerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs underline decoration-edge-decoration underline-offset-4">{footer.offer.label}</a> : <p className="text-xs text-detail">{footer.offer.pendingLabel}</p>}
          </div>
          {!footer.privacy.href && (
            <PrivacyDisclosure className="footer-rug-privacy footer-rug-panel scroll-mt-24 text-xs text-detail">
              <summary className="w-fit cursor-pointer text-secondary">{footer.privacy.title}</summary>
              <p className="footer-privacy-copy mt-3 max-w-3xl leading-relaxed">{footer.privacy.body}</p>
            </PrivacyDisclosure>
          )}
        </div>
        <div className="flex flex-col justify-between gap-3 pt-6 font-mono text-[10px] tracking-wide text-detail sm:flex-row">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <p>{footer.credit}</p>
        </div>
      </div>
    </footer>
  );
}

