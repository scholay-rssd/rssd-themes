// Reusable article-page structures for the journal-family Themes. Each one is a
// pure function of the published record and its already-rendered body: none
// changes a manuscript, route, title or SEO head. A site opts in by listing the
// structure ids in its blog preset; the Demo enables every one.
import {plainText} from '../engine/page-metadata.mjs';
import {recordsInCollection} from '../engine/site-organization.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const STRUCTURES=Object.freeze({
  toc:{name:'本页目录',reference:'Starlight',description:'正文 H2/H3 生成锚点与侧栏目录。'},
  neighbors:{name:'上下篇',reference:'Starlight',description:'同一栏目内按日期排列的上一篇与下一篇。'},
  tables:{name:'数据表格',reference:'Just the Docs',description:'表格包入可键盘滚动的区域，表头吸顶、隔行底色。'},
  byline:{name:'署名栏',reference:'Distill',description:'标题下的栏目、发布日期、作者与阅读时长。'},
  'wide-figures':{name:'宽幅配图',reference:'Distill',description:'独占一段的配图在宽屏上超出正文栏。'},
  appendix:{name:'附录区',reference:'Distill',description:'来源、关联项目与参考文献收入正文后的附录带。'},
  'fact-sheet':{name:'要素卡',reference:'CourtListener',description:'标题下的要旨、栏目、日期、标签与原始来源。'},
  citations:{name:'引用来源',reference:'CourtListener',description:'来源编号列出，并标明来源网站。'},
  infobox:{name:'信息框',reference:'MediaWiki',description:'正文右侧浮动的词条信息框。'},
  'see-also':{name:'参见',reference:'MediaWiki',description:'按共同标签与栏目推荐的相关条目。'},
  epigraph:{name:'题记',reference:'Tufte CSS',description:'正文开头的引用排为题记，“——”出处右对齐。'},
  'title-seal':{name:'题签',reference:'Tufte CSS',description:'宽屏时在正文左侧竖排标题，仿古籍题签。'},
  'link-directory':{name:'分类导航',reference:'WebStack',description:'首页按栏目分组的链接卡片，附官网直达。',scope:'home'},
  'source-action':{name:'访问官网',reference:'WebStack',description:'文章标题下的原始来源直达按钮。'},
  'post-meta':{name:'文章信息行',reference:'AstroPaper',description:'标题下一行：日期、阅读时长与 #标签。'},
  'reading-progress':{name:'阅读进度',reference:'AstroPaper',description:'页面顶部随滚动增长的进度条，纯 CSS。'},
  'image-rows':{name:'图组',reference:'Hugo Theme Gallery',description:'同一段落里的多张图片排成等高图组，并识别其后的图注。'},
  contents:{name:'文首目录',reference:'al-folio',description:'正文前可折叠的本文目录，适合没有侧栏的版式。'},
});

// Stable, readable fragment ids from heading text; duplicates get a suffix.
export function headingAnchors(html){
  const used=new Map(),headings=[];
  const body=String(html).replace(/<h([23])>([\s\S]*?)<\/h\1>/g,(_,level,inner)=>{
    const text=plainText(inner),base=(text.toLowerCase().replace(/[\s　]+/g,'-').replace(/[^\p{L}\p{N}_-]/gu,'').replace(/-+/g,'-').replace(/^-|-$/g,'')||'section').slice(0,64);
    const n=(used.get(base)||0)+1;used.set(base,n);const id=n>1?base+'-'+n:base;
    headings.push({level:Number(level),id,text});
    return `<h${level} id="${esc(id)}">${inner}</h${level}>`;
  });
  return {body,headings};
}

export function tableOfContents(headings,{label='本页目录'}={}){
  if(headings.length<2)return '';
  return `<nav class="toc" aria-label="${esc(label)}"><p class="toc-title">${esc(label)}</p><ol>${headings.map(h=>`<li class="toc-h${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol></nav>`;
}

// Collapsible contents at the top of the article, for layouts without a rail.
export function inlineContents(headings,{label='本文目录'}={}){
  if(headings.length<3)return '';
  return `<details class="article-contents"><summary>${esc(label)} <small>${headings.length}</small></summary><ol>${headings.map(h=>`<li class="toc-h${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join('')}</ol></details>`;
}

const byDate=(a,b)=>String(a.publication?.date||'').localeCompare(String(b.publication?.date||''))||a.id.localeCompare(b.id);
export function articleNeighbors(records,record){
  const peers=records.filter(r=>r.collectionId===record.collectionId).slice().sort(byDate),i=peers.findIndex(r=>r.id===record.id);
  const previous=peers[i-1],next=peers[i+1];
  if(!previous&&!next)return '';
  const link=(r,rel,label)=>r?`<a class="neighbor-${rel}" rel="${rel}" href="${esc(r.route)}"><small>${label}</small><span>${esc(r.title)}</span></a>`:'<span></span>';
  return `<nav class="article-neighbors" aria-label="上一篇与下一篇">${link(previous,'prev','← 上一篇')}${link(next,'next','下一篇 →')}</nav>`;
}

// Wide tables scroll inside a focusable region instead of the whole page.
export function dataTables(html){
  return String(html).replace(/<table>([\s\S]*?)<\/table>/g,(_,inner)=>`<div class="table-scroll" role="region" tabindex="0" aria-label="可横向滚动的表格"><table class="data-table">${inner}</table></div>`);
}

// Reading time from the rendered text: CJK characters and Latin words.
export function readingMinutes(html){
  const text=plainText(html),cjk=(text.match(/[\u3400-\u9fff\uf900-\ufaff]/g)||[]).length,words=(text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g,' ').match(/[A-Za-z0-9]+/g)||[]).length;
  return Math.max(1,Math.round(cjk/400+words/220));
}
// A definition list, not a paragraph: page descriptions never come from it.
export function byline({record,column,date,body}){
  const items=[['栏目',column],['发布',date],['作者',record.publication?.author],['阅读',`约 ${readingMinutes(body)} 分钟`]].filter(([,v])=>v);
  return `<dl class="article-byline">${items.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

const host=url=>{try{return new URL(url).hostname.replace(/^www\./,'');}catch{return '';}};
const publicLinks=record=>(record.sources||[]).filter(l=>/^https?:\/\//.test(l.url||''));
// Case-style summary card. Uses a <dl>, so the summary shown here is never
// re-read as a page description.
export function factSheet({record,column,date,label='要素'}){
  const first=publicLinks(record)[0];
  const rows=[['要旨',record.summary],['栏目',column],['日期',date],['标签',record.tags?.join(' · ')],
    ['原始来源',first?`<a href="${esc(first.url)}" rel="noreferrer">${esc(first.label||host(first.url))} ↗</a>`:'',true]].filter(([,v])=>v);
  return `<aside class="fact-sheet" aria-label="${esc(label)}"><dl>${rows.map(([k,v,html])=>`<div class="fact-${k==='要旨'?'summary':'row'}"><dt>${k}</dt><dd>${html?v:esc(v)}</dd></div>`).join('')}</dl></aside>`;
}
// Numbered authorities with their host, replacing the plain source links.
export function citationList(record){
  const links=publicLinks(record);
  if(!links.length)return '';
  return `<aside class="sources citations"><h2>引用来源 <small>${links.length}</small></h2><ol>${links.map(l=>`<li><a href="${esc(l.url)}" rel="noreferrer">${esc(l.label||'原始来源')} ↗</a><small>${esc(host(l.url))}</small></li>`).join('')}</ol></aside>`;
}

// Encyclopedia infobox; floats beside the opening paragraphs on wide screens.
export function infobox({record,column,date}){
  const links=publicLinks(record);
  const rows=[['类别',column],['收录',date],['标签',record.tags?.join('、')],['来源',links.length?links.map(l=>`<a href="${esc(l.url)}" rel="noreferrer">${esc(l.label||host(l.url))}</a>`).join('<br>'):'',true]].filter(([,v])=>v);
  return `<aside class="infobox" aria-label="词条信息"><div class="infobox-title">${esc(record.title)}</div><table><tbody>${rows.map(([k,v,html])=>`<tr><th scope="row">${k}</th><td>${html?v:esc(v)}</td></tr>`).join('')}</tbody></table></aside>`;
}
// "See also": shared tags first, then the same section; never the record itself.
export function seeAlso(records,record,limit=5){
  const tags=new Set(record.tags||[]),score=r=>(r.tags||[]).filter(t=>tags.has(t)).length*2+(r.collectionId===record.collectionId?1:0);
  const picks=records.filter(r=>r.id!==record.id&&r.type!=='event'&&score(r)>0).sort((a,b)=>score(b)-score(a)||String(b.publication?.date||'').localeCompare(String(a.publication?.date||''))||a.id.localeCompare(b.id)).slice(0,limit);
  return picks.length?`<nav class="see-also" aria-label="参见"><h2>参见</h2><ul>${picks.map(r=>`<li><a href="${esc(r.route)}">${esc(r.title)}</a>${r.tags?.some(t=>tags.has(t))?`<small>${esc(r.tags.filter(t=>tags.has(t)).join('、'))}</small>`:''}</li>`).join('')}</ul></nav>`:'';
}

// An opening quotation becomes an epigraph; a final "——" line is its source.
export function epigraph(html){
  return String(html).replace(/^<blockquote>\n([\s\S]*?)<\/blockquote>/,(_,inner)=>`<blockquote class="epigraph">\n${inner.replace(/<p>((?:——|—|──)[^]*?)<\/p>\n$/,'<p class="epigraph-source">$1</p>\n')}</blockquote>`);
}
// Decorative and hidden from assistive technology: the H1 is the real title.
export const titleSeal=record=>`<div class="title-seal" aria-hidden="true"><span>${esc(record.title)}</span></div>`;

// A clear primary action to the original site, for resource-style pages.
export function sourceAction(record){
  const first=publicLinks(record)[0];
  return first?`<a class="source-action" href="${esc(first.url)}" rel="noreferrer">访问 ${esc(host(first.url))} <span aria-hidden="true">↗</span></a>`:'';
}
// Home-page link directory grouped by public section, with in-page chips.
export function linkDirectory({content,sections,limit=8}){
  const groups=sections.map(c=>({c,items:recordsInCollection(content,c.id).filter(r=>r.type!=='event').sort((a,b)=>String(b.publication?.date||'').localeCompare(String(a.publication?.date||''))||a.id.localeCompare(b.id))})).filter(g=>g.items.length);
  if(!groups.length)return '';
  const card=r=>{const first=publicLinks(r)[0];return `<li class="link-card"><span class="link-mark" aria-hidden="true">${esc(Array.from(r.title.trim())[0]||'·')}</span><div><a class="link-title" href="${esc(r.route)}">${esc(r.title)}</a>${r.summary?`<small>${esc(Array.from(plainText(r.summary)).slice(0,60).join(''))}</small>`:''}${first?`<a class="link-host" href="${esc(first.url)}" rel="noreferrer">${esc(host(first.url))} ↗</a>`:''}</div></li>`;};
  return `<section class="link-directory" aria-label="分类导航"><div class="section-heading"><h2>分类导航</h2></div><nav class="link-chips" aria-label="导航分类">${groups.map(({c,items})=>`<a href="#dir-${esc(c.id)}">${esc(c.name)}<small>${items.length}</small></a>`).join('')}</nav>${groups.map(({c,items})=>`<section class="link-group" id="dir-${esc(c.id)}"><h3><a href="${esc(c.route)}">${esc(c.name)}</a><a class="link-more" href="${esc(c.route)}">全部 ${items.length} →</a></h3><ul>${items.slice(0,limit).map(card).join('')}</ul></section>`).join('')}</section>`;
}
// Home-page structures; empty unless a site opts in.
export function homeStructures({structures=[],content,sections}){
  return new Set(structures).has('link-directory')?linkDirectory({content,sections}):'';
}

// One compact line: date, reading time and hashtags. A <div>, not a <p>.
export function postMeta({record,date,body}){
  return `<div class="post-meta">${date?`<time>${esc(date)}</time>`:''}<span>约 ${readingMinutes(body)} 分钟</span>${(record.tags||[]).map(t=>`<span class="post-tag">#${esc(t)}</span>`).join('')}</div>`;
}
// Scroll-driven, no script; browsers without scroll timelines show nothing.
export const readingProgress='<div class="reading-progress" aria-hidden="true"></div>';

// A paragraph made only of two or more images becomes an even-height row; a
// following "图…" / "Figure…" paragraph is its shared caption.
export function imageRows(html){
  return String(html).replace(/<p>((?:\s*<img\b[^>]*>\s*){2,})<\/p>(\n<p>(?=图|图片来源|来源[：:]|Figure|Photo)([\s\S]*?)<\/p>)?/g,(_,images,caption,text)=>{
    const count=(images.match(/<img\b/g)||[]).length;
    return `<div class="image-row" style="--images:${count}">${images.trim().replace(/>\s+</g,'><')}</div>${caption?`\n<p class="article-caption">${text}</p>`:''}`;
  });
}

// Compose the enabled structures around one article. Disabled structures add
// nothing, so a site without a structure list renders exactly as before.
export function articleStructures({structures=[],record,records,body,column='',date=''}){
  const on=new Set(structures),result={body,classes:[],lead:'',aside:'',after:''};
  if(on.has('fact-sheet'))result.lead+=factSheet({record,column,date});
  if(on.has('citations'))result.sources=citationList(record);
  if(on.has('source-action'))result.lead+=sourceAction(record);
  if(on.has('infobox')){result.lead+=infobox({record,column,date});result.classes.push('has-infobox');}
  if(on.has('byline'))result.lead+=byline({record,column,date,body});
  if(on.has('post-meta'))result.lead+=postMeta({record,date,body});
  if(on.has('reading-progress'))result.after+=readingProgress;
  if(on.has('wide-figures'))result.classes.push('figures-wide');
  if(on.has('appendix'))result.classes.push('has-appendix');
  if(on.has('toc')||on.has('contents')){
    const anchored=headingAnchors(body);result.body=anchored.body;
    const toc=on.has('toc')&&tableOfContents(anchored.headings);
    if(toc){result.aside=toc;result.classes.push('has-toc');}
    if(on.has('contents'))result.lead+=inlineContents(anchored.headings);
  }
  if(on.has('tables'))result.body=dataTables(result.body);
  if(on.has('image-rows'))result.body=imageRows(result.body);
  if(on.has('epigraph'))result.body=epigraph(result.body);
  if(on.has('title-seal')){result.lead=titleSeal(record)+result.lead;result.classes.push('has-title-seal');}
  if(on.has('see-also'))result.after+=seeAlso(records,record);
  if(on.has('neighbors'))result.after+=articleNeighbors(records,record);
  return result;
}
