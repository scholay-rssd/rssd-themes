import { notFound } from 'next/navigation';
import { isLocale, languages } from '@/lib/site-content';
import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import { ClarityScript } from '@/components/clarity-script';
import '../globals.css';
import '../personal-home.css';
import '../project-pages.css';
import '../scheme-catalog.css';
import '../split-keyboard.css';
import '../color-mode.css';

export const dynamicParams = false;
export function generateStaticParams() { return languages.filter(lang => lang !== 'zh').map(lang => ({ lang })); }

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default async function LanguageLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === 'zh') notFound();
  return <html lang={lang}><body>{children}<ClarityScript /></body></html>;
}
