// Server-rendered front page for today.scholay.com ("/"). It is plain HTML inside
// <main>, so it appears without waiting for the calendar data (1 MB+) and search
// engines read it. It must not depend on the build date: the date line, the
// upcoming-events list and "on this day" are placeholders that app.js fills from
// the calendar data. The calendar and history stay one click away at #/year and
// #/history; app.js keeps this markup and restores it when returning to "#/".
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const plain=(value,limit=150)=>{
  const text=String(value??'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,'').replace(/[#*_`>~|]/g,'').replace(/\s+/g,' ').trim();
  const chars=Array.from(text);return chars.length>limit?chars.slice(0,limit).join('').trimEnd()+'…':text;
};
export function renderFrontPage({news,openSource,route,sectionName,cover=()=>null,sections=[],site={name:'Today',slogan:'日拱一卒，不疾而速'}}){
  const stories=news.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.id).localeCompare(String(b.id)));
  const [lead,...rest]=stories;
  const secondary=rest.slice(0,4);
  const projects=openSource.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(a.title).localeCompare(String(b.title),'zh')).slice(0,3);
  const story=(x,cls)=>{const media=cover(x);return `<article class="${cls}">${media?`<a href="${esc(route.news(x))}" tabindex="-1" aria-hidden="true"><img class="fp-cover" src="${esc(media.src)}" alt="" width="720" height="450" ${cls==='fp-lead'?'fetchpriority="high"':'loading="lazy"'} decoding="async"></a>`:''}<p class="fp-kicker">${esc(sectionName(x))} · ${esc(x.date)}</p><h2><a href="${esc(route.news(x))}">${esc(x.title)}</a></h2><p>${esc(plain(x.summary,cls==='fp-lead'?220:110))}</p></article>`;};
  const chips=sections.map(c=>`<a href="${esc(c.route)}">${esc(c.name)}</a>`).join('');
  return `<div class="fp" data-front>`+
   `<section class="fp-masthead" aria-label="${esc(site.name)}"><p class="fp-dateline" data-fp-dateline></p><h1>${esc(site.name)}</h1><p class="fp-slogan">${esc(site.slogan)} · 每日学术资讯、科研日程与学术历史。</p></section>`+
   (chips?`<nav class="fp-sections" aria-label="学术新闻栏目">${chips}</nav>`:'')+
   `<div class="fp-grid">`+
    `<div class="fp-stories">${lead?story(lead,'fp-lead'):'<p class="fp-empty">新的资讯正在准备中。</p>'}${secondary.length?`<div class="fp-more">${secondary.map(x=>story(x,'fp-story')).join('')}</div>`:''}<p class="fp-all"><a href="/archive/">全部文章 <span aria-hidden="true">→</span></a></p></div>`+
    `<aside class="fp-side" aria-label="日程与历史">`+
     `<section class="fp-calendar"><h2>科研日历 · 近期日程</h2><ol data-fp-events><li class="fp-loading">正在载入日程…</li></ol><p class="fp-all"><a href="/#/year">进入科研日历 <span aria-hidden="true">→</span></a></p></section>`+
     `<section class="fp-history" data-fp-history hidden><h2 data-fp-history-title>昔日学术</h2><div data-fp-history-items></div><p class="fp-all"><a href="/#/history">浏览历史日历 <span aria-hidden="true">→</span></a></p></section>`+
    `</aside>`+
   `</div>`+
   (projects.length?`<section class="fp-open" aria-label="学术开源"><div class="fp-open-head"><h2>学术开源</h2><a href="/open-source/">全部开源项目 <span aria-hidden="true">→</span></a></div><div class="fp-open-grid">${projects.map(x=>`<a href="${esc(route.openSource(x))}"><strong>${esc(plain(x.title,60))}</strong><span>${esc(plain(x.summary,90))}</span></a>`).join('')}</div></section>`:'')+
  `</div>`;
}
export const frontPageGuard=`<script>if(location.hash&&location.hash!=='#/')document.documentElement.classList.add('route-pending')</script>`;
