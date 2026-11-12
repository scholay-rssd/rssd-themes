import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/site-content';
import { AboutPage } from '@/components/about-page';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata } from '@/lib/project-content';
import { aboutCopy } from '@/lib/about-content';
const plain = (text: string) => text.replace(/\*\*/g, '');
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') return {};
  return pageMetadata(lang, 'about', aboutCopy[lang].title, plain(aboutCopy[lang].paragraphs[0]));
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') notFound();
  return <><PageStructuredData locale={lang} path="about" title={aboutCopy[lang].title} description={plain(aboutCopy[lang].paragraphs[0])} /><AboutPage locale={lang} /></>;
}
