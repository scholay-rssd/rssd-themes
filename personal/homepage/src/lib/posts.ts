import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export type Post = { slug: string; title: string; description: string; date: string; category: string; tags: string[]; featured: boolean; readMinutes: number; content: string };
const directory = path.join(process.cwd(), 'content/posts');
export function getAllPosts(): Post[] {
  return fs.readdirSync(directory).filter(f => f.endsWith('.md')).map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(directory, file), 'utf8'));
    if (data.published !== true) return null;
    return { slug: file.replace(/\.md$/, ''), title: String(data.title || '未命名文章'), description: String(data.description || ''), date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || ''), category: String(data.category || '随笔'), tags: Array.isArray(data.tags) ? data.tags.map(String) : [], featured: Boolean(data.featured), readMinutes: Math.max(1, Math.ceil(content.replace(/\s/g, '').length / 450)), content };
  }).filter((post): post is Post => post !== null).sort((a,b) => b.date.localeCompare(a.date));
}
export function getPost(slug: string) { return getAllPosts().find(p => p.slug === slug); }
export async function renderPost(source: string) { return String(await remark().use(html).process(source)); }
