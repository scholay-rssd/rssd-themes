import {sectionRssFeeds} from '../../engine/section-rss.mjs';
import {renderRssFeed} from '../../engine/rss-feed.mjs';
import {pageMetadata,listingDescription,articleBodyHeadings} from '../../engine/page-metadata.mjs';
import {clarityScript,verificationFiles} from '../../engine/site-services.mjs';
import {imageSizeMap,publicationAssetBytes} from '../../engine/publication-assets.mjs';
import {createSeoState,sitemapXml,splitSitemap} from '../../../scripts/seo-state.mjs';
import {showcaseCards} from '../../modules/showcase/index.mjs';
import {standingPages} from '../../engine/standing-pages.mjs';
import {portfolioMedia} from '../../engine/portfolio-media.mjs';
import {renderDisplayModules} from '../../modules/registry.mjs';
import {copyThemeHomepage,byteHash} from '../../engine/theme-homepage.mjs';
import {renderNavigation,feedLabel,githubNavLink} from '../../engine/site-navigation.mjs';
import {familyFooter,familyIconEntries} from '../../engine/site-family.mjs';
import {createFeedIndex,renderFeed,feedRoute,feedPageSize} from '../../engine/content-feed.mjs';
import {siteBranding} from '../../../sites/branding/assets.mjs';
import {blogPreset,blogExcerpt} from './blog-presets.mjs';
import {referenceHome,referencePage,referenceSites} from './reference-layouts.mjs';
import {articleStructures,homeStructures} from '../structures.mjs';
import {recordsInCollection} from '../../engine/site-organization.mjs';
import {mkdir,writeFile,readFile,utimes} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {digest,permalink,sourceKey} from '../../../admin/model.mjs';
import {renderArticleParts,mathStyles} from '../../engine/article-math.mjs';
import {writeMathAssets} from '../../engine/math-assets.mjs';
import {addSocialMetadata} from '../../engine/social-metadata.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export {annualDate} from '../../modules/calendar/model.mjs';
export async function renderJournal({job,target,site,source,previousRoot,now,content,theme,organization}){
  const blog=blogPreset(site);
  // Version the reference stylesheet by its bytes so browsers fetch it again after a design change.
  const referenceCss=referenceSites.has(site.id)?Buffer.concat([await readFile(new URL('./reference/shared.css',import.meta.url)),await readFile(new URL(`./reference/${site.id}.css`,import.meta.url))]):null;
  const referenceVersion=referenceCss?byteHash(referenceCss).slice(0,12):'';
  const brand=siteBranding(site.id),logo=brand?.logo;
  const written=[];
  const write=async(path,text)=>{const file=join(target,path);await mkdir(dirname(file),{recursive:true});if(path.endsWith('index.html')){const route='/'+path.replace(/index\.html$/,'');text=addSocialMetadata(String(text),{site,route,record:content.records.find(r=>r.route===route)});}await writeFile(file,text);written.push(path);};
  const legacyRecords=[...(job.snapshot.news||[]).map(x=>({kind:'news',...x})),...(job.snapshot.data.year||[]).map(x=>({kind:'year',...x})),...(job.snapshot.data.history||[]).map(x=>({kind:'history',...x})),...(job.snapshot.openSource.items||[]).map(x=>({kind:'openSource',...x}))].map(x=>({...x,path:job.snapshot.permalinks?.[sourceKey(x.kind,x)]||permalink(x.kind,x)}));
  const homepage=await copyThemeHomepage({source,target,site,theme});
  if(theme.id==='portfolio'){
    const media=await portfolioMedia(target,homepage);
    if(media.length)content={...content,media};
  }
  const display=await renderDisplayModules({site,content,now});
  const standing=await standingPages({organization,content,target,homepage});
  const records=content.records,primary=content.collections.filter(c=>!c.legacy);
  const discussionRoutes=new Set(['legis','metho','enter','xsiching','study'].includes(site.id)?records.map(r=>r.route):[]);
  const journalLabel=feedLabel(site),feedIndex=createFeedIndex(content);
  const feedSections=[{id:'',route:'/archive/'},...feedIndex.sections];
  const feedRoutes=feedSections.flatMap(c=>Array.from({length:Math.max(1,Math.ceil((c.id?feedIndex.records.filter(r=>c.members.includes(r.section)):records).length/feedPageSize))},(_,i)=>feedRoute(c.route,i+1)));
  const reserved=new Set(['/','/journal/','/calendar/',...feedRoutes,...display.pages.map(p=>p.route),...standing.pages.map(p=>p.route),...standing.hubs.map(h=>h.route)]);
  for(const record of records)if(reserved.has(record.route))throw Error('Organization page collides with article: '+record.route);
  const column=x=>content.collections.find(c=>c.id===x.collectionId)?.name||'';
  const date=x=>x.event?.mode==='historical'?`${x.event.year} · ${x.event.monthDay}`:x.event?.mode==='annual'?'每年 '+x.event.recurrence.monthDay:x.publication.date||x.event?.start||'';
  const cards=items=>site.layout==='showcase'?(showcaseCards(items)||'<p class="empty">这里还没有公开的内容。</p>'):items.length?items.map(x=>`<article class="entry"><div class="entry-meta">${esc(column(x))}<span>${esc(date(x))}</span></div><h3><a href="${esc(x.route)}">${esc(x.title)}</a></h3><p>${esc(blogExcerpt(x))}</p><a class="read" href="${esc(x.route)}">阅读全文 <span aria-hidden="true">↗</span></a></article>`).join(''):'<p class="empty">这里还没有公开的文章。</p>';
  const utilities=[...standing.nav.filter(p=>!primary.some(c=>c.name===p.label)),...display.pages,...(site.services?.guestbook.enabled?[{route:'/guestbook/',label:'留言板'}]:[])];
  const seoHead=(title,path,description,metadata={})=>{
    const url=metadata.canonical||site.origin+path,record=records.find(r=>r.route===path);
    const schema={'@context':'https://schema.org','@graph':[
      {'@type':'WebSite','@id':site.origin+'/#website',url:site.origin+'/',name:site.name,inLanguage:'zh-CN'},
      {'@type':record?'Article':'WebPage','@id':url+(record?'#article':'#webpage'),url,name:title,...(record?{headline:title,mainEntityOfPage:url,...(/^\d{4}-\d{2}-\d{2}$/.test(record.publication?.date||'')?{datePublished:record.publication.date}:{}),...(record.media?.[0]?.src?{image:new URL(record.media[0].src,site.origin).href}:{})}:{}),description,inLanguage:'zh-CN',isPartOf:{'@id':site.origin+'/#website'}},
      ...(path==='/'?[]:[{'@type':'BreadcrumbList',itemListElement:[{name:site.name,url:site.origin+'/'},...(record?[{name:column(record)||journalLabel,url:site.origin+(content.collections.find(c=>c.id===record.collectionId)?.route||'/archive/')}]:[]),{name:title,url}].map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,item:item.url}))}])
    ]};
    const json=JSON.stringify(schema).replace(/</g,'\\u003c');
    return `<meta name="robots" content="${esc(metadata.robots||'index,follow,max-image-preview:large')}"><meta property="og:type" content="${record?'article':'website'}"><meta property="og:site_name" content="${esc(site.name)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${json}</script>${clarityScript(site)}`;
  };
  const shell=(title,path,body,description,styles=[])=>{
    if(path==='/'){title=blog.searchTitle||title;description=description||blog.description;}
    const metadata=pageMetadata({title,route:path,body,description,site});
    description=metadata.description;
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(metadata.title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(metadata.canonical)}">${brand?.links||""}<link rel="stylesheet" href="/site-theme.css">${mathStyles(body)}${(site.layout==='showcase'?['/display/showcase/style.css',...styles]:styles).map(url=>`<link rel="stylesheet" href="${esc(url)}">`).join('')}${organization?'<link rel="stylesheet" href="/organization/style.css">':''}${referencePage(site,path)?`<link rel="stylesheet" href="/reference-layout.css?v=${referenceVersion}">`:''}${seoHead(title,path,description,metadata)}<meta name="color-scheme" content="light dark"><meta name="theme-color" media="(prefers-color-scheme: light)" content="#fcfbf8"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1c1f20"><style>:root{--accent:${blog.color};--blog-accent:${blog.color}}</style></head><body${referencePage(site,path)?' data-design="reference-v1"':''} data-theme="${theme.id}" data-blog="${blog.id}" data-site="${esc(site.id)}"${blog.skin?` data-skin="${blog.skin}"`:''}><a class="skip" href="#main">跳到内容</a><header class="site-header"><a class="brand" href="/">${logo?`<img class="site-logo" src="${logo}" alt="" width="36" height="36">`:`<span class="brand-monogram" aria-hidden="true">${esc(blog.mark)}</span>`}<span>${esc(site.name)}</span></a><nav aria-label="主导航">${renderNavigation(site,path)}${githubNavLink()}</nav></header><main id="main">${body}</main><footer><span>${esc(site.name)} · ${esc(site.slogan||site.description)}</span><span class="footer-links"><a href="/content-feed.xml">RSS</a><a href="${blog.repository}" rel="noreferrer">${esc(blog.name)}</a><a href="/theme-license.txt">MIT</a></span>${familyFooter(site.id)}</footer>${discussionRoutes.has(path)?'<script defer src="/community/discussion-links.v1.js"></script>':''}</body></html>`;
  };
  const intro=`<section class="hero blog-intro"><div><p class="eyebrow">${esc(blog.label)}</p><h1>${esc(site.name)}</h1><p class="blog-slogan">${esc(site.slogan||site.description)}</p><div class="hero-links"><a href="/archive/">${esc(journalLabel)} <span aria-hidden="true">↗</span></a>${[...utilities].map(p=>`<a href="${esc(p.route)}">${esc(p.label)} <span aria-hidden="true">→</span></a>`).join('')}</div></div><div class="blog-emblem" aria-hidden="true">${logo?`<img src="${logo}" width="108" height="108" alt="">`:`<span>${esc(blog.mark)}</span>`}</div></section>`;
  const recent=records.slice().sort((a,b)=>String(b.publication.date||'').localeCompare(String(a.publication.date||''))).slice(0,8);
  const posts=recent.map((x,index)=>`<article class="entry">${x.media?.[0]?`<a href="${esc(x.route)}" tabindex="-1" aria-hidden="true"><img class="entry-cover" src="${esc(x.media[0].src)}" alt="" width="640" height="360" ${index===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"></a>`:''}<div class="entry-meta"><span>${esc(column(x))}</span><span>${esc(date(x))}</span></div><h3><a href="${esc(x.route)}">${esc(x.title)}</a></h3><p>${esc(blogExcerpt(x))}</p><a class="read" href="${esc(x.route)}">继续阅读 <span aria-hidden="true">↗</span></a></article>`).join('');
  const directory=`<aside class="home-directory" aria-label="栏目索引"><h2>按主题阅读</h2><nav>${primary.map(c=>`<a href="${esc(c.route)}"><span>${esc(c.name)}</span><small>${recordsInCollection(content,c.id).length.toString().padStart(2,'0')}</small></a>`).join('')}</nav><p class="directory-note">${esc(blog.description||site.description)}<br><a href="/content-feed.xml">通过 RSS 订阅更新 ↗</a></p></aside>`;
  const overview=intro+`<div class="home-layout"><section class="home-main"><div class="section-heading"><h2>${esc(blog.heading)}</h2><a href="/archive/">全部文章 <span aria-hidden="true">→</span></a></div><div class="entries">${posts||'<p class="empty">新的记录正在准备中。可以先从栏目开始探索。</p>'}</div></section>${directory}</div>${homeStructures({structures:blog.structures,content,sections:primary})}`;
  if(!homepage)await write('index.html',shell(site.name,'/',referenceHome({site,records,sections:primary,directory})??overview));
  const allFeed=renderFeed(feedIndex,{label:journalLabel});
  await write('journal/index.html',shell(journalLabel+' · 阅读目录','/journal/',allFeed.body));
  await write('content-feed.js',await readFile(new URL('../../engine/content-feed-client.js',import.meta.url)));
  await write('content-feed-index.json',JSON.stringify(feedIndex));
  for(const c of [{id:'',route:'/archive/'},...content.collections.filter(c=>c.route!=='/archive/')]){
    const first=renderFeed(feedIndex,{label:journalLabel,section:c.id});
    for(let page=1;page<=first.pages;page++){
      const route=feedRoute(c.route,page),feed=page===1?first:renderFeed(feedIndex,{label:journalLabel,section:c.id,page});
      await write(route.slice(1)+'index.html',shell(feed.title+(c.id?'文章':'')+(page>1?' · 第 '+page+' 页':''),route,feed.body,listingDescription({title:feed.title,description:c.description,page,pages:first.pages,items:(c.id?feedIndex.records.filter(r=>feedIndex.sections.find(s=>s.id===c.id)?.members.includes(r.section)):feedIndex.records).slice((page-1)*feedPageSize,page*feedPageSize)})));
    }
  }
  for(const page of standing.pages)await write(page.route.slice(1)+'index.html',shell(page.title,page.route,page.body));
  for(const [path,bytes]of Object.entries(standing.files))await write(path,bytes);
  for(const page of display.pages){
    await write(page.route.slice(1)+'index.html',shell(page.title,page.route,page.body+page.scripts.map(src=>`<script type="module" src="${src}"></script>`).join(''),site.description,page.styles));
    for(const [path,bytes] of Object.entries(page.files))await write(path,bytes);
  }
  // Old calendar URLs stay useful even when the interactive view is disabled.
  if(!display.config.modules.calendar.enabled)await write('calendar/index.html',shell('日程与历史记录','/calendar/',`<section class="hero compact"><h1>日程与历史记录</h1><p>已收录的日程与历史文章。</p></section><div class="${site.layout==='showcase'?'showcase-grid':'entries'}">${cards(records.filter(x=>x.type==='event'))}</div>`));
  for(const x of records){
    const record=x;
    let markdown=record.bodyMarkdown;
    const recordAssets=legacyRecords.find(raw=>sourceKey(raw.kind,raw)===x.id)?.assets||[];
    const rendered=renderArticleParts(markdown.replace(/^# [^\n]+\n+/,''),{site,imageSizes:await imageSizeMap(recordAssets,previousRoot)});
    const sourceLinks=record.sources;
    const links=sourceLinks.filter(l=>/^https?:\/\//.test(l.url||''));
    const layout=articleStructures({structures:blog.structures,record,records,body:articleBodyHeadings(rendered.body),column:column(x),date:date(x)});
    const article=`<article class="reading${layout.classes.map(c=>' '+c).join('')}"><a class="back" href="/archive/">← 返回${esc(journalLabel)}</a><div class="entry-meta">${esc(column(x))} · ${esc(date(x))}</div><div class="prose"><h1>${esc(x.title)}</h1>${layout.lead}<div class="article-body">${layout.body}</div></div>${record.related?.length?`<aside class="sources"><h2>关联${site.id==='piggytuck'?'作品':'项目'}</h2>${record.related.map(x=>standing.hubs.find(h=>h.id===x.id)).map(h=>`<a href="${esc(h.route)}">${esc(h.name)} ↗</a>`).join('')}</aside>`:''}${record.tags?.length?`<div class="entry-tags">${record.tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}</div>`:''}${layout.sources??(links.length?`<aside class="sources"><h2>来源</h2>${links.map(l=>`<a href="${esc(l.url)}" rel="noreferrer">${esc(l.label||'原始来源')} ↗</a>`).join('')}</aside>`:'')}${rendered.endnotes?`<div class="prose"><div class="article-body article-endnotes">${rendered.endnotes}</div></div>`:''}${layout.after}</article>`;
    await write(x.route.slice(1)+'index.html',shell(x.title,x.route,layout.aside?`<div class="reading-layout">${article}<aside class="reading-aside">${layout.aside}</aside></div>`:article,x.summary||x.factSummary||site.description));
    for(const asset of recordAssets)await write(asset.path.slice(1),await publicationAssetBytes(asset,previousRoot));
  }
  const byId=new Map(records.map(x=>[x.id,x]));
  const publicRecords=legacyRecords.map(({assets,markdown,body,historicalSignificance,value,...x})=>({...x,column:column(byId.get(sourceKey(x.kind,x)))}));
  if(site.layout==='showcase')await write('display/showcase/style.css',await readFile(new URL('../../modules/showcase/style.css',import.meta.url)));
  if(organization)await write('organization/style.css',await readFile(new URL('../standing-pages.css',import.meta.url)));
  await write('published-content.json',JSON.stringify(content));
  if(brand)for(const [path,file] of Object.entries(brand.files))await write(path,await readFile(join(source,'sites/branding',file)));
  for(const icon of familyIconEntries(source))await write('family/'+icon.id+'.png',await readFile(icon.file));
  await write('site-content.json',JSON.stringify({version:1,siteId:site.id,timezone:site.timezone,records:publicRecords}));
  await write('site-theme.css',Buffer.concat([await readFile(join(source,'sites/site-theme.css')),await readFile(join(source,'web/themes/content.css')),await readFile(new URL('./blog.css',import.meta.url)),await readFile(new URL(`./${blog.id}.css`,import.meta.url)),await readFile(new URL('../structures.css',import.meta.url)),await readFile(new URL("./color-mode.css",import.meta.url)),...(blog.skin?[await readFile(new URL(`./skins/${blog.skin}.css`,import.meta.url))]:[])]));
  if(referenceSites.has(site.id)){
    await write('reference-layout.css',referenceCss);
    if(site.id==='xsime')for(const asset of ['xsime-typing.png','xsime-ninekey.png'])await write('design/'+asset,await readFile(new URL('./design/'+asset,import.meta.url)));
  }
  await write('theme-license.txt',await readFile(new URL(`./licenses/${blog.id}.txt`,import.meta.url)));
  for(const [path,text] of Object.entries(verificationFiles))await write(path,text);
  let previous={};
  if(previousRoot)try{previous=JSON.parse(await readFile(join(previousRoot,'seo-manifest.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const seo=createSeoState(previous,now);
  const pages=[...new Set([...Object.keys(homepage?.hashes||{}),...written].filter(p=>p.endsWith('index.html')&&(p!=='index.html'||site.homeMode!=='existing')))];
  const entries=[];
  for(const file of pages){
    const route='/'+file.replace(/index.html$/,''),bytes=await readFile(join(target,file));
    if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(bytes.toString()))continue;
    if(['metho','enter'].includes(site.id)&&!bytes.toString().includes(`<link rel="canonical" href="${esc(site.origin+route)}">`))continue;
    const {lastmod}=seo.page(route,bytes);entries.push({loc:site.origin+route,lastmod});
  }
  const chunks=splitSitemap('content',entries),maps=[];
  for(const chunk of chunks){const xml=sitemapXml(chunk.entries);await write(chunk.name,xml);maps.push({loc:site.origin+'/'+chunk.name,lastmod:seo.file(chunk.name,xml).lastmod});}
  await write('sitemap.xml',sitemapXml(maps,{index:true}));
  await write('robots.txt',`User-agent: *\nAllow: /\nDisallow: /manage/\nDisallow: /admin/\nDisallow: /guestbook/api/\nSitemap: ${site.origin}/sitemap.xml\n`);
  if(['legis','metho','enter','xsiching','study'].includes(site.id)){
    const feedRecords=records.filter(x=>['news','openSource'].includes(x.legacy.kind)).map(x=>({
      ...x,markdown:x.bodyMarkdown+(x.legacy.kind==='news'?'':'\n\n'+x.sources.map(s=>'['+s.label+']('+s.url+')').join('\n\n')),date:x.publication.date,category:column(x)
    }));
    const writeFeed=async(path,xml)=>{await write(path,xml);const {lastmod}=seo.file(path,xml);await utimes(join(target,path),new Date(lastmod),new Date(lastmod));};
    await writeFeed('content-feed.xml',renderRssFeed(site,feedRecords));
    for(const {path,xml} of sectionRssFeeds(site,feedRecords))await writeFeed(path,xml);
  }
  else await write('content-feed.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)}</title><link>${site.origin}</link><description>${esc(site.description)}</description>${records.filter(x=>x.legacy.kind==='news').map(x=>`<item><guid isPermaLink="true">${site.origin+x.route}</guid><title>${esc(x.title)}</title><link>${site.origin+x.route}</link><description>${esc(x.summary)}</description></item>`).join('')}</channel></rss>`);
  await write('seo-manifest.json',JSON.stringify({version:2,siteId:site.id,pages:seo.pages,files:seo.files}));
  if(homepage){delete homepage.hashes['sitemap.xml'];delete homepage.hashes['robots.txt'];}
  const mathFiles=await writeMathAssets(target);written.push(...mathFiles);
  const byteHashes={...homepage?.hashes};for(const file of mathFiles)byteHashes[file]=byteHash(await readFile(join(target,file)));
  const hashes={};for(const file of new Set(written)){if(site.homeMode==='existing'&&file==='index.html')continue;hashes[file]=digest(await readFile(join(target,file)));}
  const manifest={release:'admin-'+job.id,jobId:job.id,siteId:site.id,snapshotHash:job.snapshot_hash,created:now.toISOString(),theme:{id:theme.id,interfaceVersion:theme.interfaceVersion},contentVersion:content.version,display:{version:1,modules:display.config.modules},...(homepage?{homepage:{...homepage,hashes:undefined},}:{}),byteHashes,counts:{records:records.length},hashes};
  await writeFile(join(target,'release.json'),JSON.stringify(manifest));return manifest;
}
