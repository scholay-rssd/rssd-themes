import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {renderArticle,recordMathHtml} from '../../engine/article-math.mjs';
import {imageSizeMap} from '../../engine/publication-assets.mjs';

// Keep the compatible full export; the interactive calendar uses small,
// content-addressed collections and fetches a notification body only on demand.
export async function writeCalendarData(target,data,articleRoutes={},previousRoot){
  const directory=join(target,'calendar-data');
  await mkdir(directory,{recursive:true});
  const write=async value=>{
    const bytes=JSON.stringify(value),hash=createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(directory,hash+'.json'),bytes);
    return '/calendar-data/'+hash+'.json';
  };
  const year=[];
  for(const {assets,bodyHtml,mathHtml,articleUrl:unusedArticleUrl,...item} of data.year){
    const articleUrl=articleRoutes['year:'+item.id];
    const record={...item,...recordMathHtml(item,['summary',...(!item.sectionId&&!assets?.length?['body']:[])]),...(articleUrl?{articleUrl}:{}),...(item.body&&(item.sectionId||assets?.length)?{bodyHtml:renderArticle(item.body,{imageSizes:await imageSizeMap(assets,previousRoot)})}:{})};
    const {body,bodyTruncated,sourceUrl,reviewedAt,...summary}=item;
    year.push({...summary,...recordMathHtml(item,['summary']),...(articleUrl?{articleUrl}:{}),detailUrl:await write(record)});
  }
  const history=data.history.map(({assets,bodyHtml,mathHtml,articleUrl:unusedArticleUrl,...item})=>({...item,...recordMathHtml(item,['factSummary','historicalSignificance']),...(articleRoutes['history:'+item.id]?{articleUrl:articleRoutes['history:'+item.id]}:{})}));
  const manifest={version:1,year:await write(year),history:await write(history)};
  await writeFile(join(target,'calendar-index.json'),JSON.stringify(manifest));
  return manifest;
}
