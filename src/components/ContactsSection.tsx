import { site } from '@/data/site';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { SectionEyebrow } from './SectionEyebrow';

export function ContactsSection() {
  const contacts = site.contacts;
  const telegram = contacts.telegram;

  return (
    <section id="contacts" className="section-shell section-space" aria-labelledby="contacts-title">
      <Reveal className="contacts-surface glass-surface">
        <SectionEyebrow label={contacts.eyebrow} />
        <div className="contacts-layout">
          <div className="contacts-copy min-w-0">
            <h2 id="contacts-title" className="section-title">{contacts.title}</h2>
            <p className="!mt-6 max-w-xl text-base leading-relaxed text-secondary">{telegram.description}</p>
          </div>

          <div className="telegram-surface">
            <div className="flex items-start justify-between gap-5">
              <svg viewBox="0 0 32 32" fill="none" className="h-9 w-9 text-accent-ink" aria-hidden="true">
                <path d="m4 15 23-9-5 21-8-7-5 3 1-7 13-7-13 10-6-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Icon name="arrowUpRight" className="h-4 w-4 text-detail" />
            </div>
            <h3 className="telegram-heading !mt-6 min-w-0 text-xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-2xl">{telegram.title}</h3>
            {telegram.href ? (
              <a href={telegram.href} target="_blank" rel="noopener noreferrer" className="button button-primary telegram-cta">
                <span className="min-w-0 [overflow-wrap:anywhere]">{telegram.longCTA}</span><Icon name="arrowUpRight" />
              </a>
            ) : (
              <>
                <button type="button" disabled aria-describedby="telegram-pending" className="button button-primary telegram-cta disabled:!cursor-not-allowed disabled:!transform-none">
                  <span className="min-w-0 [overflow-wrap:anywhere]">{telegram.longCTA}</span><Icon name="arrowUpRight" />
                </button>
                <p id="telegram-pending" className="!mt-3 text-xs leading-relaxed text-detail">{telegram.pendingLabel}</p>
              </>
            )}
            {contacts.other.some((contact) => contact.href) && (
              <div className="contact-chips">
                {contacts.other.map((contact) => contact.href ? (
                  <a key={contact.label} href={contact.href} target={contact.href.startsWith('https://') ? '_blank' : undefined} rel={contact.href.startsWith('https://') ? 'noopener noreferrer' : undefined} className="contact-chip min-w-0 max-w-full [overflow-wrap:anywhere]">
                    {contact.label}<Icon name="arrowUpRight" className="h-3 w-3 text-accent-ink" />
                  </a>
                ) : null)}
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

