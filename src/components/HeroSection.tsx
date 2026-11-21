import { site } from '@/data/site';
import { Icon } from './Icon';
import { AmbientStage } from './AmbientStage';
import { HeroArtwork } from './HeroArtwork';
import { Marquee } from './Marquee';
import './ambient.css';

export function HeroSection() {
  const telegram = site.contacts.telegram;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="section-shell hero-shell">
        <div className="hero-meta"><span className="eyebrow"><span className="status-dot" />{site.hero.eyebrow}</span></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-alias">{site.alias}<span aria-hidden="true"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" focusable="false"><path d="M10 2v16M2 10h16M4.35 4.35l11.3 11.3M4.35 15.65l11.3-11.3" /></svg></span></p>
            <h1 id="hero-title" className="hero-title">{site.hero.title.slice(0, 3)}<br />{site.hero.title.slice(3)}<span className="hero-period" aria-hidden="true">.</span></h1>
            <p className="hero-tagline">{site.hero.tagline}</p>
            <p className="hero-description">{site.hero.description}</p>
            <div className="hero-buttons">
              <a href="#shows" className="button button-primary">{site.hero.primary}<Icon name="arrowUpRight" /></a>
              <a href={telegram.href || '#contacts'} target={telegram.href ? '_blank' : undefined} rel={telegram.href ? 'noopener noreferrer' : undefined} className="button button-ghost hero-route">{site.hero.secondary}<Icon name="arrowUpRight" /></a>
            </div>
          </div>
          <AmbientStage>
            <HeroArtwork label={site.hero.visualAlt} />
            <div className="art-label"><span className="art-label-dot" /><span>{site.hero.visualLabel}</span><Icon name="arrowDown" /></div>
          </AmbientStage>
        </div>
        <div className="hero-bottom"><span className="hero-city">{site.hero.city}</span><a className="hero-scroll" href="#shows">{site.hero.scroll}<Icon name="arrowDown" /></a></div>
      </div>
      <Marquee>
        <div className="ticker-motion">
          {[0, 1].map(track => (
            <div className="ticker-track" key={track}>
              {site.hero.ticker.map(item => (
                <span key={item}>
                  {item}
                  <svg className="ticker-star" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false">
                    <path d="M10 2v16M2 10h16M4.35 4.35l11.3 11.3M4.35 15.65l11.3-11.3" />
                  </svg>
                </span>
              ))}
            </div>
          ))}
        </div>
      </Marquee>
    </section>
  );
}

