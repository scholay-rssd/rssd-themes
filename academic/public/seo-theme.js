(function(){
  var root=document.documentElement,media=window.matchMedia('(prefers-color-scheme: dark)'),preference='system';
  try{preference=localStorage.getItem('scholay-today.theme')||'system';}catch(_){}
  function apply(){
    var dark=preference==='dark'||(preference==='system'&&media.matches);root.dataset.theme=dark?'dark':'light';
    var button=document.getElementById('theme-toggle');
    if(button){button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label','当前为'+(dark?'深色':'浅色')+'模式，切换为'+(dark?'浅色':'深色')+'模式');button.querySelector('.theme-toggle-glyph').textContent=dark?'☀':'☾';button.querySelector('.theme-toggle-label').textContent=dark?'深色':'浅色';}
    var color=document.querySelector('meta[name="theme-color"]');if(color)color.content=dark?'#111213':'#f7f5ef';
  }
  apply();document.addEventListener('DOMContentLoaded',function(){apply();document.getElementById('theme-toggle').addEventListener('click',function(){preference=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('scholay-today.theme',preference);}catch(_){}apply();});});
  media.addEventListener('change',function(){if(preference==='system')apply();});
}());

// Discussion metadata is independent of article snapshots and RSS contents.
if(/^\/(?:news|calendar|history|open-source)\/.+\/$/.test(location.pathname)){
  document.addEventListener('DOMContentLoaded',function(){
    var script=document.createElement('script');script.src='/community/discussion-links.v1.js';script.defer=true;document.head.appendChild(script);
  });
}
