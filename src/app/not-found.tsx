import { site } from '@/data/site';
import { assetPath } from '@/lib/assetPath';

export default function NotFound() {
  return (
    <main className="section-shell flex min-h-[100dvh] items-center justify-center !py-12">
      <section className="glass-surface w-full max-w-2xl p-8 sm:p-12" aria-labelledby="not-found-title">
        <p className="eyebrow accent">{site.notFound.code}</p>
        <h1 id="not-found-title" className="section-title !mt-5">{site.notFound.title}</h1>
        <a href={assetPath('/')} className="button button-primary mt-8">{site.notFound.action}</a>
      </section>
    </main>
  );
}
