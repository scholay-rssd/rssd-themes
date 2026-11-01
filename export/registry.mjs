import {readFileSync} from 'node:fs';
// Web export templates are independent of desktop note-card/WeChat templates.
// Every entry owns a stable site + section + output identity.
const designs={
 'scholay-today':{paper:'#f8f5ed',ink:'#172b28',family:'serif',sections:{briefings:['#23634e','dispatch'],observations:['#6a473b','essay'],calendar:['#315d78','ledger'],history:['#79643e','archive'],resources:['#536938','guide'],'open-source':['#325f6c','technical'],collaboration:['#734d56','ledger'],courses:['#4c5276','guide']}},
 metho:{paper:'#f5f4ef',ink:'#203b3c',family:'sans',sections:{methods:['#35695f','guide'],statistics:['#365b82','ledger'],experiments:['#a55737','technical'],frontiers:['#60558a','dispatch']}},
 enter:{paper:'#f7f7f2',ink:'#283d37',family:'sans',sections:{forums:['#4e705b','dispatch'],software:['#3f7181','technical'],search:['#78723b','guide'],courses:['#645b84','ledger']}},
 legis:{paper:'#f8f6f2',ink:'#342e2c',family:'serif',sections:{frontiers:['#784942','dispatch'],cases:['#665a40','essay'],ip:['#42656d','technical'],regulations:['#4c596b','ledger']}},
 xsiching:{paper:'#f4eddf',ink:'#382f28',family:'serif',sections:{classics:['#7a4b36','archive'],interpretations:['#5d6440','essay'],applications:['#3c6266','guide'],courses:['#79613e','ledger']}},
 study:{paper:'#f4f6f5',ink:'#233936',family:'sans',sections:{courses:['#366954','guide'],models:['#3c5d8a','ledger'],offers:['#9a6134','dispatch'],certificates:['#6a537a','archive']}},
 lingxi:{paper:'#f3f5f7',ink:'#26343e',family:'sans',sections:{tutorials:['#32667e','guide'],development:['#4f617f','technical'],'input-schemes':['#536e50','ledger'],'input-skins':['#82617f','gallery'],archive:['#5a6a7d','essay'],calendar:['#486e7c','ledger'],history:['#6f6783','archive'],'open-source':['#487565','technical']}},
 piggytuck:{paper:'#fff5ed',ink:'#4a3633',family:'sans',sections:{works:['#a65d68','gallery'],'design-news':['#9a663e','dispatch'],icons:['#557b71','ledger'],'web-design':['#766093','technical'],archive:['#875d62','essay'],calendar:['#9b6039','ledger'],history:['#80634f','archive'],'open-source':['#49796f','technical']}},
 personal:{paper:'#f8f7f3',ink:'#303a3a',family:'sans',sections:{works:['#436d70','gallery'],'product-news':['#906e42','dispatch'],reflections:['#77614e','essay'],'academic-notes':['#5d6586','archive'],archive:['#65685f','essay'],calendar:['#7a704e','ledger'],history:['#5d717a','archive'],'open-source':['#55795c','guide']}},
 pets:{paper:'#fbf7ef',ink:'#423c2f',family:'sans',sections:{'pet-news':['#89723c','dispatch'],'daily-cat':['#a36753','gallery'],'daily-dog':['#537c61','guide'],'exotic-pets':['#6b6388','archive'],archive:['#8b614b','essay'],calendar:['#86663a','ledger'],history:['#79664e','archive'],'open-source':['#52735d','guide']}},
};
// Explicit legacy record categories remain readable even when no current
// production column writes to them. They own templates too.
const legacySections={
 lingxi:{'input-methods':['#44697d','technical'],'custom-keyboards':['#79634e','gallery']},
 personal:{'keyboard-projects':['#7d654c','gallery'],'input-method-projects':['#496b7a','technical'],'website-projects':['#556d60','technical'],'open-tools':['#65638b','guide'],'academic-sites':['#516c83','archive']},
 'scholay-today':{archive:['#526957','essay'],intelligence:['#3e6575','dispatch']},
 metho:{archive:['#546a64','essay'],calendar:['#456978','ledger'],history:['#796b52','archive'],'open-source':['#4f7365','technical']},
 enter:{archive:['#5c7060','essay'],calendar:['#56717d','ledger'],history:['#7b6c52','archive'],'open-source':['#4f776e','technical']},
 legis:{archive:['#6d6256','essay'],calendar:['#536779','ledger'],history:['#80634e','archive'],'open-source':['#496e6c','technical']},
 xsiching:{archive:['#7b6450','essay'],calendar:['#746846','ledger'],history:['#80604a','archive'],'open-source':['#526951','guide']},
 study:{archive:['#57695b','essay'],calendar:['#4e7080','ledger'],history:['#766957','archive'],'open-source':['#4d7460','guide']},
};
for(const [site,sections] of Object.entries(legacySections))Object.assign(designs[site].sections,sections);
export const exportDesigns=Object.freeze(designs);
const templates=new Map();
for(const [site,design] of Object.entries(designs))for(const section of Object.keys(design.sections)){
 const record=JSON.parse(readFileSync(new URL(`./templates/${site}/${section}.json`,import.meta.url),'utf8'));
 if(record.siteId!==site||record.sectionId!==section||!record.article||!record.pages)throw Error('Invalid authored article template: '+site+':'+section);
 templates.set(site+':'+section,record);
}
export function exportTemplate({siteId,workspaceId,sectionId,sectionName,format}){
 if(!['pages','wechat'].includes(format))throw Error('Unknown export format');
 const record=templates.get(siteId+':'+sectionId);
 // Synthetic demo sites may exercise arbitrary categories. Production never
 // chooses a random or unrelated template for an unregistered category.
 if(!record&&!siteId.startsWith('demo-'))throw Error('Missing article template: '+siteId+':'+sectionId);
 const selected=record||templates.get('metho:methods');
 return {version:2,id:[siteId,sectionId,format].join(':'),siteId,workspaceId,sectionId,sectionName,format,
  ...structuredClone(selected[format==='wechat'?'article':'pages'])};
}
