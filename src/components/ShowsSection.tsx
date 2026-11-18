'use client';

import { site } from '@/data/site';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { useTickets } from './TicketProvider';

export function ShowsSection() {
  const { openTickets } = useTickets();
  const content = site.showsSection;
  const telegram = site.contacts.telegram;
  const placeholder = content.mode === 'placeholder' || site.shows.length === 0;
  return <section id="shows" className="section-shell section-space" aria-labelledby="shows-title">
    <Reveal><div className="section-heading"><div><p className="eyebrow">{content.eyebrow}</p><h2 id="shows-title" className="section-title">{content.title}<span className="accent"> /</span></h2></div><span className="status-label punk-sticker"><span className="status-dot" />{placeholder ? content.status : content.mode === 'demo' ? content.demoLabel : content.liveLabel}</span></div></Reveal>
    {placeholder ? <Reveal><div className="show-placeholder glass-surface">
      <div className="show-visual" aria-hidden="true"><span className="show-orbit orbit-one" /><span className="show-orbit orbit-two" /><div className="wave-mark">{[2, 4, 6, 8, 10, 7, 5, 3, 5, 8, 10, 6, 4, 2].map((height, index) => <i key={index} style={{ height: `${height * 9}px` }} />)}</div></div>
      <div className="show-placeholder-copy"><p className="eyebrow accent">{content.emptyLabel}</p><h3>{content.emptyTitle}</h3><p className="text-muted">{content.emptyDescription}</p>
        <a className="button button-primary mt-7" href={telegram.href || '#contacts'} target={telegram.href ? '_blank' : undefined} rel={telegram.href ? 'noopener noreferrer' : undefined}>{telegram.href ? telegram.buttonLabel : content.telegramLabel}<Icon name="arrowUpRight" /></a>
      </div>
    </div></Reveal> : <div>
      {content.mode === 'demo' && <p className="demo-notice">{content.demoNote}</p>}
      <div className="shows-list">{site.shows.map((show, index) => <Reveal key={show.id} delay={index * 65}><article className="show-row tonal-card"><time className="show-date" dateTime={show.dateTime}><strong>{show.day}</strong><span>{show.month}</span></time><div className="show-info"><div className="show-meta"><span className="pill-tag">{show.tag}</span><span className="pill-tag">{show.time}</span><span className="pill-tag punk-tag">{show.age}</span></div><h3>{show.title}</h3></div><span className="show-price">{show.price}</span><button className="button button-primary" onClick={() => openTickets(show)}>{content.buyLabel}<Icon name="arrowUpRight" /></button></article></Reveal>)}</div>
    </div>}
  </section>;
}

