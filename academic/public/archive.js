(function(){
  const library=document.querySelector('.archive-library');if(!library)return;
  const input=document.getElementById('archive-search'),form=document.getElementById('archive-search-form'),grid=document.getElementById('archive-grid'),pagination=document.getElementById('archive-pagination'),counter=document.getElementById('archive-result-count');
  const section=library.dataset.archiveSection,size=24,original={grid:grid.innerHTML,pagination:pagination.innerHTML,count:counter.textContent};
  let indexPromise=null,page=1,generation=0,timer;
  const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const courseLabels=c=>!c?'':[{course:'课程',training:'培训',workshop:'工作坊',tutorial:'长期教程',recording:'录播'}[c.format],{free:'免费',paid:'付费',unknown:'费用待核对'}[c.fee],{open:'报名中',upcoming:'尚未开放报名',closed:'报名已结束','not-applicable':'无需报名',unknown:'报名状态待核对'}[c.registration]].filter(Boolean).join(' · ');
  const index=()=>indexPromise||(indexPromise=fetch('/archive-index.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('目录载入失败');return r.json();}).catch(e=>{indexPromise=null;throw e;}));
  function queryLinks(query){for(const a of document.querySelectorAll('[data-filter]')){const url=new URL(a.href);if(query)url.searchParams.set('q',query);else url.searchParams.delete('q');a.href=url.pathname+url.search;}}
  async function search(){
    const current=++generation,query=input.value.trim();queryLinks(query);
    const url=new URL(location.href);if(query){url.searchParams.set('q',query);url.searchParams.set('p',String(page));}else{url.searchParams.delete('q');url.searchParams.delete('p');}history.replaceState(null,'',url);
    if(!query){grid.innerHTML=original.grid;pagination.innerHTML=original.pagination;counter.textContent=original.count;return;}
    counter.textContent='正在检索…';
    try{
      const data=await index();if(current!==generation)return;
      const terms=query.toLocaleLowerCase().split(/\s+/),matches=data.records.filter(x=>(!section||(data.sections.find(s=>s.slug===section)?.members||[section]).includes(x.section))&&terms.every(q=>(x.title+' '+x.summary+' '+x.category+' '+x.dateLabel+' '+courseLabels(x.course)).toLocaleLowerCase().includes(q))),pages=Math.max(1,Math.ceil(matches.length/size));page=Math.min(page,pages);
      const names=Object.fromEntries(data.sections.map(s=>[s.slug,s.name]));
      grid.innerHTML=matches.slice((page-1)*size,page*size).map(x=>'<article class="archive-record" data-section="'+esc(x.section)+'"><a class="archive-card-link" href="'+esc(x.route)+'"><div class="archive-card-top"><span>'+esc(names[x.section])+'</span>'+(x.category&&x.category!==names[x.section]?'<small>'+esc(x.category)+'</small>':'')+'</div><h2>'+esc(x.title)+'</h2><p>'+esc(String(x.summary||'').slice(0,240))+'</p>'+(x.course?'<p>'+esc(courseLabels(x.course))+'</p>':'')+'<footer><time>'+esc(x.dateLabel)+'</time><span aria-hidden="true">↗</span></footer></a></article>').join('')||'<div class="archive-empty"><h2>没有匹配的文章</h2><p>试试缩短关键词，或选择其他分类。</p></div>';
      counter.textContent=matches.length+' 篇匹配 · 第 '+page+' / '+pages+' 页';
      pagination.innerHTML=pages>1?'<nav class="pagination" aria-label="搜索结果分页">'+(page>1?'<button type="button" data-search-page="'+(page-1)+'">上一页</button>':'')+'<span>'+page+' / '+pages+'</span>'+(page<pages?'<button type="button" data-search-page="'+(page+1)+'">下一页</button>':'')+'</nav>':'';
      for(const button of pagination.querySelectorAll('button'))button.onclick=()=>{page=Number(button.dataset.searchPage);search();library.scrollIntoView({block:'start'});};
    }catch(e){if(current===generation)counter.textContent='检索暂不可用，仍可使用左侧分类浏览。';}
  }
  form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);page=1;search();});
  input.addEventListener('input',()=>{clearTimeout(timer);page=1;timer=setTimeout(search,180);});
  const params=new URLSearchParams(location.search),requestedPage=Number(params.get('p'));input.value=params.get('q')||'';page=Number.isSafeInteger(requestedPage)&&requestedPage>0?requestedPage:1;if(input.value)search();
}());
