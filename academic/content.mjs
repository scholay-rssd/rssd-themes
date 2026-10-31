import {adaptPublishedSnapshot} from '../../engine/published-content.mjs';
import {validatePublishedContent} from '../../../contracts/published-content.mjs';
import {archiveSections,archiveSection,isVerified} from '../../../scripts/archive-model.mjs';
import {sourceKey} from '../../../admin/model.mjs';
const publicUrl=value=>{try{return /^https?:$/.test(new URL(value).protocol);}catch{return false;}};
// Preserve the academic site's existing publication eligibility and named
// archive routes. Unverified entries remain in its original calendar JSON;
// they are not advertised as canonical articles that do not exist.
export function adaptAcademicSnapshot(snapshot,site){
 const selected={...snapshot,data:{...snapshot.data,year:snapshot.data.year.filter(x=>x.sectionId||isVerified(x)),history:snapshot.data.history.filter(x=>(x.sources||[]).some(s=>publicUrl(s.url)))},openSource:{...snapshot.openSource,items:snapshot.openSource.items.filter(x=>publicUrl(x.url))}};
 const document=adaptPublishedSnapshot(selected,site);
 const originals=new Map([
  ...(selected.news||[]).map(x=>[sourceKey('news',x),x]),
  ...selected.data.year.map(x=>[sourceKey('year',x),x]),
  ...selected.data.history.map(x=>[sourceKey('history',x),x]),
  ...selected.openSource.items.map(x=>[sourceKey('openSource',x),x]),
 ]);
 return validatePublishedContent({...document,
  collections:[...archiveSections.map(x=>({id:x.slug,name:x.name,route:'/archive/'+x.slug+'/'})),...document.collections.filter(c=>document.records.some(r=>r.sectionId===c.id)&&!archiveSections.some(x=>x.slug===c.id))],
  records:document.records.map(x=>{
   // The two calendars and news categories are views of the same atomic records.
   // Older historical manuscripts used observations; project their type without rewriting SQLite.
   const eventSection=x.legacy.kind==='year'?'calendar':x.legacy.kind==='history'?'history':null;
   return {...x,...(eventSection&&x.sectionId?{sectionId:eventSection}:{}),collectionId:eventSection||x.sectionId||archiveSection(x.legacy.kind,originals.get(x.id)).slug};
  }),
 });
}
