// Themes consume published-content v1. They never fetch RSS, generate text,
// modify manuscripts, or decide whether something should be published.
const common={interfaceVersion:1,contentVersion:1,renderer:'journal-v1'};
export const THEMES={
 'academic':{...common,id:'academic',name:'学术资讯',renderer:'academic-v1',contentAdapter:'academic-v1',publicDirectory:'web/themes/academic/public'},
 'portfolio':{...common,id:'portfolio',name:'视觉作品集',homeEyebrow:'创作与视觉表达',latestHeading:'设计手记',homepage:{builder:'static',directory:'web/themes/portfolio/homepage'}},
 'personal':{...common,id:'personal',name:'个人主页',homeEyebrow:'个人记录与产品实践',latestHeading:'最近手记',homepage:{builder:'next-export',directory:'web/themes/personal/homepage'}},
 'journal':{...common,id:'journal',name:'记录',homeEyebrow:'日常记录',latestHeading:'最近记录'},
 'docs':{...common,id:'docs',name:'技术文档',homeEyebrow:'项目文档与记录',latestHeading:'最近更新'},
 'encyclopedia':{...common,id:'encyclopedia',name:'百科',homeEyebrow:'动物知识与生活记录',latestHeading:'最近收录'},
};
export function themeForSite(site){return THEMES[site.themeId||({'scholay-today':'academic',lingxi:'docs',pets:'encyclopedia'}[site.id])||'journal'];}
export function resolveTheme(site,document){
 const theme=themeForSite(site);
 if(!theme||theme.contentVersion!==document.version)throw Error('Unsupported Theme or content version');
 if(document.siteId!==site.id)throw Error('Theme content belongs to another site');
 return theme;
}
