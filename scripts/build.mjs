import {mkdir,readFile,copyFile} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const compatibility=JSON.parse(await readFile(join(root,'compatibility.json'),'utf8'));
if(!/^[a-f0-9]{40}$/.test(compatibility.core))throw Error('The public engine must be pinned to a full commit');
const assembly=join(root,'.local/build',randomUUID());
await mkdir(assembly,{recursive:true});
function run(command,args,cwd=assembly){const result=spawnSync(command,args,{cwd,stdio:'inherit',env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});if(result.error)throw result.error;if(result.status!==0)throw Error(command+' failed');}
run('git',['init','-q']);run('git',['config','core.autocrlf','false']);
run('git',['remote','add','origin','https://github.com/scholay-rssd/rssd.git']);
run('git',['fetch','--depth=1','origin',compatibility.core]);run('git',['checkout','-q','--detach','FETCH_HEAD']);
run('git',['submodule','update','--init','sites','web/themes','web/demo']);
const slots={themes:'web/themes',sites:'sites',examples:'web/demo'},slot=slots[compatibility.product];
if(!slot)throw Error('Unknown RSSD product');
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
for(const file of files){const destination=join(assembly,slot,file);await mkdir(dirname(destination),{recursive:true});await copyFile(join(root,file),destination);}
// Run npm through its JS entry point, avoiding shell quoting on Windows.
const npm=process.env.npm_execpath||join(dirname(process.execPath),process.platform==='win32'?'node_modules/npm/bin/npm-cli.js':'../lib/node_modules/npm/bin/npm-cli.js');
run(process.execPath,[npm,'ci','--no-audit','--no-fund']);
run(process.execPath,['--input-type=module','-e',"import {profiles,validateSite} from './scripts/site-config.mjs'; for(const site of profiles)validateSite(site); console.log('Validated '+profiles.length+' sites');"]);
run(process.execPath,['scripts/build-demo.mjs']);
if(compatibility.product==='themes'&&process.argv.includes('--homepages')){
  run(process.execPath,[npm,'run','theme:install:personal']);
  for(const site of ['piggytuck','personal'])run(process.execPath,[npm,'run','theme:build','--',site]);
}
await mkdir(join(root,'.local'),{recursive:true});
const {writeFile}=await import('node:fs/promises');
await writeFile(join(root,'.local/latest-build.txt'),assembly+'\n');
console.log(JSON.stringify({product:compatibility.product,core:compatibility.core,assembly,output:join(assembly,'.local/demo')}));
