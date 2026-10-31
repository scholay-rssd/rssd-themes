'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/site-content';

type Entry = { id: string; title: string; route: string; role: string; summary: string };
const words: Record<Locale, [string, string, string]> = {
  zh: ['更新、教程与复盘', '查看全部项目记录', '暂无已关联的公开文章。'],
  en: ['Updates, tutorials & reflections', 'All project notes', 'No linked published articles yet.'],
  ja: ['更新・チュートリアル・振り返り', 'プロジェクトの記録', '関連する公開記事はまだありません。'],
  fr: ['Actualités, tutoriels et retours', 'Toutes les notes', 'Aucun article publié associé.'],
  es: ['Novedades, tutoriales y reflexiones', 'Todas las notas', 'Todavía no hay artículos publicados asociados.'],
};

export function ProjectJournal({ slug, locale }: { slug: string; locale: Locale }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/organization/project-notes.json', { signal: controller.signal })
      .then(r => { if (!r.ok) throw Error('Unavailable'); return r.json(); })
      .then(data => {
        if (data.version !== 1 || data.siteId !== 'personal' || !Array.isArray(data.projects?.[slug])) return;
        setEntries(data.projects[slug].filter((r: Entry) => typeof r.title === 'string' && /^\/(?!\/)[^?#\\]*\/$/.test(r.route) && !r.route.includes('..')));
      }).catch(() => { /* The static notes link remains available without JS or network. */ });
    return () => controller.abort();
  }, [slug]);
  return <section className="project-detail-section">
    <div className="home-heading"><span className="section-index">PROJECT JOURNAL</span><h2>{words[locale][0]}</h2></div>
    <div className="resource-links">{entries?.map(entry => <a key={entry.id} href={entry.route}><span>{entry.title}</span><span aria-hidden="true">↗</span></a>)}</div>
    {entries?.length === 0 && <p>{words[locale][2]}</p>}
    <a className="project-return" href={`/project-notes/${slug}/`}>{words[locale][1]} →</a>
  </section>;
}
