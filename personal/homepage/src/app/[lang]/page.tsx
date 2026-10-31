import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PersonalHome } from '@/components/personal-home';
import { PageStructuredData } from '@/components/page-structured-data';
import { homeTitle, homeDescription, shareMetadata } from '@/lib/site-metadata';
import { isLocale, languages } from '@/lib/site-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang) || lang === 'zh') return {};
  return {
    title: { absolute: homeTitle(lang) },
    description: homeDescription(lang),
    ...shareMetadata(lang, `/${lang}/`, homeTitle(lang), homeDescription(lang)),
    alternates: {
      canonical: `/${lang}/`,
      languages: { ...Object.fromEntries(languages.map((locale) => [locale, locale === 'zh' ? '/' : `/${locale}/`])), 'x-default': '/' },
    },
  };
}

export default async function LocalizedHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang) || lang === 'zh') notFound();
  return <><PageStructuredData locale={lang} title={homeTitle(lang)} description={homeDescription(lang)} /><PersonalHome locale={lang} /></>;
}
