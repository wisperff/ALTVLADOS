import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Manrope, Unbounded } from 'next/font/google';
import { site } from '@/data/site';
import { assetPath } from '@/lib/assetPath';
import './globals.css';
import './punk.css';

const bodyFont = Manrope({ subsets: ['cyrillic', 'latin'], weight: 'variable', variable: '--font-body', display: 'swap' });
const displayFont = Unbounded({ subsets: ['cyrillic', 'latin'], weight: 'variable', variable: '--font-display', display: 'swap' });
const technicalFont = JetBrains_Mono({ subsets: ['cyrillic', 'latin'], weight: 'variable', variable: '--font-tech', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: site.metadata.title,
  description: site.metadata.description,
  icons: { icon: assetPath('/favicon.svg') },
  openGraph: { title: site.metadata.title, description: site.metadata.description, locale: 'ru_RU', type: 'website' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#060706',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className={`${bodyFont.variable} ${displayFont.variable} ${technicalFont.variable}`}><body>{children}</body></html>;
}

