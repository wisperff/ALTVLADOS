import Image from 'next/image';
import { site } from '@/data/site';
import { assetPath } from '@/lib/assetPath';
import { Icon } from './Icon';
import { AmbientStage } from './AmbientStage';
import './ambient.css';

export function HeroSection() {
  const telegram = site.contacts.telegram;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="section-shell hero-shell">
        <div className="hero-meta"><span className="eyebrow"><span className="status-dot" />{site.hero.eyebrow}</span><span>{site.hero.city}<span className="hero-cross" aria-hidden="true"> + </span></span></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-alias">{site.alias}<span aria-hidden="true">✳</span></p>
            <h1 id="hero-title" className="hero-title">{site.hero.title.slice(0, 3)}<br />{site.hero.title.slice(3)}<span className="hero-period" aria-hidden="true">.</span></h1>
            <p className="hero-tagline">{site.hero.tagline}</p>
            <p className="hero-description">{site.hero.description}</p>
            <div className="hero-buttons">
              <a href="#shows" className="button button-primary">{site.hero.primary}<Icon name="arrowUpRight" /></a>
              <a href={telegram.href || '#contacts'} target={telegram.href ? '_blank' : undefined} rel={telegram.href ? 'noopener noreferrer' : undefined} className="button button-ghost hero-route">{site.hero.secondary}<Icon name="arrowUpRight" /></a>
            </div>
          </div>
          <AmbientStage>
            <Image src={assetPath(site.hero.visual)} alt={site.hero.visualAlt} fill priority sizes="(max-width: 767px) 100vw, 54vw" className="hero-image" />
            <div className="art-label"><span className="art-label-dot" /><span>{site.hero.visualLabel}</span><Icon name="arrowDown" /></div>
          </AmbientStage>
        </div>
        <div className="hero-bottom"><span className="hero-city">{site.hero.city}</span><a className="hero-scroll" href="#shows">{site.hero.scroll}<Icon name="arrowDown" /></a></div>
      </div>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-motion">
          {[0, 1].map(track => <div className="ticker-track" key={track}>{site.hero.ticker.map(item => <span key={item}>{item}<span className="ticker-star">✳</span></span>)}</div>)}
        </div>
      </div>
    </section>
  );
}

