// CSS-only adaptations. Keep the publication engine and authored homepages intact.
// `skin` names web/themes/journal/skins/<skin>.css: a site's own look, loaded last.
// `structures` opts a site into reusable page structures (../structures.mjs).
import {STRUCTURES} from '../structures.mjs';
export const BLOG_THEMES = Object.freeze({
  papermod: {name:'PaperMod',repository:'https://github.com/adityatelange/hugo-PaperMod'},
  bear: {name:'Hugo Bear Blog',repository:'https://github.com/janraasch/hugo-bearblog'},
  archie: {name:'Archie',repository:'https://github.com/athul/archie'},
  xmin: {name:'XMin',repository:'https://github.com/yihui/hugo-xmin'},
});
export const BLOG_SITES = Object.freeze({
  lingxi: {theme:'papermod',label:'INPUT & IDEAS',mark:'犀',heading:'输入之间',color:'#385b49',structures:['toc','neighbors']},
  piggytuck: {theme:'archie',label:'DESIGN NOTEBOOK',mark:'猪',heading:'创作手记',color:'#3949ac',structures:['image-rows','wide-figures']},
  personal: {theme:'bear',label:'A PERSONAL JOURNAL',mark:'海',heading:'最近写下的',color:'#376c68',structures:['post-meta','reading-progress','neighbors']},
  pets: {theme:'bear',label:'LITTLE COMPANIONS',mark:'伴',heading:'共同生活的小事',color:'#855434',structures:['infobox','see-also']},
  legis: {theme:'xmin',label:'LAW & SOCIETY',mark:'法',heading:'法律观察',color:'#46596e',structures:['fact-sheet','citations','toc']},
  metho: {theme:'archie',label:'METHODS & PRACTICE',mark:'研',heading:'方法与发现',color:'#316b5c',structures:['byline','wide-figures','appendix'],searchTitle:'研究方法｜研究设计、统计分析与实验实践',description:'面向研究者的研究方法学习与实践指南，涵盖研究设计、统计分析、实验复现与方法前沿，通过概念讲解、可复算示例和资料链接理解证据。'},
  enter: {theme:'archie',label:'AN OPEN NOTEBOOK',mark:'知',heading:'探索与记录',color:'#405e8b',structures:['link-directory','source-action'],searchTitle:'学术之门｜科研软件、文献检索与课程资源',description:'面向研究者的学术资源导航与使用指南，整理学术论坛、科研软件、文献检索和课程资源，提供工具介绍、操作步骤与官方入口。'},
  xsiching: {theme:'xmin',label:'读书 · 观象 · 明理',mark:'易',heading:'案头新读',color:'#8a4437',structures:['epigraph','title-seal','toc']},
  study: {theme:'papermod',label:'LEARN & EXPLORE',mark:'学',heading:'学习新知',color:'#536247',structures:['tables','neighbors']},
});
// Local Demo variants (web/demo/) reuse the same four styles; never deployed.
export const DEMO_BLOG_SITES = Object.freeze(Object.fromEntries([
  ['demo-papermod','papermod'],['demo-archie','archie'],['demo-xmin','xmin'],['demo-bear','bear'],['demo-showcase','archie'],
  ['demo-docs','papermod'],['demo-encyclopedia','bear'],['demo-portfolio','archie'],['demo-personal','bear'],
].map(([id,theme])=>[id,{theme,label:'THEME UNIT TEST',mark:'演',heading:'最近发布',color:'#2b6e52',structures:Object.keys(STRUCTURES)}])));
export const SKINNED_SITES = Object.freeze(['metho','enter','study','legis','xsiching','lingxi','pets','personal']);
export function blogPreset(site) {
  const real=site.id.startsWith('demo-skin-')&&BLOG_SITES[site.id.slice(10)];
  if(real)return {...real,...BLOG_THEMES[real.theme],id:real.theme,skin:site.id.slice(10)};
  const preset=BLOG_SITES[site.id]||DEMO_BLOG_SITES[site.id]||{theme:'bear',label:site.domain,mark:site.name.slice(0,1),heading:'最近记录',color:site.accent};
  return {...preset,...BLOG_THEMES[preset.theme],id:preset.theme,...(SKINNED_SITES.includes(site.id)?{skin:site.id}:{})};
}
export function blogExcerpt(record) {
  const text=String(record.summary||record.factSummary||'').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]*>/g,'').replace(/[#*_`>]/g,'').replace(/\s+/g,' ').trim();
  const chars=Array.from(text);
  return chars.length>180?chars.slice(0,180).join('')+'…':text;
}
