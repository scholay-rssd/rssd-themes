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
export const exportDesigns=Object.freeze(designs);
export function exportTemplate({siteId,workspaceId,sectionId,sectionName,format}){
 if(!['pages','wechat'].includes(format))throw Error('Unknown export format');
 const design=designs[siteId]||{paper:'#f6f5ef',ink:'#263832',family:'sans',sections:{}};
 const entry=design.sections[sectionId];
 const seed=[...sectionId].reduce((n,c)=>(n*31+c.codePointAt(0))>>>0,0);
 const palette=['#35695f','#785544','#405f83','#6f5a80','#776337'];
 const [accent,layout]=entry||[palette[seed%palette.length],['guide','essay','ledger','archive','dispatch'][seed%5]];
 return {version:1,id:[siteId,sectionId,format].join(':'),siteId,workspaceId,sectionId,sectionName,format,
  paper:format==='wechat'?'#ffffff':design.paper,ink:design.ink,accent,family:design.family,layout,
  width:720,height:960,fontSize:layout==='essay'||layout==='archive'?27:26,lineHeight:1.65};
}
