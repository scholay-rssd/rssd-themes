import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/site-content';
import { InputSchemePage } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata, projectCopy } from '@/lib/project-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') return {};
  return pageMetadata(lang, 'projects/rimes/input-schemes', projectCopy[lang].catalog, projectCopy[lang].catalogIntro);
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') notFound();
  return <><PageStructuredData locale={lang} path="projects/rimes/input-schemes" title={projectCopy[lang].catalog} description={projectCopy[lang].catalogIntro} /><InputSchemePage locale={lang} /></>;
}
