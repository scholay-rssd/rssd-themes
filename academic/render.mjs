import {clarityScript} from '../../engine/site-services.mjs';
import {mkdir,cp,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {buildSeoSite} from './build-seo.mjs';
import {digest} from '../../../admin/model.mjs';
import {byteHash} from '../../engine/theme-homepage.mjs';
import {renderDisplayModules} from '../../modules/registry.mjs';
import {archiveSections} from '../../../scripts/archive-model.mjs';
import {escapeHtml as esc} from '../../modules/shared.mjs';
import {renderArticle,recordMathHtml} from '../../engine/article-math.mjs';
import {imageSizeMap} from '../../engine/publication-assets.mjs';
import {writeCalendarData} from './calendar-data.mjs';
import {optimizeEntry} from './entry-hints.mjs';
import {addSocialMetadata} from '../../engine/social-metadata.mjs';
import {familyFooter,familyIconEntries} from '../../engine/site-family.mjs';
export const publicFiles=['reference.css','index.html','styles.css','atlas.css','open-source.css','calendar-workspace.css','theme.css','seo.css','seo-theme.js','archive.js','app.js','calendar-model.js','calendar-data.js','scholay-logo.png','social-preview.png','favicon.ico','BingSiteAuth.xml','googlec9da0a94ddf2a20d.html'];
async function listPublicAssets(root,prefix=''){const files=[];for(const e of await readdir(join(root,prefix),{withFileTypes:true})){const path=prefix+e.name;if(e.isDirectory())files.push(...await listPublicAssets(root,path+'/'));else if(e.isFile())files.push(path);else throw Error('Unexpected academic asset type');}return files;}
export async function renderAcademic({job,source,target,previousRoot,now,site,theme,content}){
  const display=await renderDisplayModules({site,content,now});
  if(display.config.modules.calendar.enabled&&display.config.modules.calendar.collections?.length)throw Error('Academic compatibility calendar preserves all original collections; collection filters require the standalone calendar');
  await mkdir(target,{recursive:true});
  const assets=join(source,theme.publicDirectory);
  for(const file of publicFiles)await cp(join(assets,file),join(target,file));
  for(const icon of familyIconEntries(source)){await mkdir(join(target,'family'),{recursive:true});await cp(icon.file,join(target,'family',icon.id+'.png'));}
  {const index=join(target,'index.html');await writeFile(index,(await readFile(index,'utf8')).replace('<!-- site-family -->',familyFooter(site.id)));}
  await cp(join(assets,'fonts'),join(target,'fonts'),{recursive:true});
  await writeFile(join(target,'data.json'),JSON.stringify(job.snapshot.data));
  await writeFile(join(target,'open-source.json'),JSON.stringify(job.snapshot.openSource));
  await writeFile(join(target,'news.json'),JSON.stringify({items:job.snapshot.news||[]}));
  await writeFile(join(target,'permalinks.json'),JSON.stringify(job.snapshot.permalinks));
  const seo=await buildSeoSite({root:target,output:join(target,'.seo'),previousRoot,now,publicContent:content,site});
  await cp(join(target,'.seo'),target,{recursive:true,preserveTimestamps:true});await rm(join(target,'.seo'),{recursive:true});
  // Structured record images are separate public files. Do not load base64
  // blobs into the calendar client's initial JSON or change DB snapshots.
  const withoutAssets=items=>items.map(({assets,...item})=>item);
  // Only the publisher produces this HTML. Never forward a supplied bodyHtml;
  // legacy plain-text notifications retain their original whitespace behavior.
  const calendarItems=[];
  for(const {assets,bodyHtml,mathHtml,...item} of job.snapshot.data.year)calendarItems.push({...item,...recordMathHtml(item,['summary',...(!item.sectionId&&!assets?.length?['body']:[])]),...(item.body&&(item.sectionId||assets?.length)?{bodyHtml:renderArticle(item.body,{imageSizes:await imageSizeMap(assets,previousRoot)})}:{})});
  await writeFile(join(target,'data.json'),JSON.stringify({...job.snapshot.data,year:calendarItems,history:withoutAssets(job.snapshot.data.history).map(({mathHtml,...item})=>({...item,...recordMathHtml(item,['factSummary','historicalSignificance'])}))}));
  await writeFile(join(target,'open-source.json'),JSON.stringify({...job.snapshot.openSource,items:withoutAssets(job.snapshot.openSource.items).map(({mathHtml,...item})=>({...item,...recordMathHtml(item,['summary','value'])}))}));
  const calendar=await writeCalendarData(target,job.snapshot.data,Object.fromEntries(content.records.map(r=>[r.id,r.route])),previousRoot);
  await optimizeEntry(target,calendar);
  const hashes={};for(const file of ['data.json','open-source.json','content-catalog.json','archive-index.json','archive.js','seo-theme.js','index.html','sitemap.xml','robots.txt','content-feed.xml','rss-entry-state.json',...seo.rssFiles,...seo.mathFiles,...seo.sitemapFiles,...content.records.filter(r=>r.legacy.kind==='news').map(r=>r.route.slice(1)+'index.html'),'news/index.html','archive/index.html',...archiveSections.map(x=>'archive/'+x.slug+'/index.html')])hashes[file]=digest(await readFile(join(target,file),'utf8'));
  for(const file of ['calendar-index.json',calendar.year.slice(1),calendar.history.slice(1)])hashes[file]=digest(await readFile(join(target,file),'utf8'));
  await rm(join(target,'news.json'),{force:true});
  await writeFile(join(target,'published-content.json'),JSON.stringify(content));
  hashes['published-content.json']=digest(await readFile(join(target,'published-content.json'),'utf8'));
  // The academic homepage keeps its authored calendar layout. Its legacy hash
  // routes remain readable lists when the same site-level module is disabled.
  if(!display.config.modules.calendar.enabled){
    const index=join(target,'index.html');
    await writeFile(index,(await readFile(index,'utf8')).replace('<html lang="zh-CN">','<html lang="zh-CN" data-calendar-enabled="false">'));
    hashes['index.html']=digest(await readFile(index,'utf8'));
  }
  // Non-calendar modules use the same read-only interface on this Theme too.
  for(const page of display.pages.filter(x=>x.id!=='calendar')){
    const files={...page.files,[page.route.slice(1)+'index.html']:`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(page.title)} · ${esc(site.name)}</title><link rel="canonical" href="${esc(site.origin+page.route)}">${clarityScript(site)}<link rel="stylesheet" href="/styles.css">${page.styles.map(url=>`<link rel="stylesheet" href="${url}">`).join('')}</head><body><header class="wrap"><a href="/">${esc(site.name)}</a> · <a href="/archive/">全部文章</a></header><main class="wrap">${page.body}</main><footer class="site-footer"><div class="wrap">${familyFooter(site.id)}</div></footer>${page.scripts.map(src=>`<script type="module" src="${src}"></script>`).join('')}</body></html>`};
    for(const [path,value] of Object.entries(files)){const bytes=path.endsWith('.html')?addSocialMetadata(value,{site,route:page.route}):value;await mkdir(dirname(join(target,path)),{recursive:true});await writeFile(join(target,path),bytes);hashes[path]=digest(await readFile(join(target,path)));}
  }
  const extraPages=display.pages.filter(x=>x.id!=='calendar');
  if(extraPages.length){
    const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+extraPages.map(p=>`<url><loc>${esc(site.origin+p.route)}</loc></url>`).join('')+'</urlset>';
    await writeFile(join(target,'sitemap-display.xml'),xml);hashes['sitemap-display.xml']=digest(xml);
    const sitemap=(await readFile(join(target,'sitemap.xml'),'utf8')).replace('</sitemapindex>',`<sitemap><loc>${esc(site.origin)}/sitemap-display.xml</loc></sitemap></sitemapindex>`);
    await writeFile(join(target,'sitemap.xml'),sitemap);hashes['sitemap.xml']=digest(sitemap);
  }
  const byteHashes={};for(const file of [...await listPublicAssets(assets),...seo.mathFiles])byteHashes[file]=byteHash(await readFile(join(target,file)));
  const manifest={siteId:site.id,theme:{id:theme.id,interfaceVersion:theme.interfaceVersion},contentVersion:content.version,display:{version:1,modules:display.config.modules,calendarRenderer:'academic-compat'},byteHashes,release:'admin-'+job.id,jobId:job.id,snapshotHash:job.snapshot_hash,created:new Date(now).toISOString(),counts:seo.counts,hashes};
  await writeFile(join(target,'release.json'),JSON.stringify(manifest));return manifest;
}
