import type { Locale } from './site-content';

// 关于 page. The Chinese text is owner-approved (2026-11-12); the other four are translations of it.
// **text** marks a section name.
export const aboutCopy: Record<Locale, { title: string; paragraphs: [string, string, string]; elsewhere: string }> = {
  zh: {
    title: '关于学术海',
    paragraphs: [
      '学海无涯，以道驭术。为好奇的人，做更好的工具。我在 Scholay 做产品，也维护开源项目；这个站点是我整理项目、记录想法、与同行相遇的地方。',
      '**作品系列**汇总我维护的产品与项目；**产品资讯**和**产品随想**记录产品动态、实践与复盘；**学术札记**留下研究与学习的过程。',
      '产品、学术和日常思考也散落在其他平台，链接都在下方。想交流，欢迎到留言板，或者通过这些平台找到我。',
    ],
    elsewhere: '在这些地方找到我',
  },
  en: {
    title: 'About Xueshuhai',
    paragraphs: [
      'The sea of learning has no shore; let the way guide the craft. Better tools for curious people. I build products at Scholay and maintain open-source projects; this site is where I gather my projects, write down ideas, and meet fellow travellers.',
      '**Works** collects the products and projects I maintain; **Product news** and **Product reflections** record product updates, practice and retrospectives; **Academic notes** keep the process of research and learning.',
      'My thoughts on products, research and everyday life are also spread across other platforms, linked below. To get in touch, leave a note in the guestbook or find me on any of them.',
    ],
    elsewhere: 'Find me elsewhere',
  },
  ja: {
    title: '学術海について',
    paragraphs: [
      '学海に涯なし、道をもって術を御す。好奇心を持つ人のために、より良い道具を。Scholay でプロダクトを作り、オープンソースのプロジェクトも維持しています。このサイトは、プロジェクトをまとめ、考えを記録し、仲間と出会う場所です。',
      '**作品**では維持しているプロダクトとプロジェクトを紹介し、**プロダクト情報**と**プロダクト随想**ではプロダクトの動向、実践と振り返りを記録し、**学術ノート**には研究と学びの過程を残しています。',
      'プロダクト、研究、日々の考えはほかのプラットフォームにもあり、リンクは下にまとめました。掲示板に書き込むか、これらのプラットフォームで気軽に声をかけてください。',
    ],
    elsewhere: 'ほかの場所で',
  },
  fr: {
    title: 'À propos de Xueshuhai',
    paragraphs: [
      'La mer du savoir n’a pas de rivage ; que la voie guide le métier. De meilleurs outils pour les curieux. Je conçois des produits chez Scholay et maintiens des projets open source ; ce site rassemble mes projets, mes idées et mes rencontres avec d’autres passionnés.',
      '**Œuvres** réunit les produits et projets que je maintiens ; **Actualités produit** et **Réflexions produit** consignent les nouveautés, la pratique et les bilans ; **Notes académiques** gardent la trace de la recherche et de l’apprentissage.',
      'Mes réflexions sur les produits, la recherche et le quotidien se trouvent aussi sur d’autres plateformes, dont les liens figurent ci-dessous. Pour échanger, laissez un mot dans le livre d’or ou retrouvez-moi sur l’une d’elles.',
    ],
    elsewhere: 'Me retrouver ailleurs',
  },
  es: {
    title: 'Sobre Xueshuhai',
    paragraphs: [
      'El mar del saber no tiene orillas; que el camino guíe el oficio. Mejores herramientas para gente curiosa. Diseño productos en Scholay y mantengo proyectos de código abierto; este sitio reúne mis proyectos, mis ideas y los encuentros con otros compañeros de camino.',
      '**Obras** recoge los productos y proyectos que mantengo; **Noticias de producto** y **Reflexiones de producto** registran novedades, práctica y retrospectivas; **Notas académicas** guardan el proceso de investigación y aprendizaje.',
      'Mis ideas sobre productos, investigación y vida cotidiana también están en otras plataformas, enlazadas abajo. Para conversar, deja un mensaje en el libro de visitas o encuéntrame en cualquiera de ellas.',
    ],
    elsewhere: 'Encuéntrame en otros lugares',
  },
};
