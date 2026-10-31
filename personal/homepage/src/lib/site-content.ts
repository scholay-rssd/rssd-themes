export const languages = ['zh', 'en', 'ja', 'fr', 'es'] as const;
export type Locale = (typeof languages)[number];
export const isLocale = (value: string): value is Locale => languages.includes(value as Locale);
export const localeLabels: Record<Locale, string> = { zh: '中文', en: 'English', ja: '日本語', fr: 'Français', es: 'Español' };

type Copy = {
  nav: [string, string, string]; eyebrow: string; role: string; intro: string; slogan: string;
  explore: string; workEyebrow: string; workTitle: string; workIntro: string;
  projectLink: string; connectEyebrow: string; connectTitle: string; connectIntro: string;
  aboutEyebrow: string; aboutTitle: string; aboutText: string; footer: string;
  projects: [string, string, string, string, string];
};

export const copy: Record<Locale, Copy> = {
  zh: {
    nav: ['项目', '关于', '找到我'], eyebrow: '学术 · 产品 · 开放构建', role: 'Scholay 产品经理',
    intro: '我是学术海，一个搞学术的软件产品经理。关注研究者怎样寻找、组织、表达知识，也喜欢把想法做成真正能用的工具。',
    slogan: '学海无涯，以道驭术', explore: '看看我在做什么',
    workEyebrow: 'SELECTED WORK / 正在维护', workTitle: '把好奇心，做成工具。', workIntro: '这些项目围绕研究、写作与日常知识工作持续生长。', projectLink: '查看项目',
    connectEyebrow: 'ELSEWHERE / 其他地方', connectTitle: '在不同地方，继续聊。', connectIntro: '产品、学术和日常思考，散落在这些平台。',
    aboutEyebrow: 'ABOUT / 关于', aboutTitle: '为好奇的人，做更好的工具。', aboutText: '我在 Scholay 做产品，也维护开源项目。这个站点是我整理项目、记录想法、与同行相遇的地方。', footer: '保持好奇，保持联系。',
    projects: ['从科研日程、学术史到桌面 RSS 与 AI 辅助阅读，整理每天值得关注的学术信息。', '基于 RIME 的多平台灵犀输入法，连接日常输入、Buffer 工作台与个人知识管理。', 'Scholay 维护的开放学术 AI 技能。', 'Scholay 的学术产品知识与使用文档。', '连接论文检索、文献管理、LaTeX 写作与投稿前检查的在线学术研究平台。'],
  },
  en: {
    nav: ['Work', 'About', 'Connect'], eyebrow: 'RESEARCH · PRODUCT · OPEN BUILDING', role: 'Product Manager at Scholay',
    intro: 'I’m Xueshuhai, a software product manager working in academia. I care about how researchers find, organize, and express knowledge—and about making useful tools from curious ideas.',
    slogan: 'An endless sea of learning. Principles guide practice.', explore: 'Explore my work',
    workEyebrow: 'SELECTED WORK', workTitle: 'Tools for curious minds.', workIntro: 'Projects growing around research, writing, and everyday knowledge work.', projectLink: 'View project',
    connectEyebrow: 'ELSEWHERE', connectTitle: 'Let’s keep talking.', connectIntro: 'Find my notes on products, research, and life across these platforms.',
    aboutEyebrow: 'ABOUT', aboutTitle: 'Better tools for curious people.', aboutText: 'I build products at Scholay and maintain open source projects. This is a home for my work, ideas, and conversations with fellow travelers.', footer: 'Stay curious. Stay connected.',
    projects: ['Research calendars, academic history, and a desktop reader for RSS and AI-assisted reading.', 'Lingxi IME: a multi-platform input method built on RIME, with a Buffer workbench and personal knowledge tools.', 'Open academic AI skills maintained by Scholay.', 'Scholay product knowledge and documentation.', 'An online research platform for paper discovery, reference management, LaTeX writing, and pre-submission checks.'],
  },
  ja: {
    nav: ['プロジェクト', '自己紹介', 'つながる'], eyebrow: '研究 · プロダクト · オープンな開発', role: 'Scholay プロダクトマネージャー',
    intro: '学術海です。学術分野のソフトウェアプロダクトマネージャーとして、研究者が知識を探し、整理し、表現する方法を考え、好奇心から生まれたアイデアを道具にしています。',
    slogan: '学びの海は果てしなく、道理が技を導く。', explore: 'プロジェクトを見る',
    workEyebrow: 'SELECTED WORK / プロジェクト', workTitle: '好奇心を、道具に。', workIntro: '研究、執筆、日々の知的作業を支えるプロジェクトです。', projectLink: 'プロジェクトを見る',
    connectEyebrow: 'ELSEWHERE / ほかの場所', connectTitle: 'どこかで、また話しましょう。', connectIntro: 'プロダクト、研究、日常についての記録はこちらから。',
    aboutEyebrow: 'ABOUT / 自己紹介', aboutTitle: '好奇心を持つ人のために。', aboutText: 'Scholay でプロダクトを作り、オープンソースのプロジェクトを維持しています。ここは仕事や考えをまとめ、仲間と出会う場所です。', footer: '好奇心を忘れずに。',
    projects: ['研究カレンダー、学術史、RSS と AI 支援読書のデスクトップリーダー。', 'RIME を基盤とするマルチプラットフォーム入力メソッド。Buffer と個人知識管理をつなぎます。', 'Scholay が維持するオープンな学術 AI スキル。', 'Scholay のプロダクト知識とドキュメント。', '論文検索、文献管理、LaTeX 執筆、投稿前チェックをつなぐオンライン研究プラットフォーム。'],
  },
  fr: {
    nav: ['Projets', 'À propos', 'Contact'], eyebrow: 'RECHERCHE · PRODUIT · OPEN SOURCE', role: 'Product manager chez Scholay',
    intro: 'Je suis Xueshuhai, product manager de logiciels pour le monde académique. Je m’intéresse à la façon dont les chercheurs trouvent, organisent et expriment le savoir, et je transforme ces idées en outils utiles.',
    slogan: 'Un océan de savoir, des principes pour guider la pratique.', explore: 'Découvrir mes projets',
    workEyebrow: 'SELECTED WORK / PROJETS', workTitle: 'Des outils pour les curieux.', workIntro: 'Des projets pour la recherche, l’écriture et le travail intellectuel quotidien.', projectLink: 'Voir le projet',
    connectEyebrow: 'ELSEWHERE / AILLEURS', connectTitle: 'Continuons la conversation.', connectIntro: 'Retrouvez mes réflexions sur les produits, la recherche et le quotidien.',
    aboutEyebrow: 'ABOUT / À PROPOS', aboutTitle: 'De meilleurs outils pour les curieux.', aboutText: 'Je conçois des produits chez Scholay et maintiens des projets open source. Ce site rassemble mes projets et mes idées.', footer: 'Restons curieux. Restons en contact.',
    projects: ['Calendriers de recherche, histoire académique et lecteur RSS avec lecture assistée par IA.', 'Lingxi IME, une méthode de saisie multiplateforme basée sur RIME, avec Buffer et gestion des connaissances.', 'Des compétences IA ouvertes pour le monde académique, maintenues par Scholay.', 'Les connaissances produit et la documentation de Scholay.', 'Une plateforme de recherche en ligne pour trouver des articles, gérer les références, écrire en LaTeX et préparer une soumission.'],
  },
  es: {
    nav: ['Proyectos', 'Sobre mí', 'Contacto'], eyebrow: 'INVESTIGACIÓN · PRODUCTO · CÓDIGO ABIERTO', role: 'Product manager en Scholay',
    intro: 'Soy Xueshuhai, product manager de software para el mundo académico. Me interesa cómo los investigadores encuentran, organizan y expresan el conocimiento, y convertir ideas curiosas en herramientas útiles.',
    slogan: 'Un mar de aprendizaje; los principios guían la práctica.', explore: 'Explorar proyectos',
    workEyebrow: 'SELECTED WORK / PROYECTOS', workTitle: 'Herramientas para la curiosidad.', workIntro: 'Proyectos para investigar, escribir y trabajar con conocimiento cada día.', projectLink: 'Ver proyecto',
    connectEyebrow: 'ELSEWHERE / EN OTROS LUGARES', connectTitle: 'Sigamos conversando.', connectIntro: 'Ideas sobre productos, investigación y vida cotidiana en estas plataformas.',
    aboutEyebrow: 'ABOUT / SOBRE MÍ', aboutTitle: 'Mejores herramientas para gente curiosa.', aboutText: 'Diseño productos en Scholay y mantengo proyectos de código abierto. Este sitio reúne mi trabajo, mis ideas y nuevas conversaciones.', footer: 'Sigamos con curiosidad y en contacto.',
    projects: ['Calendarios de investigación, historia académica y un lector RSS con asistencia de IA.', 'Lingxi IME, un método de entrada multiplataforma basado en RIME, con Buffer y herramientas de conocimiento personal.', 'Herramientas abiertas de IA académica mantenidas por Scholay.', 'Conocimiento y documentación de producto de Scholay.', 'Una plataforma de investigación en línea para buscar artículos, gestionar referencias, escribir en LaTeX y revisar manuscritos antes de enviarlos.'],
  },
};

export const projects = [
  { name: 'Scholay Today', category: 'RESEARCH READER', url: 'https://github.com/scholay/scholay-today', mark: '01' },
  { name: 'RIMES', category: 'WRITING TOOL', url: 'https://github.com/scholay/rimes', mark: '02' },
  { name: 'Scholay Skills', category: 'OPEN KNOWLEDGE', url: 'https://github.com/scholay/skills', mark: '03' },
  { name: 'Scholay Wiki', category: 'PRODUCT KNOWLEDGE', url: 'https://github.com/scholay/scholay-wiki', mark: '04' },
  { name: 'Scholay', category: 'RESEARCH PLATFORM', url: 'https://www.scholay.com/', mark: '05' },
] as const;

export const socialLinks = [
  { name: '知乎', url: 'https://www.zhihu.com/people/1saac-hi/columns' },
  { name: '哔哩哔哩', url: 'https://space.bilibili.com/470674394' },
  { name: '抖音', url: 'https://www.douyin.com/user/MS4wLjABAAAAIBvEkX55Owe8DQDXS8-V-qnUhVgEHbqwznG_N6x92aPhYxHNntb9unek7TVwj79H' },
  { name: 'Linux.do', url: 'https://linux.do/u/leowangling/summary' },
  { name: 'EnterScholar', url: 'https://enterscholar.com/u/%E5%AD%A6%E6%9C%AF%E6%B5%B7/summary' },
  { name: '即刻', url: 'https://web.okjike.com/u/82bea77f-e80f-4701-ac36-8e4d4336a999' },
  { name: '掘金', url: 'https://juejin.cn/user/314894150803532' },
  { name: '豆瓣', url: 'https://www.douban.com/people/199093371/' },
  { name: 'X', url: 'https://x.com/IsaacLand150539' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/Due-Stress2565/' },
] as const;
