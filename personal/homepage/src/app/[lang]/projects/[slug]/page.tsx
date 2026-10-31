import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/site-content';
import { ProjectDetail } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { isProjectSlug, pageMetadata, projectName, projectSlugs, projectSummary } from '@/lib/project-content';

export const dynamicParams = false;
export function generateStaticParams() { return projectSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params; if (!isLocale(lang) || lang === 'zh' || !isProjectSlug(slug)) return {};
  return pageMetadata(lang, `projects/${slug}`, projectName(lang, slug), projectSummary(lang, slug));
}
export default async function Page({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params; if (!isLocale(lang) || lang === 'zh' || !isProjectSlug(slug)) notFound();
  return <><PageStructuredData locale={lang} path={`projects/${slug}`} title={projectName(lang, slug)} description={projectSummary(lang, slug)} /><ProjectDetail locale={lang} slug={slug} /></>;
}
