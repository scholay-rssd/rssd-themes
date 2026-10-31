import {readFile,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const stampable=/\.(?:css|js|png|ico|webp|svg)$/;
const hashOf=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,10);
const exists=async path=>{try{return (await stat(path)).isFile();}catch{return false;}};

// The calendar used to wait on a chain: app.js, then its modules, then the
// manifest, then the year data. Preloading starts all of them with the page,
// and a content stamp lets the server cache each entry asset for a year.
export async function optimizeEntry(target,{year}){
  const file=join(target,'index.html');
  let html=await readFile(file,'utf8');
  const stamps=new Map();
  for(const [,path] of html.matchAll(/(?:href|src)="\/([^"?#]+)(?:\?[^"#]*)?"/g)){
    if(stamps.has(path)||!stampable.test(path)||path.includes('..')||!await exists(join(target,path)))continue;
    stamps.set(path,hashOf(await readFile(join(target,path))));
  }
  html=html.replace(/((?:href|src)=")\/([^"?#]+)(?:\?[^"#]*)?"/g,(match,attr,path)=>stamps.has(path)?attr+'/'+path+'?h='+stamps.get(path)+'"':match);
  // Module preloads must name the exact specifier app.js imports, or the
  // browser fetches the module twice.
  const app=await readFile(join(target,'app.js'),'utf8');
  const modules=[...new Set([...app.matchAll(/^import\s[^;]*?from\s*'\.\/([^']+)'/gm)].map(m=>'/'+m[1]))];
  const hints=[
    '<link rel="preload" href="/calendar-index.json" as="fetch" crossorigin>',
    ...(/^\/calendar-data\/[a-f0-9]{64}\.json$/.test(year||'')?['<link rel="preload" href="'+year+'" as="fetch" crossorigin>']:[]),
    ...modules.map(href=>'<link rel="modulepreload" href="'+href+'">'),
  ].filter(hint=>!html.includes(hint));
  const anchor=html.indexOf('<link rel="stylesheet"');
  if(hints.length&&anchor>=0)html=html.slice(0,anchor)+hints.join('\n')+'\n'+html.slice(anchor);
  await writeFile(file,html);
  return {stamped:stamps.size,hints:hints.length};
}
