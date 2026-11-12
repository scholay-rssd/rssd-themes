// Reference-led presentation of existing published records. Routes, dates,
// counts and artwork always come from the publication, never from mock data.
import {escapeHtml as esc} from '../../modules/shared.mjs';
import {recordsInCollection} from '../../engine/site-organization.mjs';
import {blogExcerpt} from './blog-presets.mjs';

export const referenceSites=new Set(['xsime','piggytuck','personal','pets','legis','metho','enter','xsiching','study']);
export function referencePage(site,path){
  return referenceSites.has(site.id)&&!(site.id==='xsiching'&&path==='/');
}
export function referenceHome({site,records,sections,directory,pictureRatio=()=>undefined}){
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
    case 'pets':{
      // Picture almanac. Every picture box takes its picture's own shape (less
      // the site-name band at the foot of published pictures), so differently
      // shaped pictures are never cropped to one box: today's cat and dog share
      // a row height, stories form a masonry, exotic pets form justified rows.
      const withPhoto=r=>r?.media?.length;
      const ratio=r=>{const value=withPhoto(r)&&pictureRatio(r.media[0].src);return Number.isFinite(value)?Math.min(2.4,Math.max(.55,value)):4/3;};
      const box=r=>(ratio(r)/.96).toFixed(4);
      const photo=(r,eager=false)=>withPhoto(r)?`<img src="${esc(r.media[0].src)}" alt="${esc(r.media[0].alt||'')}" width="1000" height="${Math.round(1000/ratio(r))}" ${eager?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async">`:'';
      const chip=(r,label=sectionName(r))=>`<span class="pt-chip" data-section="${esc(r.collectionId||'')}">${esc(label)}</span>`;
      const cat=recent.find(r=>r.collectionId==='daily-cat'&&withPhoto(r)),dog=recent.find(r=>r.collectionId==='daily-dog'&&withPhoto(r));
      const daily=(r,label)=>r?`<a class="pt-daily" style="--ar:${box(r)}" href="${esc(r.route)}">${photo(r,true)}<div>${chip(r,label)}<h2>${esc(r.title)}</h2><time>${esc(r.publication.date||'')}</time></div></a>`:'';
      const shown=new Set([cat,dog].filter(Boolean));
      // Every recent story can appear here, with or without a picture; exotic
      // pets with pictures have their own index below.
      const stories=recent.filter(r=>!shown.has(r)&&!(r.collectionId==='exotic-pets'&&withPhoto(r))).slice(0,6);
      // One tile per species: several articles can cover the same animal.
      const speciesName=r=>{const head=r.title.split(/[：:]/)[0].trim(),short=head.split('的')[0];return short.length>=2&&short.length<=8?short:head;},seen=new Set();
      const exotic=recent.filter(r=>r.collectionId==='exotic-pets'&&withPhoto(r)&&!seen.has(speciesName(r))&&seen.add(speciesName(r))).slice(0,8);
      // Gallery: each story is its picture at its own shape, in justified rows of
      // three; chip, title and summary sit on a mask over the picture.
      const story=r=>`<a class="pt-card" data-section="${esc(r.collectionId||'')}" style="--ar:${box(r)}" href="${esc(r.route)}">${photo(r)}<div class="pt-mask">${chip(r)}<h3>${esc(r.title)}</h3><p>${esc(blogExcerpt(r))}</p></div></a>`;
      const gallery=[];for(let i=0;i<stories.length;i+=3)gallery.push(`<div class="pt-row">${stories.slice(i,i+3).map(story).join('')}</div>`);
      const tile=r=>`<a class="pt-tile" style="--ar:${box(r)}" href="${esc(r.route)}"><span class="pt-photo">${photo(r)}</span><b>${esc(speciesName(r))}</b></a>`;
      // Rows of four on wide screens, each made of two pairs that become their own rows on phones.
      const pair=list=>`<div class="pt-pair">${list.map(tile).join('')}</div>`;
      const rows=[];for(let i=0;i<exotic.length;i+=4)rows.push(`<div class="pt-row">${pair(exotic.slice(i,i+2))}${exotic.length>i+2?pair(exotic.slice(i+2,i+4)):''}</div>`);
      const exoticRoute=sections.find(s=>s.id==='exotic-pets')?.route||'/archive/';
      return `<section class="pt-hero"><div class="pt-greeting"><p class="pt-kicker">🐾 ${esc(site.name)}</p><h1>${esc(site.slogan||site.name)}</h1><p>${esc(site.description||'')}</p></div><div class="pt-dailies">${daily(cat,'今日一猫')}${daily(dog,'今日一狗')}</div></section><nav class="pt-sections" aria-label="内容栏目">${sections.map(s=>`<a class="pt-section" data-section="${esc(s.id)}" href="${esc(s.route)}"><b>${esc(s.name)}</b><small>${esc(s.description||'')}</small><em>${count(s)} 篇</em></a>`).join('')}</nav><section class="pt-block" aria-labelledby="pt-latest"><div class="pt-head"><h2 id="pt-latest">最近的故事</h2><a href="/archive/">全部文章 →</a></div><div class="pt-gallery">${gallery.join('')}</div></section>${exotic.length?`<section class="pt-block" aria-labelledby="pt-exotic"><div class="pt-head"><h2 id="pt-exotic">异宠图鉴</h2><a href="${esc(exoticRoute)}">查看全部 →</a></div><div class="pt-tiles">${rows.join('')}</div></section>`:''}${directory}`;
    }
    case 'legis':{
      // Law review in issues: every publication date is an issue of one article
      // per section. The latest issue leads; sections read as dockets; past
      // issues form a table of contents. The lead picture keeps its own shape.
      const dates=[...new Set(recent.map(r=>r.publication.date).filter(Boolean))];
      const issueNo=d=>dates.length-dates.indexOf(d),longDate=d=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||'');return m?`${m[1]} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`:esc(d||'');};
      const issue=recent.filter(r=>r.publication.date===dates[0]),lead=issue.find(r=>r.media?.length)||issue[0],others=issue.filter(r=>r!==lead);
      const section=r=>`<span class="lx-section">§ ${esc(sectionName(r))}</span>`;
      const ratio=r=>{const v=r?.media?.length&&pictureRatio(r.media[0].src);return Number.isFinite(v)?Math.min(2.4,Math.max(.6,v)):0;};
      const figure=r=>ratio(r)?`<a class="lx-figure" href="${esc(r.route)}" style="--ar:${(ratio(r)/.96).toFixed(4)}" tabindex="-1" aria-hidden="true"><img src="${esc(r.media[0].src)}" alt="${esc(r.media[0].alt||'')}" width="1000" height="${Math.round(1000/ratio(r))}" loading="eager" fetchpriority="high" decoding="async"></a>`:'';
      const leadHtml=lead?`<article class="lx-lead">${figure(lead)}${section(lead)}<h2><a href="${esc(lead.route)}">${esc(lead.title)}</a></h2><p>${esc(blogExcerpt(lead))}</p><a class="lx-more" href="${esc(lead.route)}">阅读全文 →</a></article>`:'';
      const entryHtml=(r,i)=>`<article class="lx-entry"><span class="lx-no">${String(i+2).padStart(2,'0')}</span><div>${section(r)}<h3><a href="${esc(r.route)}">${esc(r.title)}</a></h3><p>${esc(blogExcerpt(r))}</p></div></article>`;
      const docket=s=>{const items=recent.filter(r=>r.collectionId===s.id).slice(0,4);return `<section class="lx-docket"><h3><a href="${esc(s.route)}">${esc(s.name)}</a></h3><p>${esc(s.description||'')}</p><ol>${items.map(r=>`<li><a href="${esc(r.route)}">${esc(r.title)}</a><time>${esc(r.publication.date||'')}</time></li>`).join('')}</ol><a class="lx-more" href="${esc(s.route)}">全部 ${count(s)} 篇 →</a></section>`;};
      const past=dates.slice(1,7).map(d=>`<tr><th scope="row"><b>第 ${issueNo(d)} 期</b><time>${esc(d)}</time></th><td>${recent.filter(r=>r.publication.date===d).map(r=>`<a href="${esc(r.route)}"><span>${esc(sectionName(r))}</span>${esc(r.title)}</a>`).join('')}</td></tr>`).join('');
      return `<header class="lx-issue"><p class="lx-kicker">${esc(site.name)} · LAW &amp; AI REVIEW</p><h1>第 ${issueNo(dates[0])} 期</h1><p class="lx-date">${longDate(dates[0])}</p><p class="lx-motto">${esc(site.slogan||site.description||'')}</p></header><section class="lx-current" aria-label="本期文章">${leadHtml}<div class="lx-entries">${others.map(entryHtml).join('')}</div></section><section class="lx-dockets" aria-labelledby="lx-dockets-title"><h2 class="lx-label" id="lx-dockets-title">栏目 <span>DOCKETS</span></h2><div>${sections.map(docket).join('')}</div></section>${past?`<section class="lx-past" aria-labelledby="lx-past-title"><h2 class="lx-label" id="lx-past-title">往期 <span>PAST ISSUES</span></h2><table>${past}</table><a class="lx-more" href="/archive/">浏览全部法律资料 →</a></section>`:''}${directory}`;
    }
    case 'metho':{
      // Lab-notebook home: one figure-led lead, a numbered table of contents
      // and a dated log. The lead picture is the first paint, so it is eager.
      const lead=first?`<a class="mx-figure" href="${esc(first.route)}"><figure>${first.media?.length?`<img src="${esc(first.media[0].src)}" alt="${esc(first.media[0].alt||'')}" width="720" height="450" loading="eager" fetchpriority="high" decoding="async">`:''}<figcaption><span>图 1 · 最新图解</span><strong>${esc(first.title)}</strong></figcaption></figure></a>`:'';
      const latest=recent[0]?.publication.date||'';
      const contents=sections.map((s,i)=>`<li><a href="${esc(s.route)}"><span class="mx-num">${String(i+1).padStart(2,'0')}</span><strong>${esc(s.name)}</strong><small>${esc(s.description||'')}</small><em>${count(s)} 篇</em></a></li>`).join('');
      const log=recent.slice(0,8).map(r=>`<li><time>${esc(r.publication.date||'')}</time><span>${esc(sectionName(r))}</span><a href="${esc(r.route)}"><strong>${esc(r.title)}</strong><small>${esc(blogExcerpt(r))}</small></a></li>`).join('');
      return `<section class="mx-hero"><div class="mx-hero-copy"><p class="mx-kicker"><span>METHODS</span>研究方法 · 统计与实验</p><h1>仪式可以模仿，<br><mark>理解</mark>无法伪装。</h1><p class="mx-lede">概念、假设、步骤与结果解释，用可以复算的例子读懂研究方法。</p><div class="mx-actions"><a class="mx-button" href="/archive/">开始阅读</a><a href="#contents">按主题浏览 ↓</a></div><dl class="mx-stats"><div><dt>文章</dt><dd>${records.length}</dd></div><div><dt>主题</dt><dd>${sections.length}</dd></div><div><dt>最近更新</dt><dd>${esc(latest)}</dd></div></dl></div>${lead}</section><section class="mx-contents" id="contents" aria-labelledby="mx-contents-title"><h2 class="mx-label" id="mx-contents-title">目录 <span>CONTENTS</span></h2><ol>${contents}</ol></section><section class="mx-log" aria-labelledby="mx-log-title"><div class="mx-log-head"><h2 class="mx-label" id="mx-log-title">最近更新 <span>LOG</span></h2><a href="/archive/">全部文章 →</a></div><ol>${log}</ol></section>${directory}`;
    }
    case 'enter':{
      // Wayfinding: the site is a gateway, so each section is a coloured line,
      // its latest articles are stops, and the newest arrivals form a board.
      const no=s=>sections.indexOf(s)+1,md=d=>(/^\d{4}-(\d{2}-\d{2})$/.exec(d||'')||[])[1]||esc(d||'');
      const chips=sections.map(s=>`<a class="gx-chip" data-line="${esc(s.id)}" href="${esc(s.route)}"><b>${no(s)}</b>${esc(s.name)}<small>${count(s)}</small></a>`).join('');
      const line=s=>{const stops=recent.filter(r=>r.collectionId===s.id).slice(0,5);return `<section class="gx-line" data-line="${esc(s.id)}"><a class="gx-line-name" href="${esc(s.route)}"><b>${no(s)}</b><span><strong>${esc(s.name)}</strong><small>${esc(s.description||'')}</small></span></a><ol class="gx-stops">${stops.map(r=>`<li><a href="${esc(r.route)}"><span>${esc(r.title)}</span><time>${esc(r.publication.date||'')}</time></a></li>`).join('')}</ol><a class="gx-terminal" href="${esc(s.route)}">全部 ${count(s)} 篇 →</a></section>`;};
      const thumb=r=>r.media?.[0]?`<img src="${esc(r.media[0].src)}" alt="" width="160" height="100" loading="lazy" decoding="async">`:'';
      const arrival=r=>{const s=sections.find(x=>x.id===r.collectionId);return `<li data-line="${esc(r.collectionId)}"><time datetime="${esc(r.publication.date||'')}">${md(r.publication.date)}</time><span class="gx-badge">${s?`<b>${no(s)}</b>`:''}${esc(sectionName(r))}</span><a href="${esc(r.route)}"><strong>${esc(r.title)}</strong><small>${esc(blogExcerpt(r))}</small></a>${thumb(r)}</li>`;};
      return `<section class="gx-sign"><p class="gx-kicker">${esc(site.name)} · ENTER</p><h1>要去哪里？</h1><p class="gx-slogan">${esc(site.slogan||site.description||'')}</p><form class="gx-search" action="/archive/" role="search"><label for="resource-query">搜索资源</label><input id="resource-query" name="q" type="search" placeholder="工具、检索入口、论坛或课程"><button type="submit">出发</button></form><nav class="gx-legend" aria-label="内容栏目">${chips}</nav></section><section class="gx-map" aria-labelledby="gx-map-title"><h2 class="gx-label" id="gx-map-title">线路图 <span>LINES</span></h2><div class="gx-lines">${sections.map(line).join('')}</div></section><section class="gx-board" aria-labelledby="gx-board-title"><h2 class="gx-label" id="gx-board-title">最近到站 <span>ARRIVALS</span></h2><ol>${recent.slice(0,8).map(arrival).join('')}</ol><a class="gx-more" href="/archive/">全部文章 →</a></section>${directory}`;
    }
    case 'study':return `<section class="ref-title"><h1>学习资源</h1><p>选择一个方向，从已有课程和资料开始。</p></section><div class="learn-grid">${sections.map((s,i)=>{const items=recordsInCollection({records,collections:sections},s.id),r=items.find(x=>x.media?.length);return `<a class="learn-course course-${i}" href="${esc(s.route)}">${image(r)}<div><h2>${esc(s.name)}</h2><p>${esc(s.description||'')}</p><small>查看 ${items.length} 篇资料 →</small></div></a>`;}).join('')}</div>${heading('最近收录')}<div class="ref-grid">${recent.slice(0,4).map(card).join('')}</div>${directory}`;
    default:return null;
  }
}
