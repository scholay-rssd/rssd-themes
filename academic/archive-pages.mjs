import {listingDescription} from '../../engine/page-metadata.mjs';
import {collectionIds} from '../../engine/site-organization.mjs';
import {archiveSections} from '../../../scripts/archive-model.mjs';
import {DEFAULT_SITE} from '../../../scripts/site-config.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const origin='https://today.scholay.com',size=24;
const route=(slug='',page=1)=>'/archive/'+(slug?slug+'/':'')+(page>1?'page/'+page+'/':'');
export function courseLabels(course){
  if(!course)return '';
  return [({course:'课程',training:'培训',workshop:'工作坊',tutorial:'长期教程',recording:'录播'})[course.format],({free:'免费',paid:'付费',unknown:'费用待核对'})[course.fee],({open:'报名中',upcoming:'尚未开放报名',closed:'报名已结束','not-applicable':'无需报名',unknown:'报名状态待核对'})[course.registration]].filter(Boolean).map(esc).join(' · ');
}
export const archiveCard=(item,sections=archiveSections)=>{
  const name=sections.find(s=>s.slug===item.section)?.name||item.section;
  return '<article class="archive-record" data-section="'+esc(item.section)+'"><a class="archive-card-link" href="'+esc(item.route)+'"><div class="archive-card-top"><span>'+name+'</span>'+(item.category&&item.category!==name?'<small>'+esc(item.category)+'</small>':'')+'</div><h2>'+esc(item.title)+'</h2><p>'+esc(String(item.summary||'').slice(0,240))+'</p>'+(item.course?'<p>'+courseLabels(item.course)+'</p>':'')+'<footer><time>'+esc(item.dateLabel)+'</time><span aria-hidden="true">↗</span></footer></a></article>';
};
// Each section is visible from the first page; sparse sections are not buried by the calendar.
function interleave(records,sections){const groups=sections.map(s=>records.filter(x=>x.section===s.slug)),out=[];for(let i=0;i<Math.max(...groups.map(g=>g.length));i++)for(const group of groups)if(group[i])out.push(group[i]);return out;}
export async function buildArchive({records,writeRoute,pageShell,sections=archiveSections}){
  const groups=sections.map(s=>({...s,id:s.slug})),primary=sections.filter(s=>!s.legacy);
  const includes=(section,record)=>collectionIds(groups,section.slug).has(record.section);
  const ordered=interleave(records,sections),counts=Object.fromEntries(sections.map(s=>[s.slug,records.filter(x=>includes(s,x)).length]));
  for(const section of [{slug:'',name:'全部文章',description:'浏览全部公开内容，按分类筛选或搜索。'},...sections]){
    const list=section.slug?ordered.filter(x=>includes(section,x)):ordered,pages=Math.max(1,Math.ceil(list.length/size));
    const filters='<nav class="archive-filters" aria-label="文章分类"><a data-filter href="/archive/"'+(!section.slug?' aria-current="page"':'')+'><span>全部文章</span><small>'+records.length+'</small></a>'+primary.map(s=>'<a data-filter href="'+route(s.slug)+'"'+(section.slug===s.slug?' aria-current="page"':'')+'><span>'+s.name+'</span><small>'+counts[s.slug]+'</small></a>').join('')+'</nav>';
    for(let page=1;page<=pages;page++){
      const url=route(section.slug,page),slice=list.slice((page-1)*size,page*size);
      const calendarLink=['calendar','intelligence','history'].includes(section.slug)?'<p class="interaction-link"><a href="/#/'+(section.slug==='history'?'history':'year')+'">在'+(section.slug==='history'?'昔日学术':'今日学术')+'日历中浏览 ↗</a></p>':'';
      const pagination=pages===1?'':'<nav class="pagination" aria-label="文章分页">'+(page>1?'<a rel="prev" href="'+route(section.slug,page-1)+'">上一页</a>':'')+Array.from({length:pages},(_,i)=>i+1).filter(i=>i===1||i===pages||Math.abs(i-page)<=2).map((i,n,shown)=>(n&&i-shown[n-1]>1?'<span aria-hidden="true">…</span>':'')+'<a href="'+route(section.slug,i)+'"'+(i===page?' aria-current="page"':'')+'>'+i+'</a>').join('')+(page<pages?'<a rel="next" href="'+route(section.slug,page+1)+'">下一页</a>':'')+'</nav>';
      const body='<main class="archive-library" data-archive-section="'+section.slug+'"><aside class="archive-sidebar"><h1>全部文章</h1><form id="archive-search-form" role="search" action="'+route(section.slug)+'"><label for="archive-search">搜索文章</label><input id="archive-search" name="q" type="search" placeholder="标题、摘要、关键词" autocomplete="off"><button class="archive-search-submit" type="submit">搜索</button></form><h2>文章分类</h2>'+filters+'</aside><section class="archive-results" aria-label="文章目录"><header class="archive-toolbar"><div><h2>'+section.name+'</h2><p>'+section.description+'</p>'+calendarLink+'</div><span id="archive-result-count" role="status">'+list.length+' 篇 · 第 '+page+' / '+pages+' 页</span></header><div id="archive-grid" class="archive-grid">'+(slice.length?slice.map(x=>archiveCard(x,sections)).join(''):'<p class="archive-empty">此分类尚无公开稿件。</p>')+'</div><div id="archive-pagination">'+pagination+'</div><noscript><p>栏目与分页可直接浏览；关键词检索需要启用 JavaScript。</p></noscript></section></main><script src="/archive.js?v=news-20261018" defer></script>';
      const schema=[{'@type':'CollectionPage',name:section.slug?section.name:'全部文章',url:origin+url,mainEntity:{'@type':'ItemList',numberOfItems:list.length,itemListElement:slice.map((x,i)=>({'@type':'ListItem',position:(page-1)*size+i+1,name:x.title,url:origin+x.route}))}}];
      await writeRoute(url,lastmod=>pageShell({title:(section.slug?section.name+'｜':'')+'全部文章'+(page>1?' · 第 '+page+' 页':'')+'｜'+DEFAULT_SITE.name,description:listingDescription({title:section.name,description:section.description,page,pages,items:slice}),route:url,body,schema,lastmod}));
    }
  }
  return {sections:sections.map(s=>({...s,members:[...collectionIds(groups,s.slug)]})),records:ordered};
}
