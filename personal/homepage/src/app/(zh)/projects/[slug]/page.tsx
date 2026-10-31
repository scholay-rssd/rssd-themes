import { notFound } from 'next/navigation';
import { ProjectDetail } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { isProjectSlug, pageMetadata, projectName, projectSlugs, projectSummary } from '@/lib/project-content';

export const dynamicParams = false;
export function generateStaticParams() { return projectSlugs.map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if (!isProjectSlug(slug)) return {};
  return pageMetadata('zh', `projects/${slug}`, projectName('zh', slug), projectSummary('zh', slug));
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; if (!isProjectSlug(slug)) notFound();
  return <><PageStructuredData locale="zh" path={`projects/${slug}`} title={projectName('zh', slug)} description={projectSummary('zh', slug)} /><ProjectDetail locale="zh" slug={slug} /></>;
}
