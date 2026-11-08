#!/usr/bin/env node
import {renderRssFeed} from '../../engine/rss-feed.mjs';
import {rssEntryTimes} from '../../engine/rss-entry-times.mjs';
import {sectionRssFeeds} from '../../engine/section-rss.mjs';
import {descriptionText,articleBodyHeadings,datedRecordTitle} from '../../engine/page-metadata.mjs';
import {clarityScript} from '../../engine/site-services.mjs';
import {DEFAULT_SITE} from '../../../scripts/site-config.mjs';
import {fillNavigationSlot} from '../../engine/site-navigation.mjs';
import {addSocialMetadata} from '../../engine/social-metadata.mjs';

import {archiveSection,archiveSections,isVerified} from '../../../scripts/archive-model.mjs';
import {buildArchive,courseLabels} from './archive-pages.mjs';
import {validateNews} from '../../../admin/news.mjs';
import {renderArticle,renderMathText,mathStyles} from '../../engine/article-math.mjs';
import {imageSizeMap} from '../../engine/publication-assets.mjs';
import {articleStructures} from '../structures.mjs';
import {renderFrontPage,frontPageGuard} from './front-page.mjs';
import {writeMathAssets,mathStyleLoader} from '../../engine/math-assets.mjs';
import {createHash} from 'node:crypto';
import {mkdir, readFile, rm, writeFile, utimes} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSeoState,stableJson,sitemapXml,splitSitemap} from '../../../scripts/seo-state.mjs';

export const siteOrigin = 'https://today.scholay.com';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const defaultOutput = join(projectRoot, '.seo-output');

const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const json = value => JSON.stringify(value).replace(/[<>&]/g, char => ({'<':'\\u003c','>':'\\u003e','&':'\\u0026'}[char]));
const text = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const excerpt = (value, length=155) => {
  const source=text(value);
  return source.length<=length ? source : source.slice(0,length-1).trimEnd()+'…';
};
const safeUrl = value => {
  try {
    const url=new URL(value);
    return /^https?:$/.test(url.protocol) ? url.href : '';
  } catch { return ''; }
};
const absolute = route => siteOrigin+route;
// al-folio-inspired article structures; see docs/theme-structures.md.
export const ACADEMIC_STRUCTURES=Object.freeze(['contents','tables','image-rows']);
const newsBody=(item,imageSizes)=>articleStructures({structures:ACADEMIC_STRUCTURES,record:item,records:[],body:articleBodyHeadings(renderArticle(item.markdown.replace(/^# [^\n]+\n+/,''),{imageSizes}))});
const sizedArticle=async (markdown,item,root)=>renderArticle(markdown,{imageSizes:await imageSizeMap(item.assets,root)});
const stamp = value => String(value || '').replaceAll('-', ' 年 ').replace(/ 年 (\d{2})$/, ' 月 $1 日');
const monthDay = value => {
  const [month,day]=String(value || '').split('-').map(Number);
  return month&&day ? month+' 月 '+day+' 日' : '日期未标注';
};
const stableSlug = value => {
  const readable=String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,68)||'record';
  const suffix=createHash('sha256').update(String(value ?? '')).digest('hex').slice(0,10);
  return readable+'-'+suffix;
};
const calendarRoute = item => '/calendar/'+item.start+'-'+stableSlug(item.id)+'/';
const historyRoute = item => '/history/'+item.dateKey.replace('-', '')+'-'+item.year+'-'+stableSlug(item.id)+'/';
const sourceRoute = item => '/open-source/'+item.date+'-'+stableSlug(item.title)+'/';

function breadcrumb(items) {
  return {
    '@type':'BreadcrumbList',
    itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:absolute(item.route)}))
  };
}

function pageShell({title,description,route,body,schema,kind='website',lastmod,header}) {
  if(typeof header==='function')header=header(route);
  const canonical=absolute(route);
  const graph=[
    {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description,inLanguage:'zh-CN',isPartOf:{'@id':siteOrigin+'/#website'},...(lastmod?{dateModified:lastmod}:{})},
    {'@type':'WebSite','@id':siteOrigin+'/#website',url:siteOrigin+'/',name:'今日学术',alternateName:'今日学术 学术日历',inLanguage:'zh-CN'},
    {'@type':'Organization','@id':siteOrigin+'/#organization',name:'Scholay',url:'https://www.scholay.com/',logo:siteOrigin+'/scholay-logo.png',sameAs:['https://github.com/scholay']},
    ...schema.map(item=>lastmod&&['Article','CollectionPage'].includes(item['@type'])?{...item,dateModified:lastmod}:item)
  ];
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#f7f5ef"><meta name="color-scheme" content="light dark">'+
    '<title>'+html(title)+'</title><meta name="description" content="'+html(description)+'"><link rel="canonical" href="'+html(canonical)+'">'+
    '<link rel="alternate" type="application/rss+xml" title="今日学术 RSS" href="/content-feed.xml"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/calendar-workspace.css"><link rel="stylesheet" href="/theme.css"><link rel="stylesheet" href="/seo.css?v=academic-news-20261018"><link rel="stylesheet" href="/reference.css?v=20261028"><script src="/seo-theme.js"></script>'+
    mathStyles(body)+'<meta property="og:type" content="'+kind+'"><meta property="og:locale" content="zh_CN"><meta property="og:site_name" content="今日学术">'+
    '<meta property="og:title" content="'+html(title)+'"><meta property="og:description" content="'+html(description)+'"><meta property="og:url" content="'+html(canonical)+'"><meta property="og:image" content="'+siteOrigin+'/social-preview.png"><meta property="og:image:alt" content="今日学术：学术日历、学术史与学术开源">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+html(title)+'"><meta name="twitter:description" content="'+html(description)+'"><meta name="twitter:image" content="'+siteOrigin+'/social-preview.png">'+
    (lastmod&&kind==='article'?'<meta property="article:modified_time" content="'+html(lastmod)+'">':'')+
    clarityScript({id:'scholay-today',origin:siteOrigin})+'<script type="application/ld+json">'+json({'@context':'https://schema.org','@graph':graph})+'</script></head><body>'+header+body+'<footer class="seo-footer">'+
    (lastmod?'<p>本页内容更新：<time datetime="'+html(lastmod)+'">'+html(new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'short',hourCycle:'h23'}).format(new Date(lastmod)))+'（北京时间）</time></p>':'')+
    '<p>今日学术 以人工维护的固定快照呈现科研日程、学术史与开源研究项目；具体要求请以来源原文为准。</p><a href="/">返回首页</a> · <a href="/content-feed.xml">RSS 订阅</a></footer></body></html>';
}

function sourceLinks(links) {
  const items=links.map(link=>({label:text(link.label)||'原始来源',url:safeUrl(link.url)})).filter(link=>link.url);
  return items.length ? '<ul class="source-list">'+items.map(link=>'<li><a href="'+html(link.url)+'" target="_blank" rel="noopener noreferrer">'+html(link.label)+' ↗</a></li>').join('')+'</ul>' : '<p class="muted">暂未公开来源链接。</p>';
}

function recordPage({route,title,seoTitle=title,description,section,sectionRoute,details,summary,body,links,appRoute,lastmod,header}) {
  description=descriptionText(seoTitle,description);
  body=articleBodyHeadings(body);
  const crumbs=[{name:'今日学术',route:'/'},{name:'学术新闻',route:'/archive/'},{name:section,route:sectionRoute},{name:title,route}];
  const schema=[breadcrumb(crumbs),{'@type':'Article','@id':absolute(route)+'#article',headline:title,description,mainEntityOfPage:{'@id':absolute(route)+'#webpage'},inLanguage:'zh-CN',publisher:{'@id':siteOrigin+'/#organization'}}];
  const content='<main class="seo-main"><nav class="breadcrumbs" aria-label="面包屑"><a href="/archive/">学术新闻</a><span>／</span><a href="'+sectionRoute+'">'+html(section)+'</a></nav><article class="record-page"><p class="eyebrow">'+html(section.toUpperCase())+' / 固定快照</p><h1>'+html(title)+'</h1><p class="lead">'+renderMathText(summary)+'</p><dl class="record-facts">'+details.map(row=>'<div><dt>'+html(row[0])+'</dt><dd>'+html(row[1])+'</dd></div>').join('')+'</dl>'+body+'<section><h2>来源与延伸阅读</h2>'+sourceLinks(links)+'</section><p class="interaction-link"><a href="'+html(appRoute)+'">在交互式日历中查看这条记录 ↗</a></p></article></main>';
  return pageShell({title:seoTitle+'｜今日学术',description,route,body:content,schema,kind:'article',lastmod,header});
}

const pageSize=120;
const collectionRoute=(route,page)=>page===1?route:route+'page/'+page+'/';
function overviewPage({route:baseRoute,title,description,eyebrow,intro,records,recordRoute,recordSummary,section,page=1,lastmod,header}) {
  const pages=Math.max(1,Math.ceil(records.length/pageSize)),route=collectionRoute(baseRoute,page);
  const list=records.slice((page-1)*pageSize,page*pageSize);
  if(page>1){title=section+' · 第 '+page+' 页｜今日学术';description+=' 第 '+page+' 页，共 '+pages+' 页。';}
  const schema=[breadcrumb([{name:'今日学术',route:'/'},{name:section,route}]),{
    '@type':'CollectionPage','@id':absolute(route)+'#collection',name:title,description,inLanguage:'zh-CN',
    mainEntity:{'@type':'ItemList',numberOfItems:records.length,itemListElement:list.map((item,index)=>({'@type':'ListItem',position:(page-1)*pageSize+index+1,name:item.title,url:absolute(recordRoute(item))}))}
  }];
  const cards=list.map(item=>'<article class="record-card"><p>'+html(recordSummary.meta(item))+'</p><h2><a href="'+recordRoute(item)+'">'+html(item.title)+'</a></h2><p>'+html(excerpt(recordSummary.text(item),175))+'</p><a class="read-more" href="'+recordRoute(item)+'">查看记录 →</a></article>').join('');
  const pagination=pages>1?'<nav class="pagination" aria-label="'+html(section)+'分页">'+(page>1?'<a rel="prev" href="'+collectionRoute(baseRoute,page-1)+'">上一页</a>':'')+Array.from({length:pages},(_,i)=>'<a href="'+collectionRoute(baseRoute,i+1)+'"'+(i+1===page?' aria-current="page"':'')+' aria-label="第 '+(i+1)+' 页">'+(i+1)+'</a>').join('')+(page<pages?'<a rel="next" href="'+collectionRoute(baseRoute,page+1)+'">下一页</a>':'')+'</nav>':'';
  const interactive=baseRoute==='/history/'?['/#/history','打开昔日学术日历']:baseRoute==='/open-source/'?['/#/open-source','打开开源目录']:['/#/year','打开今日学术日历'];
  const content='<main class="seo-main"><section class="collection-hero"><p class="eyebrow">'+html(eyebrow)+'</p><h1>'+html(section)+(page>1?' · 第 '+page+' 页':'')+'</h1><p>'+html(intro)+'</p><p class="collection-count">当前收录 '+records.length+' 条可检索记录'+(pages>1?' · 第 '+page+' / '+pages+' 页':'')+'</p><a class="interaction-link" href="'+interactive[0]+'">'+interactive[1]+' ↗</a></section>'+pagination+'<section class="record-grid" aria-label="'+html(section)+'记录">'+cards+'</section>'+pagination+'</main>';
  return pageShell({title,description,route,body:content,schema,lastmod,header});
}

function rootRobots() {
  return 'User-agent: *\nAllow: /\nDisallow: /manage/\nSitemap: '+siteOrigin+'/sitemap.xml\n';
}

export async function buildSeoSite({root=projectRoot,homepageRoot=root===projectRoot?join(projectRoot,'web/themes/academic/public'):root,output=defaultOutput,previousRoot=output,now=new Date(),publicContent,site=DEFAULT_SITE}={}) {
  const publicRecords=new Map((publicContent?.records||[]).map(record=>[record.id,record]));
  const publicRecord=(kind,item)=>publicRecords.get(kind+':'+(kind==='openSource'?item.url:item.id));
  const publicSections=publicContent?publicContent.collections.filter(c=>c.route!=='/archive/').map(c=>({...c,slug:c.id})):[...archiveSections,{slug:'intelligence',name:'学术情报',description:'科研日程与通知已归入今日学术。',legacy:true,includes:['calendar']}];
  const sectionFor=(kind,item)=>publicSections.find(section=>section.slug===publicRecord(kind,item)?.collectionId)||archiveSection(kind,item);
  const [calendarData,openSourceData]=await Promise.all([
    readFile(join(root,'data.json'),'utf8').then(JSON.parse),
    readFile(join(root,'open-source.json'),'utf8').then(JSON.parse)
  ]);
  if(!Array.isArray(calendarData.year)||!Array.isArray(calendarData.history)||!Array.isArray(openSourceData.items)) throw new Error('SEO generation requires calendar and open-source snapshots.');
  const homeHtml=await readFile(join(homepageRoot,'index.html'),'utf8');
  const originalHeader=homeHtml.match(/<header class="site-header app-bar">[\s\S]*?<\/header>/)?.[0];
  if(!originalHeader)throw Error('Home navigation is missing');
  const header=route=>fillNavigationSlot(originalHeader.replace(/href="#([^"]*)"/g,'href="/#$1"'),site,route);
  let news=[];
  try {news=JSON.parse(await readFile(join(root,'news.json'),'utf8')).items.map(item=>validateNews(item)).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));} catch(error){if(error.code!=='ENOENT')throw error;}
  let savedRoutes={};
  try {savedRoutes=JSON.parse(await readFile(join(root,'permalinks.json'),'utf8'));} catch(error){if(error.code!=='ENOENT')throw error;}
  for(const [key,route] of Object.entries(savedRoutes)) {
    if(!/^\/(calendar|history|open-source|news)\/[a-zA-Z0-9-]+\/$/.test(route))throw new Error('Invalid saved permalink: '+key);
  }
  const calendarRoute=item=>savedRoutes['year:'+item.id]||('/calendar/'+item.start+'-'+stableSlug(item.id)+'/');
  const historyRoute=item=>savedRoutes['history:'+item.id]||('/history/'+item.dateKey.replace('-','')+'-'+item.year+'-'+stableSlug(item.id)+'/');
  const sourceRoute=item=>savedRoutes['openSource:'+item.url]||('/open-source/'+item.date+'-'+stableSlug(item.title)+'/');
  const newsRoute=item=>savedRoutes['news:'+item.id]||'/news/'+item.id+'/';
  const calendar=calendarData.year.filter(item=>item.sectionId||isVerified(item)).sort((a,b)=>b.start.localeCompare(a.start)||a.title.localeCompare(b.title,'zh'));
  const history=calendarData.history.filter(item=>Array.isArray(item.sources)&&item.sources.some(source=>safeUrl(source.url))).sort((a,b)=>a.dateKey.localeCompare(b.dateKey)||a.year-b.year||a.title.localeCompare(b.title,'zh'));
  const openSource=openSourceData.items.filter(item=>safeUrl(item.url)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.title.localeCompare(b.title,'zh'));
  if(!calendar.length||!history.length||!openSource.length) throw new Error('SEO output requires verified calendar, history, and open-source records.');

  let previous={};
  if(previousRoot)try {previous=JSON.parse(await readFile(join(previousRoot,'seo-manifest.json'),'utf8'));} catch(error){if(error.code!=='ENOENT')throw error;}
  let previousRss={};
  if(previousRoot)try{const saved=JSON.parse(await readFile(join(previousRoot,'rss-entry-state.json'),'utf8'));if(saved.version!==1||!saved.entries)throw Error('Invalid RSS entry state');previousRss=saved.entries;}catch(error){if(error.code!=='ENOENT')throw error;}
  const state=createSeoState(previous,now);
  await rm(output,{recursive:true,force:true});
  await mkdir(output,{recursive:true});
  const routes=[];
  const writeDated=async(target,content,lastmod)=>{
    await mkdir(dirname(target),{recursive:true});await writeFile(target,content);
    await utimes(target,new Date(lastmod),new Date(lastmod));
  };
  const writeRoute=async(route,render,extra='')=>{
    if(!route.startsWith('/')||!route.endsWith('/')) throw new Error('SEO route must be an absolute directory route: '+route);
    if(routes.includes(route))throw new Error('Duplicate SEO route: '+route);
    const share=html=>addSocialMetadata(html,{site,route,record:publicContent?.records.find(r=>r.route===route)});
    const {lastmod}=state.page(route,share(render())+extra);
    const target=join(output,route,'index.html');
    await writeDated(target,share(render(lastmod)),lastmod);
    routes.push(route);
  };
  const writeCollection=async(options)=>{
    for(let page=1;page<=Math.max(1,Math.ceil(options.records.length/pageSize));page++)await writeRoute(collectionRoute(options.route,page),lastmod=>overviewPage({...options,page,lastmod,header}));
  };

  // This is the public reader's content, not the snapshot export clock or event date.
  const frontSections=(publicContent?publicContent.collections.filter(c=>!c.legacy&&c.route!=='/archive/'):publicSections.filter(c=>!c.legacy).map(c=>({...c,route:'/archive/'+c.slug+'/'}))).map(c=>({name:c.name,route:c.route}));
  const front=renderFrontPage({news,openSource,sections:frontSections,
    route:{news:newsRoute,openSource:sourceRoute},cover:item=>publicRecord('news',item)?.media?.[0],sectionName:item=>sectionFor('news',item).name});
  const rootSource=fillNavigationSlot(await readFile(join(homepageRoot,'index.html'),'utf8'),site).replace(/<script type="application\/ld\+json" data-seo-home>[\s\S]*?<\/script>\n?/g,'')
    .replace('</head>','<link rel="stylesheet" href="/reference.css?v=20261028"></head>')
    .replace(/(<main id="main"[^>]*>)([\s\S]*?)(<div class="loading">[^<]*<\/div><\/main>)/,(_,open,noscript,loading)=>open+frontPageGuard+front+noscript+loading.replace(/<div class="loading">[^<]*<\/div>/,''));
  const rootData=[calendarData.year,calendarData.history,openSourceData.items].map(items=>items.map(stableJson).sort());
  await writeRoute('/',lastmod=>lastmod?rootSource.replace('</head>','<script type="application/ld+json" data-seo-home>'+json({'@context':'https://schema.org','@type':'WebPage','@id':siteOrigin+'/#webpage',url:siteOrigin+'/',name:'今日学术 · 科研日历',dateModified:lastmod,isPartOf:{'@id':siteOrigin+'/#website'}})+'</script>\n</head>'):rootSource,stableJson(rootData));

  await writeCollection({
    route:'/calendar/',section:'今日学术',title:'今日学术｜科研日程、申报机会与学术通知｜今日学术',
    description:'浏览人工核验的科研日程、项目申报、学术会议、培养节点与研究通知。',eyebrow:'ACADEMIC CALENDAR',
    intro:'这里收录已由维护者核验的科研日程、项目申报、学术会议与培养节点。日期和资格条件以来源机构的原始通知为准。',records:calendar,recordRoute:calendarRoute,
    recordSummary:{meta:item=>item.start+' · '+item.category+' · '+item.sourceName,text:item=>item.summary}
  });
  await writeCollection({
    route:'/history/',section:'昔日学术',title:'昔日学术｜历史上的科研事件｜今日学术',
    description:'按同月同日回望科学论文、研究机构、方法与学术制度的历史事件。',eyebrow:'ON THIS DAY',
    intro:'按同月同日整理学术史事件，呈现论文发表、研究制度、科学发现与学科演进如何走到今天。',records:history,recordRoute:historyRoute,
    recordSummary:{meta:item=>item.year+' 年 · '+item.domain+' · '+item.eventType,text:item=>item.factSummary}
  });
  await writeCollection({
    route:'/open-source/',section:'学术开源',title:'学术开源｜值得关注的研究工具与开放项目｜今日学术',
    description:'人工整理可公开访问的文献、科研 Agent、数据评测、实验与基础设施项目。',eyebrow:'OPEN RESEARCH',
    intro:'收录值得研究与试用的开源项目，包含文献与写作、科研 Agent、数据评测、实验仪器、生命医学与基础设施。',records:openSource,recordRoute:sourceRoute,
    recordSummary:{meta:item=>item.date+' · '+item.category+' · '+item.status,text:item=>item.summary}
  });


  for(const item of [...news,...calendar,...history,...openSource]){
    for(const asset of item.assets||[]){const target=join(output,asset.path);await mkdir(dirname(target),{recursive:true});await writeFile(target,Buffer.from(asset.data,'base64'));}
  }
  for(const item of news){
    const route=newsRoute(item),article=newsBody(item,await imageSizeMap(item.assets,previousRoot));
    await writeRoute(route,lastmod=>pageShell({header,title:item.title+'｜今日学术',description:excerpt(item.summary),route,lastmod,kind:'article',schema:[breadcrumb([{name:'今日学术',route:'/'},{name:'学术新闻',route:'/archive/'},{name:sectionFor('news',item).name,route:'/archive/'+sectionFor('news',item).slug+'/'},{name:item.title,route}]),{'@type':'Article',headline:item.title,datePublished:item.date+'T00:00:00+08:00',author:{'@type':'Organization',name:item.author},publisher:{'@id':siteOrigin+'/#organization'},mainEntityOfPage:absolute(route)}],body:'<main class="seo-main"><nav class="breadcrumbs"><a href="/">首页</a><span>／</span><a href="/archive/">学术新闻</a></nav><article class="record-page news-article"><p class="eyebrow">'+html(sectionFor('news',item).name)+' · '+html(item.date)+'</p><h1>'+html(item.title)+'</h1><p class="muted">'+html(item.author)+'</p>'+(publicRecord('news',item)?.course?'<p class="muted">'+courseLabels(publicRecord('news',item).course)+'</p>':'')+'<p class="lead">'+renderMathText(item.summary)+'</p>'+article.lead+'<div class="article-body">'+article.body+'</div></article></main>'}));
  }

  for(const item of calendar) {
    const route=calendarRoute(item);
    const date=item.end&&item.end!==item.start ? stamp(item.start)+' — '+stamp(item.end) : stamp(item.start);
    const summary=text(item.summary)||'已核验官网来源的科研日程记录。';
    const notice=item.body?(item.assets?.length||item.sectionId?'<section class="article-body"><h2>通知摘要</h2>'+await sizedArticle(item.body,item,previousRoot)+'</section>':'<section><h2>通知摘要</h2><p>'+renderMathText(item.body)+'</p></section>'):'';
    await writeRoute(route,lastmod=>recordPage({header,route,lastmod,title:/^\(?untitled\)?$/i.test(item.title)?datedRecordTitle(item,''):item.title,seoTitle:datedRecordTitle(item,date),description:excerpt(summary),section:sectionFor('year',item).name,sectionRoute:'/archive/'+sectionFor('year',item).slug+'/',summary,
      details:[[(item.dateBasis||'').includes('发布日期')?'通知发布日期':'日程日期',date],['类别',item.category],['日期依据',item.dateBasis||'以来源原文为准'],['来源机构',item.sourceName||'未标明'],[item.sectionId?'来源记录':'核验状态',item.provenance]],
      body:notice,links:[{label:item.sourceName||'原始来源',url:item.sourceUrl}],appRoute:'/#/year?date='+item.start}));
  }
  for(const item of history) {
    const route=historyRoute(item);
    const summary=text(item.factSummary)||'历史学术事件记录。';
    const significance=item.historicalSignificance?(item.assets?.length||item.sectionId?'<section class="article-body"><h2>学术意义</h2>'+await sizedArticle(item.historicalSignificance,item,previousRoot)+'</section>':'<section><h2>学术意义</h2><p>'+renderMathText(item.historicalSignificance)+'</p></section>'):'';
    await writeRoute(route,lastmod=>recordPage({header,route,lastmod,title:item.title,seoTitle:datedRecordTitle(item,item.year+' 年 '+monthDay(item.dateKey)),description:excerpt(summary),section:sectionFor('history',item).name,sectionRoute:'/archive/'+sectionFor('history',item).slug+'/',summary,
      details:[['发生时间',item.year+' 年 '+monthDay(item.dateKey)],['领域',item.domain],['事件类型',item.eventType||'学术事件'],['重要性',item.importance||'未标注']],
      body:significance,links:item.sources,appRoute:'/#/history?date='+item.dateKey}));
  }
  for(const item of openSource) {
    const route=sourceRoute(item);
    const summary=text(item.summary)||'公开研究项目。';
    const links=[{label:'项目原页',url:item.url},...(item.relatedUrl?[{label:'相关资料',url:item.relatedUrl}]:[])];
    const related=news.filter(x=>sectionFor('news',x).slug==='open-source'&&x.markdown.toLowerCase().includes(item.url.toLowerCase().replace(/\/$/,'')));
    const relatedBody=related.length?'<section><h2>项目解读</h2><ul class="source-list">'+related.map(x=>'<li><a href="'+newsRoute(x)+'">'+html(x.title)+'</a></li>').join('')+'</ul></section>':'';
    const valueBody=item.value?(item.assets?.length||item.sectionId?'<section class="article-body"><h2>为何收录</h2>'+await sizedArticle(item.value,item,previousRoot)+'</section>':'<section><h2>为何收录</h2><p>'+renderMathText(item.value)+'</p></section>')+relatedBody:relatedBody;
    await writeRoute(route,lastmod=>recordPage({header,route,lastmod,title:item.title,description:excerpt(summary),section:sectionFor('openSource',item).name,sectionRoute:'/archive/'+sectionFor('openSource',item).slug+'/',summary,
      details:[['收录日期',item.date],['类别',item.category],['状态',item.status||'公开收录']],
      body:valueBody,links,appRoute:'/#/open-source'}));
  }

  // Use eligible public records and the same frozen permalinks as article pages.
  const rssTimes=rssEntryTimes(previousRss,previous.pages,now);
  for(const [items,route] of [[news,newsRoute],[openSource,sourceRoute],[calendar,calendarRoute],[history,historyRoute]])for(const item of items)rssTimes.updated(route(item),item);
  const recentRecords=(items,route)=>[...items].sort((a,b)=>rssTimes.entries[route(b)].updated.localeCompare(rssTimes.entries[route(a)].updated)||route(b).localeCompare(route(a))).slice(0,20);
  const feedRecord=(kind,item,route,markdown)=>({title:item.title,summary:item.summary||item.factSummary||'',route,category:sectionFor(kind,item).name,date:kind==='news'?item.date:rssTimes.entries[route].updated.slice(0,10),markdown});
  const details=(item,body)=>body+'\n\n'+[item.start?'日程：'+item.start+(item.end?' 至 '+item.end:''):'',item.year?'历史日期：'+item.year+'-'+item.dateKey:'',...(item.sources||[{label:item.sourceName||'原始来源',url:item.sourceUrl||item.url}]).filter(x=>safeUrl(x.url)).map(x=>'['+(x.label||'原始来源')+']('+x.url+')')].filter(Boolean).join('\n\n');
  const feedRecords=[
    ...news.map(item=>feedRecord('news',item,newsRoute(item),item.markdown)),
    ...openSource.map(item=>feedRecord('openSource',item,sourceRoute(item),details(item,publicRecord('openSource',item)?.bodyMarkdown||[item.summary,item.value].filter(Boolean).join('\n\n')))),
    ...recentRecords(calendar,calendarRoute).map(item=>feedRecord('year',item,calendarRoute(item),details(item,publicRecord('year',item)?.bodyMarkdown||[item.summary,item.body].filter(Boolean).join('\n\n')))),
    ...recentRecords(history,historyRoute).map(item=>feedRecord('history',item,historyRoute(item),details(item,publicRecord('history',item)?.bodyMarkdown||[item.factSummary,item.historicalSignificance].filter(Boolean).join('\n\n')))),
  ];
  const feed=renderRssFeed(site,feedRecords),rssFiles=[];
  await writeDated(join(output,'content-feed.xml'),feed,state.file('content-feed.xml',feed).lastmod);
  for(const {path,xml} of sectionRssFeeds(site,feedRecords)){
    await writeDated(join(output,path),xml,state.file(path,xml).lastmod);rssFiles.push(path);
  }
  const rssState=JSON.stringify({version:1,entries:rssTimes.entries});
  await writeDated(join(output,'rss-entry-state.json'),rssState,state.file('rss-entry-state.json',rssState).lastmod);

  const archiveRecords=[
    ...news.map(x=>({section:sectionFor('news',x).slug,title:x.title,summary:x.summary,dateLabel:x.date,...(publicRecord('news',x)?.course?{course:publicRecord('news',x).course}:{}),category:sectionFor('news',x).slug==='open-source'?'项目解读':sectionFor('news',x).name,route:newsRoute(x)})),
    ...calendar.map(x=>({section:sectionFor('year',x).slug,title:x.title,summary:x.summary,dateLabel:x.start+(x.end&&x.end!==x.start?' — '+x.end:''),category:x.category+((x.dateBasis||'').includes('发布日期')?' · 通知发布':''),route:calendarRoute(x)})),
    ...[...history].sort((a,b)=>b.year-a.year||b.dateKey.localeCompare(a.dateKey)).map(x=>({section:sectionFor('history',x).slug,title:x.title,summary:x.factSummary,dateLabel:x.year+' 年 '+monthDay(x.dateKey),category:x.domain,route:historyRoute(x)})),
    ...openSource.map(x=>({section:sectionFor('openSource',x).slug,title:x.title,summary:x.summary,dateLabel:x.date,category:x.category,route:sourceRoute(x)}))
  ];
  const archiveIndex=await buildArchive({sections:publicSections,records:archiveRecords,writeRoute,pageShell:options=>pageShell({...options,header})});
  await writeDated(join(output,'news/index.html'),'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>学术新闻｜今日学术</title><link rel="canonical" href="'+siteOrigin+'/archive/"><meta http-equiv="refresh" content="0;url=/archive/"></head><body><a href="/archive/">打开学术新闻</a></body></html>',state.pages['/archive/'].lastmod);
  const archiveJson=stableJson(archiveIndex);
  await writeDated(join(output,'archive-index.json'),archiveJson,state.file('archive-index.json',archiveJson).lastmod);

  const entries=routes.map(route=>({loc:absolute(route),lastmod:state.pages[route].lastmod})).sort((a,b)=>a.loc.localeCompare(b.loc));
  const collections=new Set(routes.filter(route=>route==='/'||route.startsWith('/archive/')||/^\/(calendar|history|open-source|news)\/(?:page\/\d+\/)?$/.test(route)).map(absolute));
  const groups=[{name:'pages',entries:entries.filter(item=>collections.has(item.loc))},...['calendar','history','open-source','news'].map(name=>({name,entries:entries.filter(item=>!collections.has(item.loc)&&item.loc.startsWith(absolute('/'+name+'/')))}))];
  const recent=entries.filter(item=>!collections.has(item.loc)).sort((a,b)=>b.lastmod.localeCompare(a.lastmod)||a.loc.localeCompare(b.loc)).slice(0,100);
  groups.unshift({name:'recent',entries:recent});
  const sitemapFiles=[],index=[];
  for(const group of groups)for(const part of splitSitemap(group.name,group.entries)){
    const content=sitemapXml(part.entries),{lastmod}=state.file(part.name,content);
    await writeDated(join(output,part.name),content,lastmod);
    sitemapFiles.push(part.name);index.push({loc:absolute('/'+part.name),lastmod});
  }
  const sitemap=sitemapXml(index,{index:true});
  await writeDated(join(output,'sitemap.xml'),sitemap,state.file('sitemap.xml',sitemap).lastmod);
  const robots=rootRobots();
  await writeDated(join(output,'robots.txt'),robots,state.file('robots.txt',robots).lastmod);
  // Public, read-only directory for the desktop publication center. Explicit
  // fields only: the production worker supplies published snapshots, never
  // drafts, publication credentials or the private editorial workspace.
  const catalogItem=(kind,item,route,fallback,summary,dateLabel,category,links,articleId)=>({
    key:kind+':'+(kind==='openSource'?item.url:item.id),kind,archiveSection:sectionFor(kind,item).name,archiveSectionSlug:sectionFor(kind,item).slug,title:text(item.title),
    summary:excerpt(summary,800),dateLabel,category:text(category),
    url:absolute(state.pages[route]?route:fallback),detailPage:Boolean(state.pages[route]),
    lastmod:state.pages[route]?.lastmod||null,
    sourceUrls:links.map(x=>({label:text(x.label)||'原始来源',url:safeUrl(x.url)})).filter(x=>x.url),
    ...(articleId?{articleId}:{})
  });
  const catalogItems=[
    ...calendarData.year.map(x=>catalogItem('year',x,calendarRoute(x),'/#/year/'+encodeURIComponent(x.id),x.summary,x.start+(x.end&&x.end!==x.start?' — '+x.end:''),x.category,[{label:x.sourceName,url:x.sourceUrl}])),
    ...calendarData.history.map(x=>catalogItem('history',x,historyRoute(x),'/#/history/'+encodeURIComponent(x.id),x.factSummary,x.year+' 年 '+monthDay(x.dateKey),x.domain,x.sources||[])),
    ...openSourceData.items.map(x=>catalogItem('openSource',x,sourceRoute(x),'/#/open-source',x.summary,x.date||'',x.category,[{label:'项目原页',url:x.url}])),
    ...news.map(x=>catalogItem('news',x,newsRoute(x),'/news/',x.summary,x.date,x.category,[],x.id))
  ].sort((a,b)=>a.key.localeCompare(b.key));
  if(new Set(catalogItems.map(x=>x.key)).size!==catalogItems.length)throw new Error('Duplicate public catalog identity');
  const catalogContent=stableJson(catalogItems);
  const catalogDate=state.file('content-catalog.json',catalogContent).lastmod;
  await writeDated(join(output,'content-catalog.json'),JSON.stringify({version:1,contentUpdatedAt:catalogDate,items:catalogItems})+'\n',catalogDate);
  const counts={calendar:calendar.length,history:history.length,openSource:openSource.length,...(news.length?{news:news.length}:{})};
  await writeFile(join(output,'seo-manifest.json'),JSON.stringify({version:2,routes,counts,pages:state.pages,files:state.files,sitemapFiles},null,2)+'\n');
  const mathFiles=await writeMathAssets(output);
  await writeFile(join(output,'math-style.js'),mathStyleLoader);mathFiles.push('math-style.js');
  return {output,routes,counts,sitemapFiles,mathFiles,rssFiles};
}

const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain) {
  const result=await buildSeoSite();
  console.log('Generated SEO output: '+(result.counts.calendar+result.counts.history+result.counts.openSource)+' detail pages, '+result.routes.length+' canonical routes.');
}
