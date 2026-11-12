import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { languages } from '@/lib/site-content';
import { localePath, projectSlugs } from '@/lib/project-content';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://pm.scholay.com';
  const paths = ['', 'about', 'projects', ...projectSlugs.map(slug => `projects/${slug}`), 'projects/rimes/input-schemes'];
  return [...languages.flatMap(locale => paths.map(path => ({ url: `${base}${localePath(locale, path)}`, changeFrequency: 'monthly' as const, priority: path ? 0.8 : 1 }))), ...getAllPosts().map(post => ({ url: `${base}/posts/${post.slug}/`, lastModified: post.date, changeFrequency: 'monthly' as const, priority: 0.7 }))];
}
