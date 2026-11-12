// Reference-led presentation of existing published records. Routes, dates,
// counts and artwork always come from the publication, never from mock data.
import {escapeHtml as esc} from '../../modules/shared.mjs';
import {recordsInCollection} from '../../engine/site-organization.mjs';
import {blogExcerpt} from './blog-presets.mjs';

export const referenceSites=new Set(['xsime','piggytuck','personal','pets','legis','metho','enter','xsiching','study']);
export function referencePage(site,path){
  return referenceSites.has(site.id)&&!(site.id==='xsiching'&&path==='/');
}
export function referenceHome({site,records,sections,directory}){
  const recent=records.slice().sort((a,b)=>String(b.publication.date||'').localeCompare(String(a.publication.date||''))||a.id.localeCompare(b.id));
  const first=recent.find(r=>r.media?.length)||recent[0];
  const sectionName=r=>sections.find(s=>s.id===r.collectionId)?.name||'';
  const image=(r,cls='ref-cover')=>r?.media?.[0]?`<img class="${cls}" src="${esc(r.media[0].src)}" alt="${esc(r.media[0].alt||'')}" width="720" height="450" loading="lazy" decoding="async">`:'';
  const meta=r=>`<div class="entry-meta"><span>${esc(sectionName(r))}</span><time>${esc(r.publication.date||'')}</time></div>`;
  const card=r=>`<article class="ref-card">${r.media?.length?`<a href="${esc(r.route)}" tabindex="-1" aria-hidden="true">${image(r)}</a>`:''}<div class="ref-copy">${meta(r)}<h2><a href="${esc(r.route)}">${esc(r.title)}</a></h2><p>${esc(blogExcerpt(r))}</p><a class="read" href="${esc(r.route)}">阅读全文 →</a></div></article>`;
  const entry=r=>`<article class="ref-entry">${meta(r)}<h2><a href="${esc(r.route)}">${esc(r.title)}</a></h2><p>${esc(blogExcerpt(r))}</p></article>`;
  const heading=(title,href='/archive/')=>`<div class="section-heading"><h2>${title}</h2><a href="${href}">查看全部 →</a></div>`;
  const count=s=>recordsInCollection({records,collections:sections},s.id).length;
  const topics=`<nav class="ref-topics" aria-label="内容栏目">${sections.map(s=>`<a href="${esc(s.route)}">${esc(s.name)}<small>${count(s)}</small></a>`).join('')}</nav>`;
  switch(site.id){
    case 'xsime':return `<section class="ime-product-hero"><p class="eyebrow">XSIME · 犀术输入法</p><h1>每一次输入，<br>都更顺手。</h1><p>从熟悉的拼音，到自己的输入方案。</p><div class="ime-actions"><a class="ref-button" href="/projects/xsime/">安装与下载</a><a href="${esc(sections.find(s=>s.id==='tutorials')?.route||'/archive/')}">查看使用教程 →</a></div><div class="ime-device-stage"><figure><img src="/design/xsime-typing.png" alt="犀术 IME 拼音键盘界面" width="390" height="844"><figcaption>拼音输入</figcaption></figure><figure><img src="/design/xsime-ninekey.png" alt="犀术 IME 九宫格键盘界面" width="390" height="844"><figcaption>九宫格输入</figcaption></figure><div><h2>找到自己的输入节奏</h2><p>方案、外观与使用方法，<br>按你的习惯慢慢调整。</p><a href="/projects/xsime/">了解犀术 IME →</a></div></div></section>${directory}${heading('开发与使用记录')}${recent.slice(0,4).map(entry).join('')}`;
    case 'pets':return `${topics}${first?`<section class="pet-lead">${image(first)}<div>${meta(first)}<h1><a href="${esc(first.route)}">${esc(first.title)}</a></h1><p>${esc(blogExcerpt(first))}</p><a class="read" href="${esc(first.route)}">阅读这篇指南 →</a></div></section>`:''}${heading('与小动物共同生活')}<div class="ref-grid">${recent.filter(r=>r!==first).slice(0,6).map(card).join('')}</div>${directory}`;
    case 'legis':return `<div class="law-issue">法律 · 科技 · 公共议题</div><section class="law-paper"><h1>法律观察</h1><p class="eyebrow">最新文章 / ARTICLES</p>${recent.slice(0,8).map(entry).join('')}<a href="/archive/">浏览全部法律资料 →</a></section>${directory}`;
    case 'metho':{
      // Lab-notebook home: one figure-led lead, a numbered table of contents
      // and a dated log. The lead picture is the first paint, so it is eager.
      const lead=first?`<a class="mx-figure" href="${esc(first.route)}"><figure>${first.media?.length?`<img src="${esc(first.media[0].src)}" alt="${esc(first.media[0].alt||'')}" width="720" height="450" loading="eager" fetchpriority="high" decoding="async">`:''}<figcaption><span>图 1 · 最新图解</span><strong>${esc(first.title)}</strong></figcaption></figure></a>`:'';
      const latest=recent[0]?.publication.date||'';
      const contents=sections.map((s,i)=>`<li><a href="${esc(s.route)}"><span class="mx-num">${String(i+1).padStart(2,'0')}</span><strong>${esc(s.name)}</strong><small>${esc(s.description||'')}</small><em>${count(s)} 篇</em></a></li>`).join('');
      const log=recent.slice(0,8).map(r=>`<li><time>${esc(r.publication.date||'')}</time><span>${esc(sectionName(r))}</span><a href="${esc(r.route)}"><strong>${esc(r.title)}</strong><small>${esc(blogExcerpt(r))}</small></a></li>`).join('');
      return `<section class="mx-hero"><div class="mx-hero-copy"><p class="mx-kicker"><span>METHODS</span>研究方法 · 统计与实验</p><h1>仪式可以模仿，<br><mark>理解</mark>无法伪装。</h1><p class="mx-lede">概念、假设、步骤与结果解释，用可以复算的例子读懂研究方法。</p><div class="mx-actions"><a class="mx-button" href="/archive/">开始阅读</a><a href="#contents">按主题浏览 ↓</a></div><dl class="mx-stats"><div><dt>文章</dt><dd>${records.length}</dd></div><div><dt>主题</dt><dd>${sections.length}</dd></div><div><dt>最近更新</dt><dd>${esc(latest)}</dd></div></dl></div>${lead}</section><section class="mx-contents" id="contents" aria-labelledby="mx-contents-title"><h2 class="mx-label" id="mx-contents-title">目录 <span>CONTENTS</span></h2><ol>${contents}</ol></section><section class="mx-log" aria-labelledby="mx-log-title"><div class="mx-log-head"><h2 class="mx-label" id="mx-log-title">最近更新 <span>LOG</span></h2><a href="/archive/">全部文章 →</a></div><ol>${log}</ol></section>${directory}`;
    }
    case 'enter':return `<section class="ref-title"><h1>发现适合研究的工具</h1><p>软件、检索入口、论坛与课程资源。</p><form class="resource-search" action="/archive/" role="search"><label for="resource-query">搜索资源</label><input id="resource-query" name="q" type="search" placeholder="资源名称、用途或研究任务"><button type="submit">搜索</button></form></section>${topics}${heading('最近收录','/showcase/')}<div class="ref-grid resource-grid">${recent.slice(0,9).map(card).join('')}</div>${directory}`;
    case 'study':return `<section class="ref-title"><h1>学习资源</h1><p>选择一个方向，从已有课程和资料开始。</p></section><div class="learn-grid">${sections.map((s,i)=>{const items=recordsInCollection({records,collections:sections},s.id),r=items.find(x=>x.media?.length);return `<a class="learn-course course-${i}" href="${esc(s.route)}">${image(r)}<div><h2>${esc(s.name)}</h2><p>${esc(s.description||'')}</p><small>查看 ${items.length} 篇资料 →</small></div></a>`;}).join('')}</div>${heading('最近收录')}<div class="ref-grid">${recent.slice(0,4).map(card).join('')}</div>${directory}`;
    default:return null;
  }
}
