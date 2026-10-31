'use client';
import { ArrowUpRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Post } from '@/lib/posts';
type BrowserPost = Omit<Post, 'content'>;
export function PostBrowser({ posts }: { posts: BrowserPost[] }) {
  const [query, setQuery] = useState(''); const [tag, setTag] = useState('全部');
  const tags = ['全部', ...Array.from(new Set(posts.flatMap(p => p.tags)))];
  const results = useMemo(() => posts.filter(p => (tag === '全部' || p.tags.includes(tag)) && (!query.trim() || [p.title,p.description,p.category,...p.tags].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [posts, query, tag]);
  return <div><div className="journal-tools"><div className="tag-list" aria-label="文章标签">{tags.map(t => <button key={t} onClick={() => setTag(t)} className={`tag-button ${tag === t ? 'active' : ''}`}>{t}</button>)}</div><label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索文章 / 关键词" aria-label="搜索文章"/>{query && <button onClick={() => setQuery('')} aria-label="清空搜索"><X size={15}/></button>}</label></div><div className="post-list">{results.map((p,i) => <Link href={`/posts/${p.slug}/`} className="post-row" key={p.slug}><div className="post-index">{String(i+1).padStart(2,'0')}</div><div className="post-body"><div className="post-meta"><span>{p.category}</span><span>{p.date}</span><span>{p.readMinutes} 分钟阅读</span></div><h3>{p.title}</h3><p>{p.description}</p><div className="post-tags">{p.tags.map(t => <span key={t}>#{t}</span>)}</div></div><ArrowUpRight className="post-arrow" size={23}/></Link>)}{results.length === 0 && <div className="empty-state"><span>∅</span><h3>暂时没有找到文章</h3><p>试试换一个关键词或标签。</p><button onClick={() => {setQuery('');setTag('全部');}}>查看全部文章</button></div>}</div></div>;
}
