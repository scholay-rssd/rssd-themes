'use strict';
import {publicationOnly, endDate, coversDate, addDays, monthDates, filterRecords, agendaBuckets, historyForDate, rangeSegmentKind, rangeProgress} from './calendar-model.js?v=20260929-range-ribbons';
import {createCalendarLoader} from './calendar-data.js?v=20261016';
import {ensureMathStyles} from './math-style.js?v=20261019';
const app = document.getElementById('main');
const calendarEnabled=document.documentElement.dataset.calendarEnabled!=='false';
if(!calendarEnabled)document.querySelectorAll('[data-nav=year],[data-nav=history]').forEach(a=>a.remove());
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
// mathHtml is rebuilt from source text by the publisher, like bodyHtml.
const mathText=(record,field)=>record.mathHtml?.[field]??esc(record[field]);
const safeUrl = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
const shanghai = () => {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get = type => Number(parts.find(p=>p.type===type)?.value || 0);
  return {year:get('year'),month:get('month'),day:get('day')};
};
const today=shanghai();
const pad=n=>String(n).padStart(2,'0');
const todayKey=pad(today.month)+'-'+pad(today.day);
const todayIso=today.year+'-'+todayKey;
const newReader = kind => ({
  query:'',category:'全部',tag:'',year:String(today.year),mode:'day',
  selected:kind==='year'?todayIso:todayKey,cursorYear:kind==='year'?today.year:2024,
  cursorMonth:today.month,page:1,openGroup:'',expandedDetails:[],expandedMonths:[],monthFilterKey:null,scroll:0,calendarScroll:null
});
const state={data:{year:null,history:null},openSource:null,view:'home',detail:false,readers:{year:newReader('year'),history:newReader('history')},sourceQuery:'',sourceCategory:'全部'};
const calendarSplitStorageKey='scholay-today.calendar-detail-width.v3';
let releaseCalendarResize=()=>{};
const names={year:'今日学术',history:'昔日学术'};
const historyGroups={
  '研究体系':['研究规范史','研究诚信史','研究方法史','定性研究方法史','开放科学史','数据治理史','学术制度','科学机构史','统计学史'],
  '基础与计算':['数学史','物理学史','粒子物理史','核科学史','化学史','材料科学史','生命科学史','地球科学史','天文学史','计算史','工程史'],
  '生命、健康与环境':['医学史','公共卫生史','心理学史','农业科学史','食品科学史','环境科学政策史'],
  '航天与空间':['航天史','航天政策史','月球探测史'],
  '人文与社会':['经济学史','社会学史','哲学史','历史学史','语言学史','法学史','教育史','艺术史','文学史','考古学史']
};
const yearCategories=['节假日','培养节点','学术会议','自然科学基金','人文社科基金','国家科技项目','地方科研项目','人才计划','博士后项目','国际科研机会','学术出版','科研岗位'];
const historyGroup=domain=>Object.entries(historyGroups).find(([,members])=>members.includes(domain))?.[0] || domain;
const itemUrl=(type,item)=>item.articleUrl||'#/'+type+'/'+encodeURIComponent(item.id);
const excerpt=(s,max=155)=>String(s||'').slice(0,max);
const dLabel=(s,kind)=>kind==='history'?s.year+' 年 · '+Number(s.dateKey.slice(0,2))+' 月 '+Number(s.dateKey.slice(3))+' 日':Number(s.start.slice(5,7))+' 月 '+Number(s.start.slice(8))+' 日';
const badge=(s,kind)=>kind==='history'?'<span class="badge">'+esc(historyGroup(s.domain))+'</span>':'<span class="badge'+(['已核验官网','已核验'].includes(s.provenance)?'':' needs')+'">'+esc(s.provenance)+'</span>';
function setNav(view){document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===view;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}
function setPageMeta(title,description){
  document.title=title==='今日学术'?'今日学术 · 科研日历':title+' · 今日学术';
  const set=(selector,value)=>{const node=document.querySelector(selector);if(node)node.setAttribute('content',value)};
  set('meta[name="description"]',description);
  set('meta[property="og:title"]',title+'｜Scholay Today');
  set('meta[property="og:description"]',description);
  set('meta[name="twitter:title"]',title+'｜Scholay Today');
  set('meta[name="twitter:description"]',description);
}
function story(s,kind){
  const date=kind==='history'?s.year:s.start.slice(5);
  const small=kind==='history'?s.dateKey:s.start.slice(0,4);
  const summary=kind==='history'?s.factSummary:s.summary;
  return '<article class="story-row"><span class="date-label">'+esc(date)+'</span> '+badge(s,kind)+
    '<h3><a href="'+itemUrl(kind,s)+'">'+esc(s.title)+'</a></h3><p>'+esc(summary)+'</p><div class="meta"><span>'+esc(kind==='history'?s.domain:s.category)+'</span><span>'+esc(kind==='history'?small:s.sourceName)+'</span></div></article>';
}
function home(){
  const {current}=agendaBuckets(state.data.year,todayIso);
  const {featured,others}=historyForDate(state.data.history,todayKey);
  const histories=featured?[featured,...others]:[];
  const projects=[...state.openSource.items].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.title.localeCompare(b.title,'zh-CN'));
  const card=({label,title,summary,url,meta,external=false})=>'<article class="home-record"><div class="home-record-label">'+esc(label)+'</div><h3><a href="'+esc(url)+'"'+(external?' target="_blank" rel="noopener noreferrer"':'')+'>'+esc(title)+(external?' <span aria-hidden="true">↗</span>':'')+'</a></h3><p>'+esc(summary)+'</p><div class="home-record-meta">'+esc(meta)+'</div></article>';
  const section=({id,number,title,description,route,label,content,empty})=>'<section class="home-section" aria-labelledby="home-'+id+'"><header class="home-section-head"><div class="home-section-name"><span class="home-section-number" aria-hidden="true">'+number+'</span><div><h2 id="home-'+id+'">'+title+'</h2><p>'+esc(description)+'</p></div></div><a class="home-enter" href="'+route+'">'+label+' <span aria-hidden="true">→</span></a></header>'+(content?'<div class="home-record-grid">'+content+'</div>':'<p class="home-empty">'+empty+'</p>')+'</section>';
  app.innerHTML='<div class="home-overview"><header class="home-intro"><div><h1>Scholay <em>Today</em></h1><p>科研日程、学术往事与开放研究。</p></div><time datetime="'+todayIso+'">'+dateText(todayIso)+'</time></header>'+
    section({id:'year',number:'01',title:'今日学术',description:'今日相关 '+current.length+' 条 · 科研日程、申报机会与学术通知',route:'#/year',label:'进入今日学术',empty:'今天暂无相关日程。进入今日学术可查看其他日期。',content:current.slice(0,3).map(s=>card({label:s.category+' · '+(publicationOnly(s)?'通知发布':'今日相关'),title:s.title,summary:s.summary,url:itemUrl('year',s),meta:(publicationOnly(s)?'发布于 ':'')+s.start+(s.end&&s.end!==s.start&&!publicationOnly(s)?' — '+s.end:'')+' · '+(s.sourceName||'未标明来源')+' · '+s.provenance})).join('')})+
    section({id:'history',number:'02',title:'昔日学术',description:monthDayText(todayKey)+' · 昔日学术，研究如何走到现在',route:'#/history',label:'进入历史日历',empty:'这个月日暂未收录历史故事。进入历史日历可浏览其他日期。',content:histories.slice(0,3).map(s=>card({label:s.year+' 年 · '+s.domain,title:s.title,summary:s.factSummary,url:itemUrl('history',s),meta:s.eventType||'学术史记录'})).join('')})+
    section({id:'open-source',number:'03',title:'今日学术开源',description:'最近收录的开放工具与研究项目 · 共 '+projects.length+' 个',route:'#/open-source',label:'进入学术开源',empty:'暂未收录开源项目。',content:projects.slice(0,3).map(s=>card({label:s.category,title:s.title,summary:s.summary,url:safeUrl(s.url)||'#/open-source',external:Boolean(safeUrl(s.url)),meta:'收录于 '+s.date+' · '+(s.status||'公开收录')})).join('')})+'</div>';
}
const sourceCategories=['全部','文献与写作','科研 Agent','数据与评测','实验与仪器','生命与医学','基础设施'];
function sourceCard(s,index){
  const project=safeUrl(s.url),related=safeUrl(s.relatedUrl);
  return '<article class="source-card"><div class="source-card-top"><span class="source-index">'+String(index+1).padStart(2,'0')+'</span><span class="source-tag">'+esc(s.category)+'</span></div>'+
    '<div class="source-card-body"><div class="source-card-meta">'+esc(s.date)+' <span>·</span> '+esc(s.status)+'</div><h3>'+esc(s.title)+'</h3><p>'+mathText(s,'summary')+'</p><div class="source-value"><b>为何收录</b><span>'+mathText(s,'value')+'</span></div></div>'+
    '<div class="source-card-links"><a href="'+esc(project)+'" target="_blank" rel="noopener noreferrer">打开项目 ↗</a>'+(related?'<a href="'+esc(related)+'" target="_blank" rel="noopener noreferrer">相关资料 ↗</a>':'')+'</div></article>';
}
function updateSourceResults(){
  const query=state.sourceQuery.trim().toLocaleLowerCase();
  const items=state.openSource.items.filter(s=>(state.sourceCategory==='全部'||s.category===state.sourceCategory)&&(!query||[s.title,s.summary,s.value,s.category].join(' ').toLocaleLowerCase().includes(query)));
  document.getElementById('source-count').textContent='显示 '+items.length+' / '+state.openSource.items.length+' 个项目';
  document.getElementById('source-grid').innerHTML=items.map(sourceCard).join('')||'<p class="empty">暂无匹配项目。可以试试其他关键词或分类。</p>';
  document.querySelectorAll('[data-source-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sourceCategory===state.sourceCategory)));
  ensureMathStyles(app);
}
function openSourcePage(){
  const items=state.openSource.items;
  app.innerHTML='<section class="source-hero"><div><span class="eyebrow">SCHOLAY TODAY / OPEN SOURCE</span><h1>学术开源<span>.</span></h1><p>让研究工具被看见，也让每一种新方法都有迹可循。这里收录值得研究与试用的开放项目，链接直达项目原页。</p><div class="source-hero-actions"><button id="source-jump" type="button">浏览全部项目 ↓</button><span>手动整理 · 项目原页可查</span></div></div><div class="source-hero-aside"><small>THE OPEN RESEARCH INDEX</small><strong>'+items.length+'</strong><span>个已公开项目</span><i></i><p>文献阅读 / 科研 Agent / 数据评测<br>实验仪器 / 生命医学 / 基础设施</p></div></section>'+
    '<section id="source-directory" class="source-directory"><div class="source-heading"><div><span class="eyebrow">DISCOVER / EXPLORE / VERIFY</span><h2>项目档案</h2></div><p>按主题筛选，阅读收录理由，再到原始仓库核对版本与许可。</p></div><div class="source-toolbar"><div class="source-filters" role="group" aria-label="按主题筛选">'+sourceCategories.map(c=>'<button type="button" data-source-category="'+esc(c)+'" aria-pressed="'+(state.sourceCategory===c)+'">'+esc(c)+'</button>').join('')+'</div><label class="source-search"><span>搜索项目</span><input id="source-search" type="search" placeholder="项目名、领域、方法…" value="'+esc(state.sourceQuery)+'"></label></div><div class="source-results-head"><span id="source-count"></span><span>按收录日期排列</span></div><div id="source-grid" class="source-grid"></div><div class="source-footnote">本栏目是人工整理的项目快照。项目更新、适用范围和许可条件以项目原页为准。</div></section>';
  document.querySelectorAll('[data-source-category]').forEach(b=>b.addEventListener('click',()=>{state.sourceCategory=b.dataset.sourceCategory;updateSourceResults()}));
  document.getElementById('source-jump').addEventListener('click',()=>document.getElementById('source-directory').scrollIntoView({block:'start'}));
  document.getElementById('source-search').addEventListener('input',e=>{state.sourceQuery=e.target.value;updateSourceResults()});
  updateSourceResults();
}
const dateText = iso => `${Number(iso.slice(0,4))} 年 ${Number(iso.slice(5,7))} 月 ${Number(iso.slice(8))} 日`;
const monthDayText = key => `${Number(key.slice(0,2))} 月 ${Number(key.slice(3))} 日`;
const reader = kind => state.readers[kind];
const baseItems = kind => {
  const r=reader(kind);
  const items=filterRecords(state.data[kind],r,kind,historyGroup);
  if(!r.tag)return items;
  return items.filter(item=>kind==='year'?(item.tags||[]).includes(r.tag):item.domain===r.tag);
};
const onDate = (kind, items, date) => items.filter(s => kind==='year' ? coversDate(s,date) : s.dateKey===date);
function sourcesList(s,kind){
  const sources=kind==='year'?[{label:s.sourceName||'原始来源',url:s.sourceUrl}]:(s.sources||[]);
  return sources.filter(x=>safeUrl(x.url)).map(x=>'<li><a href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">'+esc(x.label||'原始来源')+' ↗</a></li>').join('');
}
function agendaItem(s){
  const date=publicationOnly(s)?'通知发布 · '+dateText(s.start):dateText(s.start)+(s.end&&s.end!==s.start?' — '+dateText(s.end):'');
  const stamp=publicationOnly(s)?'发布':Number(s.start.slice(5,7))+'/'+Number(s.start.slice(8));
  return '<article class="calendar-card agenda-item"><aside class="calendar-card-stamp"><time>'+esc(stamp)+'</time><small>'+esc(s.category)+'</small></aside><div class="calendar-card-content"><header><div class="record-meta"><span>'+esc(s.sourceName||'未标明来源')+'</span>'+badge(s,'year')+'</div></header><h3><a href="'+itemUrl('year',s)+'">'+esc(s.title)+'</a></h3><p>'+mathText(s,'summary')+'</p><div class="agenda-date">'+esc(date)+'</div>'+(publicationOnly(s)?'<small class="date-caution">事件日期未核实，请以原始通知为准。</small>':'')+'</div></article>';
}
function historyStory(s,featured=false){
  const sourceHtml=sourcesList(s,'history');
  return '<article class="calendar-card memory-story'+(featured?' memory-feature':'')+'"><div class="memory-year"><span>'+esc(s.year)+'</span><small>'+esc(s.domain)+'</small></div><div class="memory-copy"><div class="record-meta"><span>'+esc(s.eventType)+'</span><span>'+esc(s.domain)+'</span></div><h3><a href="'+itemUrl('history',s)+'">'+esc(s.title)+'</a></h3><p>'+mathText(s,'factSummary')+'</p>'+
    (featured?'<div class="memory-significance"><h4>这件事为何重要</h4><p>'+mathText(s,'historicalSignificance')+'</p></div>':'<details class="reading-disclosure" data-expand="meaning-'+esc(s.id)+'"><summary>阅读学术意义</summary><p>'+mathText(s,'historicalSignificance')+'</p></details>')+
    '<details class="reading-disclosure" data-expand="sources-'+esc(s.id)+'"><summary>来源与延伸阅读'+(sourceHtml?'':'（暂无链接）')+'</summary><ul class="source-list">'+sourceHtml+'</ul></details><a class="record-link" href="'+itemUrl('history',s)+'">阅读完整记录 ↗</a></div></article>';
}
function emptyContent(kind){
  const title=kind==='year'?'该日期在当前筛选条件下没有日程记录':'该日期在当前筛选条件下没有历史记录';
  return '<div class="calendar-empty reading-empty"><h3>'+title+'</h3><p>可以切换日期，或清除搜索与标签筛选。</p><div class="empty-actions"><button type="button" data-day-step="-1">← 前一天</button><button type="button" data-day-step="1">后一天 →</button><button type="button" data-reset-filters>清除筛选</button></div></div>';
}
const groupIcon = (kind,name) => kind==='year'
  ? ({'节假日':'○','培养节点':'•','学术会议':'◷','自然科学基金':'◇','人文社科基金':'◇','国家科技项目':'▧','地方科研项目':'▧','人才计划':'✳','博士后项目':'✳','国际科研机会':'◷','学术出版':'▤','科研岗位':'⌁'}[name]||'·')
  : ({'研究体系':'◌','基础与计算':'◇','生命、健康与环境':'✳','航天与空间':'◷','人文与社会':'❦'}[name]||'·');
function calendarGroups(kind){
  if(kind==='history')return Object.entries(historyGroups).map(([name,members])=>({name,members}));
  return yearCategories.map(name=>({
    name,
    members:[...new Set(state.data.year.filter(item=>item.category===name).flatMap(item=>item.tags||[]))].sort((a,b)=>a.localeCompare(b,'zh-CN'))
  }));
}
function groupCount(kind,name){
  return kind==='year'
    ? state.data.year.filter(item=>item.category===name).length
    : state.data.history.filter(item=>historyGroup(item.domain)===name).length;
}
function tagCount(kind,name,tag){
  return kind==='year'
    ? state.data.year.filter(item=>item.category===name&&(item.tags||[]).includes(tag)).length
    : state.data.history.filter(item=>item.domain===tag).length;
}
function calendarSidebarContent(kind){
  const r=reader(kind),groups=calendarGroups(kind);
  const activeAll=r.category==='全部';
  return '<div class="calendar-public-sidebar-head"><div>'+names[kind]+'<span>'+(kind==='year'?'Academic calendar':'On this day')+'</span></div></div><div class="calendar-public-sidebar-label">标签组</div><nav class="calendar-public-sidebar-nav" aria-label="标签组">'+
    '<button type="button" data-calendar-category="全部" class="calendar-tag-item'+(activeAll?' is-active':'')+'"><span class="calendar-tag-icon">▤</span><span>全部</span><small>'+state.data[kind].length+'</small></button>'+
    groups.map(({name,members})=>{
      const open=r.openGroup===name,active=r.category===name;
      const visibleMembers=members.slice(0,24);
      return '<div class="calendar-tag-group'+(open?' is-open':'')+'"><button type="button" data-calendar-group="'+esc(name)+'" class="calendar-tag-item'+(active?' is-active':'')+'" aria-expanded="'+open+'"><span class="calendar-tag-icon">'+groupIcon(kind,name)+'</span><span>'+esc(name)+'</span><small>'+groupCount(kind,name)+'</small><i aria-hidden="true">›</i></button>'+
        '<div class="calendar-tag-children"'+(open?'':' hidden')+'>'+visibleMembers.map(tag=>'<button type="button" data-calendar-category="'+esc(name)+'" data-calendar-group="'+esc(name)+'" data-calendar-tag="'+esc(tag)+'" class="'+(r.category===name&&r.tag===tag?'is-active':'')+'"><span>'+esc(tag)+'</span><small>'+tagCount(kind,name,tag)+'</small></button>').join('')+
        (members.length>visibleMembers.length?'<span class="calendar-tag-more">其余 '+(members.length-visibleMembers.length)+' 个标签</span>':'')+'</div></div>';
    }).join('')+
    '</nav>';
}
function calendarSidebar(kind){
  return '<aside class="calendar-public-sidebar" aria-label="'+names[kind]+'标签"><div id="calendar-labels">'+calendarSidebarContent(kind)+'</div></aside>';
}
function yearOptions(){
  return [...new Set([today.year,...state.data.year.flatMap(item=>[Number(item.start.slice(0,4)),Number(endDate(item).slice(0,4))])])].sort((a,b)=>b-a);
}
const monthAbbr=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function activeTagLabel(kind){
  const r=reader(kind);
  if(r.tag)return r.tag;
  return r.category==='全部'?'全部':r.category;
}
function calendarToolbar(kind){
  const r=reader(kind),subtitle=kind==='year'?'科研日程、申报机会与学术通知':'昔日学术，研究如何走到现在';
  return '<header class="calendar-public-title"><div class="calendar-title-copy"><span class="eyebrow">'+(kind==='year'?'ACADEMIC CALENDAR':'ON THIS DAY')+'</span><h1>'+names[kind]+'</h1><p>'+subtitle+'</p></div><div class="calendar-workspace-controls">'+
    '<label class="calendar-workspace-search"><span class="visually-hidden">搜索'+names[kind]+'</span><input id="calendar-search" type="search" placeholder="搜索标题、领域或来源…" value="'+esc(r.query)+'"></label>'+
    (kind==='year'?'<label class="calendar-workspace-year"><span>年份</span><select id="calendar-year" aria-label="浏览年份">'+yearOptions().map(year=>'<option value="'+year+'"'+(year===r.cursorYear?' selected':'')+'>'+year+' 年</option>').join('')+'</select></label>':'<span class="calendar-year-note">366 天 · 月日定位</span>')+
    '<div class="calendar-date-actions" role="group" aria-label="日期导航"><button type="button" data-day-step="-1" aria-label="前一天">←</button><button type="button" data-today>回到今天</button><button type="button" data-day-step="1" aria-label="后一天">→</button></div></div></header>';
}
function categoryTone(category){
  return ({'节假日':'holiday','培养节点':'campus','学术会议':'conference','自然科学基金':'science','人文社科基金':'humanities','国家科技项目':'national','地方科研项目':'local','人才计划':'talent','博士后项目':'postdoc','国际科研机会':'international','学术出版':'publishing','科研岗位':'career'})[category]||'neutral';
}
function ribbonLabel(item){
  return item.category==='节假日'||item.category==='培养节点' ? item.title : ((item.tags||[])[1]||item.category);
}
function ribbonRank(item,date){
  return ({start:0,point:1,through:2,end:3})[rangeSegmentKind(item,date)]??4;
}
function calendarMarker(kind,records,date){
  if(!records.length)return '';
  if(kind==='history'){
    return '<span class="calendar-dots" aria-hidden="true">'+records.slice(0,4).map(()=>'<i></i>').join('')+'</span>';
  }
  const grouped=new Map();
  for(const item of records){
    const key=reader(kind).tag||item.category;
    const previous=grouped.get(key);
    if(!previous||ribbonRank(item,date)<ribbonRank(previous,date))grouped.set(key,item);
  }
  const ribbons=[...grouped.values()].sort((a,b)=>ribbonRank(a,date)-ribbonRank(b,date)||a.title.localeCompare(b.title,'zh'));
  const visible=ribbons.slice(0,2),scaled=Boolean(reader(kind).tag);
  return '<span class="calendar-ribbons" aria-hidden="true">'+visible.map(item=>{
    const segment=rangeSegmentKind(item,date)||'point';
    const progress=scaled?rangeProgress(item,date):null;
    const label=ribbonLabel(item);
    return '<span class="calendar-ribbon is-'+segment+(progress!==null?' is-scaled':'')+'" data-tone="'+categoryTone(item.category)+'"'+(progress!==null?' style="--span-t:'+progress+'"':'')+' title="'+esc(item.title)+'"><span>'+((segment==='start'||segment==='point')?esc(label):'&nbsp;')+'</span></span>';
  }).join('')+(ribbons.length>visible.length?'<small class="calendar-more">+'+(ribbons.length-visible.length)+'</small>':'')+'</span>';
}
function annualMonth(kind,month,items){
  const r=reader(kind),year=kind==='year'?r.cursorYear:2024,dates=monthDates(year,month);
  const first=new Date(dates[0]+'T12:00:00Z').getUTCDay();
  const slots=Math.ceil((first+dates.length)/7)*7;
  const monthKey=year+'-'+pad(month);
  const recordsByDate=new Map(dates.map(iso=>[iso,onDate(kind,items,kind==='year'?iso:iso.slice(5))]));
  const emptyFilteredMonth=(r.category!=='全部'||r.tag||r.query.trim())&&![...recordsByDate.values()].some(records=>records.length);
  const cells=Array.from({length:slots},(_,index)=>{
    const date=new Date(Date.UTC(year,month-1,1-first+index));
    const iso=date.toISOString().slice(0,10);
    if(date.getUTCMonth()+1!==month)return '<span class="calendar-blank-date" aria-hidden="true"><b>'+date.getUTCDate()+'</b></span>';
    const value=kind==='year'?iso:iso.slice(5);
    const records=recordsByDate.get(iso),count=records.length;
    const selected=value===r.selected,isToday=value===(kind==='year'?todayIso:todayKey);
    const label=(kind==='year'?dateText(iso):monthDayText(value))+'，'+count+' 条'+(kind==='year'?'日程':'历史记录')+(isToday?'，今天':'');
    return '<button type="button" data-date="'+value+'" class="calendar-date-cell date-cell'+(count?' has-records':'')+(selected?' selected':'')+(isToday?' today':'')+'" aria-pressed="'+selected+'" aria-label="'+esc(label)+'" title="'+esc(label)+'"><b>'+date.getUTCDate()+'</b>'+calendarMarker(kind,records,value)+'</button>';
  }).join('');
  const grid='<div class="calendar-month-weekdays" aria-hidden="true">'+['SUN','MON','TUE','WED','THU','FRI','SAT'].map(day=>'<span>'+day+'</span>').join('')+'</div><div class="calendar-month-grid">'+cells+'</div>';
  if(emptyFilteredMonth)return '<details class="calendar-month calendar-empty-month" data-calendar-month="'+monthKey+'"'+(r.expandedMonths.includes(monthKey)?' open':'')+'><summary><h2>'+month+' 月 <small>'+monthAbbr[month-1]+'</small></h2><span>当前筛选无事件</span><span class="calendar-month-action" aria-hidden="true"></span></summary>'+grid+'</details>';
  return '<section class="calendar-month" data-calendar-month="'+monthKey+'"><header class="calendar-month-head"><span></span><h2>'+month+' 月 <small>'+monthAbbr[month-1]+'</small></h2><span>'+ (kind==='year'?year:'历史') +'</span></header>'+grid+'</section>';
}
function annualCalendarMonths(kind){
  const items=baseItems(kind);
  return Array.from({length:12},(_,index)=>annualMonth(kind,index+1,items)).join('');
}
function orderedDayRecords(kind){
  const items=onDate(kind,baseItems(kind),reader(kind).selected);
  if(kind==='history')return items;
  return items.sort((a,b)=>Number(b.provenance==='已核验官网')-Number(a.provenance==='已核验官网')||endDate(a).localeCompare(endDate(b))||a.title.localeCompare(b.title));
}
function calendarDetail(kind){
  const r=reader(kind),records=orderedDayRecords(kind),dateLabel=kind==='year'?dateText(r.selected):monthDayText(r.selected);
  const qualifier=(r.query||r.category!=='全部'||r.tag)?'当前筛选下 · ':'';
  const head='<header class="calendar-detail-head"><span>当前标签</span><h2>'+esc(activeTagLabel(kind))+'</h2><p>'+esc(qualifier+dateLabel+' · '+records.length+' 条记录')+'</p></header>';
  if(!records.length)return head+emptyContent(kind);
  if(kind==='year')return head+'<div class="calendar-detail-list">'+records.map(agendaItem).join('')+'</div>';
  const {featured,others}=historyForDate(records,r.selected);
  return head+'<div class="calendar-detail-list">'+historyStory(featured,true)+(others.length?'<div class="memory-more-label">同一天，不同年代</div>'+others.map(item=>historyStory(item)).join(''):'')+'</div>';
}
function wireDetailDisclosures(kind){
  const r=reader(kind);
  document.querySelectorAll('#calendar-detail [data-expand]').forEach(el=>{
    el.open=r.expandedDetails.includes(el.dataset.expand);
    el.addEventListener('toggle',()=>{
      if(el.isConnected)r.expandedDetails=[...document.querySelectorAll('#calendar-detail [data-expand][open]')].map(item=>item.dataset.expand);
    });
  });
}
function selectedMonthKey(kind){
  const value=reader(kind).selected;
  return kind==='year'?value.slice(0,7):'2024-'+value.slice(0,2);
}
function renderWorkspace(kind,{scrollToSelected=false}={}){
  const r=reader(kind),stream=document.getElementById('calendar-year-months');
  if(!stream)return;
  const filterKey=JSON.stringify([r.category,r.tag,r.query.trim(),r.cursorYear]);
  if(r.monthFilterKey!==filterKey){
    r.monthFilterKey=filterKey;r.expandedMonths=[];scrollToSelected=true;
  }
  if(r.calendarScroll===null&&!scrollToSelected)r.calendarScroll=stream.scrollTop;
  if(stream.dataset.filterKey!==filterKey){
    stream.innerHTML=annualCalendarMonths(kind);
    stream.dataset.filterKey=filterKey;
    stream.querySelectorAll('.calendar-empty-month').forEach(month=>{
      month.addEventListener('toggle',()=>{
        if(!month.isConnected)return;
        r.expandedMonths=[...stream.querySelectorAll('.calendar-empty-month[open]')].map(el=>el.dataset.calendarMonth);
      });
    });
  }else{
    stream.querySelectorAll('[data-date].selected').forEach(cell=>{cell.classList.remove('selected');cell.setAttribute('aria-pressed','false');});
    const selected=stream.querySelector('[data-date="'+r.selected+'"]');
    if(selected){selected.classList.add('selected');selected.setAttribute('aria-pressed','true');}
  }
  const labels=document.getElementById('calendar-labels');
  const sidebarKey=JSON.stringify([r.category,r.tag,r.openGroup]);
  if(labels&&labels.dataset.filterKey!==sidebarKey){labels.innerHTML=calendarSidebarContent(kind);labels.dataset.filterKey=sidebarKey;}
  const detailRoot=document.getElementById('calendar-detail');
  if(detailRoot)detailRoot.innerHTML=calendarDetail(kind);
  ensureMathStyles(app);
  wireDetailDisclosures(kind);
  if(!stream.dataset.scrollBound){
    stream.dataset.scrollBound='true';
    stream.addEventListener('scroll',()=>{r.calendarScroll=stream.scrollTop},{passive:true});
  }
  requestAnimationFrame(()=>{
    if(!stream.isConnected)return;
    if(scrollToSelected||r.calendarScroll===null){
      const target=stream.querySelector('[data-calendar-month="'+selectedMonthKey(kind)+'"]');
      // offsetTop is relative to the shared workspace, while scrollTop is
      // relative to this inner stream.  Subtract the stream offset so the
      // selected month lands at the top of the actual calendar viewport on
      // both desktop and the stacked mobile layout.
      stream.scrollTop=target?Math.max(0,target.offsetTop-stream.offsetTop-18):0;
    }else stream.scrollTop=r.calendarScroll;
  });
}
function wireCalendarResize(){
  releaseCalendarResize();
  const workspace=app.querySelector('.calendar-public');
  const handle=document.getElementById('calendar-resize');
  const sidebar=workspace?.querySelector('.calendar-public-sidebar');
  const detail=document.getElementById('calendar-detail');
  if(!workspace||!handle||!sidebar||!detail)return;

  const controller=new AbortController();
  const desktop=()=>window.matchMedia('(min-width: 861px)').matches;
  const bounds=()=>{
    const compact=window.matchMedia('(max-width: 1220px)').matches;
    const minimum=compact?280:320;
    const minimumCalendar=compact?360:360;
    const available=workspace.clientWidth-sidebar.getBoundingClientRect().width-handle.getBoundingClientRect().width-minimumCalendar;
    return {min:minimum,max:Math.max(minimum,Math.min(compact?580:820,Math.floor(available)))};
  };
  let detailWidth=Math.min(620,Math.round(workspace.clientWidth*.36));
  const setWidth=(value,persist=true)=>{
    if(!desktop())return detailWidth;
    const {min,max}=bounds();
    detailWidth=Math.round(Math.max(min,Math.min(max,Number(value)||min)));
    workspace.style.setProperty('--calendar-detail-width',detailWidth+'px');
    handle.setAttribute('aria-valuemin',String(min));
    handle.setAttribute('aria-valuemax',String(max));
    handle.setAttribute('aria-valuenow',String(detailWidth));
    handle.setAttribute('aria-valuetext','详情栏宽度 '+detailWidth+' 像素');
    if(persist){try{localStorage.setItem(calendarSplitStorageKey,String(detailWidth));}catch{}}
    return detailWidth;
  };
  let storedWidth;
  try{
    const stored=localStorage.getItem(calendarSplitStorageKey);
    if(stored!==null)storedWidth=Number(stored);
  }catch{}
  requestAnimationFrame(()=>setWidth(Number.isFinite(storedWidth)?storedWidth:detailWidth,false));

  let drag=null;
  const finishDrag=event=>{
    if(!drag||('pointerId' in event&&event.pointerId!==drag.pointerId))return;
    drag=null;
    document.documentElement.classList.remove('calendar-resizing');
  };
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0||!desktop())return;
    event.preventDefault();
    detailWidth=detail.getBoundingClientRect().width;
    drag={pointerId:event.pointerId,startX:event.clientX,startWidth:detailWidth};
    handle.setPointerCapture?.(event.pointerId);
    document.documentElement.classList.add('calendar-resizing');
  },{signal:controller.signal});
  handle.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    setWidth(drag.startWidth+drag.startX-event.clientX);
  },{signal:controller.signal});
  handle.addEventListener('pointerup',finishDrag,{signal:controller.signal});
  handle.addEventListener('pointercancel',finishDrag,{signal:controller.signal});
  handle.addEventListener('lostpointercapture',finishDrag,{signal:controller.signal});
  handle.addEventListener('keydown',event=>{
    if(!desktop())return;
    const {min,max}=bounds();
    if(event.key==='ArrowLeft'){event.preventDefault();setWidth(detailWidth+24);}
    else if(event.key==='ArrowRight'){event.preventDefault();setWidth(detailWidth-24);}
    else if(event.key==='Home'){event.preventDefault();setWidth(min);}
    else if(event.key==='End'){event.preventDefault();setWidth(max);}
  },{signal:controller.signal});
  window.addEventListener('resize',()=>{if(desktop())setWidth(detailWidth,false);},{passive:true,signal:controller.signal});
  const cleanup=()=>{
    controller.abort();
    document.documentElement.classList.remove('calendar-resizing');
    if(releaseCalendarResize===cleanup)releaseCalendarResize=()=>{};
  };
  releaseCalendarResize=cleanup;
}
function listing(kind){
  app.innerHTML='<section class="calendar-public is-'+kind+'" aria-label="'+names[kind]+'">'+calendarSidebar(kind)+'<main class="calendar-public-main">'+calendarToolbar(kind)+'<div id="calendar-year-months" class="calendar-year-months" role="region" aria-label="全年月历" tabindex="0"></div></main><div id="calendar-resize" class="calendar-resize-handle" role="separator" aria-orientation="vertical" aria-controls="calendar-detail" aria-label="调整日历与详情区域宽度" aria-valuemin="280" aria-valuemax="820" aria-valuenow="400" tabindex="0"></div><aside id="calendar-detail" class="calendar-detail" aria-label="所选日期详情" tabindex="-1"></aside></section>';
  renderWorkspace(kind,{scrollToSelected:reader(kind).calendarScroll===null});
  wireCalendarResize();
  document.getElementById('calendar-search').addEventListener('input',event=>{
    const r=reader(kind),stream=document.getElementById('calendar-year-months');
    r.query=event.target.value;r.page=1;r.calendarScroll=stream?.scrollTop??r.calendarScroll;
    renderWorkspace(kind);
  });
}
function selectDate(kind,value){
  const r=reader(kind);
  r.selected=value;r.mode='day';r.page=1;r.calendarScroll=null;
  r.cursorMonth=Number((kind==='year'?value.slice(5):value).slice(0,2));
  if(kind==='year')r.cursorYear=Number(value.slice(0,4));
  renderWorkspace(kind,{scrollToSelected:true});
  focusDetail();
}
function focusDetail(){
  const el=document.getElementById('calendar-detail');
  el?.focus({preventScroll:true});
  if(el&&window.matchMedia('(max-width: 760px)').matches)el.scrollIntoView({block:'start',behavior:'instant'});
}
app.addEventListener('change',event=>{
  if(event.target.id!=='calendar-year'||state.view!=='year'||state.detail)return;
  const r=reader('year'),year=Number(event.target.value),month=Number(r.selected.slice(5,7));
  const day=Math.min(Number(r.selected.slice(8)),new Date(Date.UTC(year,month,0)).getUTCDate());
  r.cursorYear=year;r.selected=year+'-'+pad(month)+'-'+pad(day);r.calendarScroll=null;
  renderWorkspace('year',{scrollToSelected:true});
});
app.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button||!['year','history'].includes(state.view)||state.detail)return;
  const kind=state.view,r=reader(kind),d=button.dataset;
  if('calendarCategory' in d){
    r.category=d.calendarCategory;r.tag=d.calendarTag||'';r.openGroup=d.calendarGroup||r.openGroup;r.page=1;
    const stream=document.getElementById('calendar-year-months');r.calendarScroll=stream?.scrollTop??r.calendarScroll;
    renderWorkspace(kind);return;
  }
  if('calendarGroup' in d){
    const group=d.calendarGroup;
    r.openGroup=r.openGroup===group?'':group;r.category=group;r.tag='';r.page=1;
    const stream=document.getElementById('calendar-year-months');r.calendarScroll=stream?.scrollTop??r.calendarScroll;
    renderWorkspace(kind);return;
  }
  if(d.date){selectDate(kind,d.date);return}
  if('dayStep' in d){
    const iso=kind==='year'?r.selected:'2024-'+r.selected;
    const next=addDays(iso,Number(d.dayStep));
    selectDate(kind,kind==='year'?next:next.slice(5));return;
  }
  if('today' in d){
    Object.assign(r,{selected:kind==='year'?todayIso:todayKey,cursorYear:kind==='year'?today.year:2024,cursorMonth:today.month,page:1,calendarScroll:null});
    renderWorkspace(kind,{scrollToSelected:true});focusDetail();return;
  }
  if('resetFilters' in d){
    r.query='';r.category='全部';r.tag='';r.page=1;
    const search=document.getElementById('calendar-search');if(search)search.value='';
    renderWorkspace(kind);focusDetail();
  }
});
function detail(kind,id,s){
  if(!s){app.innerHTML='<div class="not-found"><h1>没有找到这条记录</h1><a href="#/'+kind+'">返回'+names[kind]+'</a></div>';return}
  const isYear=kind==='year';
  const back=isYear?'#/year':'#/history';
  const sources=isYear?(s.sourceUrl?[{label:s.sourceName||'原始来源',url:s.sourceUrl}]:[]):s.sources;
  const linkHtml=sources.map(x=>'<li><a href="'+esc(safeUrl(x.url))+'" target="_blank" rel="noopener noreferrer">'+esc(x.label||x.url)+'</a></li>').join('');
  app.innerHTML='<article class="article"><a class="article-back" href="'+back+'">← 返回'+(isYear?'今日学术':'昔日学术')+'</a><div class="eyebrow" style="margin-top:28px">'+(isYear?'ACADEMIC CALENDAR':'ACADEMIC HISTORY')+' / '+esc(isYear?s.category:s.domain)+'</div><h1>'+esc(s.title)+'</h1>'+
    '<div class="meta">'+badge(s,kind)+'<span>'+esc(dLabel(s,kind))+'</span></div>'+
    '<p class="article-deck">'+mathText(s,isYear?'summary':'factSummary')+'</p>'+
    (isYear?'<div class="detail-grid"><div><small>日历日期</small><b>'+esc(s.start)+(s.end?' — '+esc(s.end):'')+'</b></div><div><small>日期依据</small><b>'+esc(s.dateBasis)+'</b></div><div><small>信息来源</small><b>'+esc(s.sourceName||'未标明')+'</b></div><div><small>审核状态</small><b>'+esc(s.provenance)+'</b></div></div>'+
      (s.dateBasis.includes('未核实')?'<p class="warning">此日期是信息发布日期，不能作为申报或会议截止日期使用。请打开原文核对。</p>':'')+
      (s.body?'<section class="article-section"><h2>通知正文'+(s.bodyTruncated?'（节选）':'')+'</h2><div class="article-body'+(s.bodyHtml?' markdown-body':'')+'">'+(s.bodyHtml||mathText(s,'body'))+'</div></section>':'<p class="warning">尚未缓存原文正文。请通过下方来源链接阅读完整通知。</p>'):
      '<div class="detail-grid"><div><small>发生时间</small><b>'+esc(s.year)+' 年 '+esc(s.dateKey.replace('-', ' 月 '))+' 日'+(s.preciseToDay?'':'（日期未精确到日）')+'</b></div><div><small>事件类型</small><b>'+esc(s.eventType)+'</b></div></div><section class="article-section"><h2>学术意义</h2><p class="article-body">'+mathText(s,'historicalSignificance')+'</p></section>')+
    '<section class="article-section"><h2>来源与延伸阅读</h2>'+(linkHtml?'<ul class="source-list">'+linkHtml+'</ul>':'<p class="warning">暂无来源链接。</p>')+'</section></article>';
}
const calendarLoader=createCalendarLoader();
let openSourcePromise,routeVersion=0;
const getJson=path=>fetch(path).then(r=>{if(!r.ok)throw new Error('数据文件不可用：'+path);return r.json()});
function showLoadError(error){app.innerHTML='<div class="empty">内容暂时无法载入。<br><small>'+esc(error.message)+'</small><p><button type="button" id="retry-load">重新加载</button></p></div>';document.getElementById('retry-load').addEventListener('click',route);}
// The build can render a front page into <main> (data-front). Keep it so "#/"
// returns to it; pages without one keep the calendar as the default view.
const frontNode=app.querySelector('[data-front]'),frontHtml=frontNode?frontNode.outerHTML:'';
const initialMeta={title:document.title,tags:['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]'].map(sel=>[sel,document.querySelector(sel)?.getAttribute('content')])};
// Date line, upcoming events and "on this day" depend on today, so they are
// filled here from the calendar data rather than baked into the static page.
function fillFront(){
  const root=app.querySelector('[data-front]');if(!root)return;
  const line=root.querySelector('[data-fp-dateline]');
  if(line)line.textContent=today.year+' 年 '+today.month+' 月 '+today.day+' 日 · 上海';
  Promise.all(['year','history'].filter(kind=>!state.data[kind]).map(kind=>calendarLoader.load(kind).then(data=>{state.data[kind]=data;}))).then(()=>{
    if(app.querySelector('[data-front]')!==root)return;
    const {current,upcoming}=agendaBuckets(state.data.year,todayIso);
    const events=[...current,...upcoming].filter(s=>!publicationOnly(s)).slice(0,6);
    const list=root.querySelector('[data-fp-events]');
    if(list)list.innerHTML=events.length?events.map(s=>'<li><time>'+esc(Number(s.start.slice(5,7))+'.'+Number(s.start.slice(8))+(s.end&&s.end!==s.start?'–'+Number(s.end.slice(5,7))+'.'+Number(s.end.slice(8)):''))+'</time><a href="'+itemUrl('year',s)+'">'+esc(excerpt(s.title,60))+'</a></li>').join(''):'<li class="fp-empty">近期暂无已核验的日程。</li>';
    const {featured,others}=historyForDate(state.data.history,todayKey);
    const past=(featured?[featured,...others]:[]).slice(0,2),box=root.querySelector('[data-fp-history]');
    if(box&&past.length){
      box.querySelector('[data-fp-history-title]').textContent='昔日学术 · '+today.month+' 月 '+today.day+' 日';
      box.querySelector('[data-fp-history-items]').innerHTML=past.map(s=>'<p><strong>'+esc(s.year)+'</strong><a href="'+itemUrl('history',s)+'">'+esc(excerpt(s.title,60))+'</a></p>').join('');
      box.hidden=false;
    }
  }).catch(()=>{const list=root.querySelector('[data-fp-events]');if(list)list.innerHTML='<li class="fp-empty"><a href="#/year">打开科研日历查看日程</a></li>';});
}
function showFront(){
  document.documentElement.classList.remove('route-pending');
  document.body.classList.remove('reader-mode','calendar-mode','home-mode');
  state.view='front';state.detail=false;setNav('home');
  if(!app.querySelector('[data-front]'))app.innerHTML=frontHtml;
  document.title=initialMeta.title;
  for(const [sel,value] of initialMeta.tags){const node=document.querySelector(sel);if(node&&value!==null&&value!==undefined)node.setAttribute('content',value);}
  fillFront();
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));
}
async function route(){
  const version=++routeVersion;
  releaseCalendarResize();
  let raw=location.hash.slice(1);
  if(frontHtml&&(!raw||raw==='/')){
    if(['year','history'].includes(state.view)&&!state.detail)reader(state.view).scroll=window.scrollY;
    showFront();return;
  }
  if(!raw||raw==='/'){
    raw='/year';
  }
  let path;
  try{path=decodeURIComponent(raw.split('?')[0]).split('/').filter(Boolean)}catch{path=['year']}
  const date=new URLSearchParams(raw.split('?')[1]||'').get('date');
  if(path[0]==='year'&&/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(date||'')&&monthDates(Number(date.slice(0,4)),Number(date.slice(5,7))).includes(date)){Object.assign(reader('year'),{selected:date,cursorYear:Number(date.slice(0,4)),cursorMonth:Number(date.slice(5,7)),year:date.slice(0,4)});}
  if(path[0]==='history'&&/^(0[1-9]|1[0-2])-\d{2}$/.test(date||'')&&monthDates(2024,Number(date.slice(0,2))).some(d=>d.slice(5)===date)){Object.assign(reader('history'),{selected:date,cursorMonth:Number(date.slice(0,2))});}
  if(path[0]==='feed'){
    history.replaceState(null,'','#/year');
    path=['year'];
  }
  if(!['home','year','history','open-source'].includes(path[0])){
    history.replaceState(null,'','#/');
    path=['home'];
  }
  const view=path[0];
  const isCalendar=calendarEnabled&&(view==='year'||view==='history')&&!path[1];
  document.body.classList.remove('reader-mode');
  document.body.classList.toggle('calendar-mode',isCalendar);
  document.body.classList.toggle('home-mode',view==='home');
  if(['year','history'].includes(state.view)&&!state.detail)reader(state.view).scroll=window.scrollY;
  state.view=view;state.detail=Boolean(path[1]&&['year','history'].includes(view));setNav(view);
  let detailRecord=null;
  try{
    const collections=view==='home'?['year','history']:['year','history'].includes(view)?[view]:[];
    const pending=collections.filter(kind=>!state.data[kind]).map(kind=>calendarLoader.load(kind).then(data=>{state.data[kind]=data;}));
    if((view==='home'||view==='open-source')&&!state.openSource){
      openSourcePromise??=getJson('/open-source.json').then(data=>{state.openSource=data;return data;}).catch(error=>{openSourcePromise=null;throw error;});
      pending.push(openSourcePromise);
    }
    if(pending.length){app.innerHTML='<div class="loading">正在载入'+(view==='year'?'学术日历':view==='history'?'学术史':view==='home'?'今日概览':'学术开源')+'…</div>';await Promise.all(pending);}
    if(version!==routeVersion)return;
    if(path[1]&&['year','history'].includes(view)){
      app.innerHTML='<div class="loading">正在载入记录…</div>';
      detailRecord=await calendarLoader.record(view,path[1]);
    }
    if(version!==routeVersion)return;
  }catch(error){if(version===routeVersion)showLoadError(error);return;}
  if(path[1] && (view==='year'||view==='history'))detail(view,path[1],detailRecord);
  else if(view==='home')home();
  else if(view==='open-source')openSourcePage();
  else if(!calendarEnabled)app.innerHTML='<section class="home-overview"><h1>'+names[view]+'</h1><p>已收录的日程与历史文章。</p>'+state.data[view].map(item=>story(item,view)).join('')+'</section>';
  else listing(view);
  const title=detailRecord?detailRecord.title:(view==='home'?'首页':view==='year'?'今日学术':view==='history'?'昔日学术':'学术开源');
  const description=detailRecord?(detailRecord.summary||detailRecord.factSummary||'Scholay Today 的人工维护记录。'):(view==='home'?'浏览今日学术、昔日学术与今日学术开源，快速进入完整栏目。':view==='year'?'浏览科研日程、项目申报、学术会议与培养节点。':view==='history'?'按同月同日回望论文发表、科学发现与学术制度。':'浏览人工整理的文献、科研 Agent、数据评测与开放研究项目。');
  setPageMeta(title,description);
  ensureMathStyles(app);
  requestAnimationFrame(()=>window.scrollTo({top:!state.detail&&['year','history'].includes(view)?reader(view).scroll:0,behavior:'instant'}));
}
if('scrollRestoration' in window.history)window.history.scrollRestoration='manual';
const todayLine=document.getElementById('today-line');
if(todayLine)todayLine.textContent=today.year+' 年 '+today.month+' 月 '+today.day+' 日 · 上海';
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();app.focus()});
document.getElementById('snapshot-note').textContent='日历、学术史与开源项目均为人工维护的固定快照。';
window.addEventListener('hashchange',route);
route();
