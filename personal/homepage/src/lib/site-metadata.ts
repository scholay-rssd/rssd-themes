import type { Metadata, Viewport } from 'next';
import { copy, type Locale } from './site-content';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pm.scholay.com';
export const homeTitle = (locale: Locale) => `学术海 · ${copy[locale].role}`;
export const homeDescription = (locale: Locale) => copy[locale].intro;
export const siteDescription = homeDescription('zh');
export function shareMetadata(locale: Locale, url: string, title: string, description: string): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = { url: new URL('/apple-touch-icon.png?v=bw-v8-20261017', siteUrl).href, width: 180, height: 180, alt: '学术海' };
  return {
    openGraph: { type: 'website', locale: { zh: 'zh_CN', en: 'en_US', ja: 'ja_JP', fr: 'fr_FR', es: 'es_ES' }[locale], siteName: '学术海', title, description, url: new URL(url, siteUrl).href, images: [image] },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export const siteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: homeTitle('zh'), template: '%s · 学术海' },
  description: siteDescription,
  applicationName: '学术海',
  alternates: { canonical: '/', languages: { zh: '/', en: '/en/', ja: '/ja/', fr: '/fr/', es: '/es/', 'x-default': '/' } },
  ...shareMetadata('zh', '/', homeTitle('zh'), siteDescription),
  robots: { index: true, follow: true },
  icons: { icon: [{url:'/favicon.ico?v=bw-v8-20261017',sizes:'16x16 32x32 48x48'},{url:'/favicon-32.png?v=bw-v8-20261017',type:'image/png',sizes:'32x32'}], apple: [{url:'/apple-touch-icon.png?v=bw-v8-20261017',sizes:'180x180'}] },
};

export const siteViewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#202928' },
  ],
};
