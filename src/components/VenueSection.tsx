import Image from 'next/image';
import { site } from '@/data/site';
import { assetPath } from '@/lib/assetPath';
import { Icon } from './Icon';
import { Reveal } from './Reveal';

export function VenueSection() {
  const venue = site.venue;
  return (
    <section id="venue" className="section-shell" aria-labelledby="venue-title">
      <Reveal className="venue-intro glass-surface">
        <p className="eyebrow">{venue.eyebrow}</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
          <h2 id="venue-title" className="section-title whitespace-pre-line">{venue.title}</h2>
          <div className="max-w-xl lg:pb-2">
            <p className="text-base leading-relaxed text-copy sm:text-lg">{venue.description}</p>
            <p className="mt-5 border-l border-accent-edge pl-4 text-xs leading-relaxed text-detail">{venue.placeholderNote}</p>
          </div>
        </div>
      </Reveal>

      <div className="venue-features mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {venue.features.map((feature, index) => (
          <Reveal key={feature.number} delay={index * 60} className="tonal-card venue-feature group p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="pill-tag font-mono text-subtle">/{feature.number}</span>
              <Icon name={feature.icon} className="h-7 w-7 text-accent-ink transition-transform duration-300 group-hover:-translate-y-1" />
            </div>
            <h3 className="mt-10 text-lg font-semibold tracking-tight">{feature.title}</h3>
            <p className="mt-3 max-w-64 text-sm leading-relaxed text-detail">{feature.description}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {venue.gallery.map((photo, index) => (
          <Reveal key={photo.src} delay={index * 60} className={index === 0 ? 'sm:col-span-2' : ''}>
            <figure className="gallery-card group relative h-64 overflow-hidden border border-edge-subtle bg-panel sm:h-72 lg:h-80">
              <Image src={assetPath(photo.src)} alt={photo.alt} fill sizes={index === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'} className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-14 font-mono text-xs uppercase tracking-wider text-on-art-copy">{photo.label}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
      <p className="venue-gallery-note text-xs leading-relaxed text-detail">{venue.galleryNote}</p>
    </section>
  );
}
