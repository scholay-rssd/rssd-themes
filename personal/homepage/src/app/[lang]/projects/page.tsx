import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/site-content';
import { ProjectIndex } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata, projectCopy } from '@/lib/project-content';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') return {};
  return pageMetadata(lang, 'projects', projectCopy[lang].projects, projectCopy[lang].indexIntro);
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; if (!isLocale(lang) || lang === 'zh') notFound();
  return <><PageStructuredData locale={lang} path="projects" title={projectCopy[lang].projects} description={projectCopy[lang].indexIntro} /><ProjectIndex locale={lang} /></>;
}
