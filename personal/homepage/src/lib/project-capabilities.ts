import type { Locale } from './site-content';
import type { ProjectSlug } from './project-content';

export const capabilityDescriptions: Record<Locale, Record<Exclude<ProjectSlug, 'rimes'>, readonly [string, string, string]>> = {
  zh: {
    'scholay-today': [
      '按日期整理科研日程、会议与申报通知，保留来源与日期依据，方便回到原文核对。',
      '回看历史上的学术事件，浏览研究工具、开放项目和分类整理的学术档案。',
      '在本机汇集 RSS 与国内外热榜，阅读原网页，并将 AI 整理结果导出为 Markdown 或图文。',
    ],
    skills: [
      '建立检索矩阵、扩展种子文献，并维护待处理文献队列。',
      '为原始资料分类、登记和稳定命名，再转成可索引、可追踪的证据卡。',
      '先检查证据能否支撑引用，再据此起草研究文本，保留来源与引用关系。',
    ],
    'scholay-wiki': [
      '将文献检索、期刊查询、写作与评审等使用指南按研究任务集中整理。',
      '按功能导航或主题索引找到词条，正文以 Markdown 保存，并通过链接互相引用。',
      '用 Excalidraw 与 Obsidian 整理知识关系，画布节点直接打开同一份 Markdown 正文。',
    ],
    scholay: [
      '查询论文、作者与期刊，将候选文献收进个人文献集，并结合 DOI、摘要与原始来源复核。',
      '在 Prism 工作区编辑 LaTeX 稿件、管理引用，并进行学术写作与修订。',
      '围绕稿件结构、方法与表达进行自查，并结合期刊官网要求核对投稿准备。',
    ],
  },
  en: {
    'scholay-today': [
      'Organize research dates, conferences, and calls with source links and date evidence so each item can be checked against its original notice.',
      'Revisit events in academic history and browse research tools, open projects, and categorized academic archives.',
      'Collect RSS feeds and domestic and international trends locally, read original pages, and export AI-organized material as Markdown or illustrated content.',
    ],
    skills: [
      'Build a search matrix, expand seed literature, and maintain a queue of papers awaiting review.',
      'Classify, register, and consistently name source materials, then turn them into searchable, traceable evidence cards.',
      'Check whether evidence supports a citation before drafting research text, preserving sources and citation relationships.',
    ],
    'scholay-wiki': [
      'Organize guides to literature discovery, journal search, writing, and review around research tasks.',
      'Find entries through functional navigation or topic indexes, with Markdown documents linked to one another.',
      'Map knowledge relationships with Excalidraw and Obsidian; canvas nodes open the same underlying Markdown documents.',
    ],
    scholay: [
      'Search papers, authors, and journals, collect candidate papers in a personal library, and verify DOI, abstract, and original-source information.',
      'Edit LaTeX manuscripts, manage citations, and draft and revise academic text in the Prism workspace.',
      'Check manuscript structure, methods, and wording, then compare submission preparation with the journal’s official requirements.',
    ],
  },
  ja: {
    'scholay-today': [
      '研究日程、会議、申請の案内を日付順に整理し、出典と日付の根拠から原文を確認できます。',
      '学術史の出来事を振り返り、研究ツール、オープンなプロジェクト、分類された学術アーカイブを閲覧できます。',
      'RSS と国内外のトレンドをローカルで集め、元のウェブページを読み、AI が整理した内容を Markdown や画像付き資料として書き出します。',
    ],
    skills: [
      '検索マトリクスを作り、起点となる文献を広げ、確認待ちの文献リストを管理します。',
      '元の資料を分類・登録し、一貫した名前を付けて、検索と追跡ができるエビデンスカードに変換します。',
      '引用を裏付ける証拠かを確認してから研究文章を起草し、出典と引用の関係を保ちます。',
    ],
    'scholay-wiki': [
      '文献検索、学術誌検索、執筆、査読の利用ガイドを研究タスクごとに整理します。',
      '機能別のナビゲーションやテーマ別の索引から項目を探し、Markdown の本文をリンクでつなぎます。',
      'Excalidraw と Obsidian で知識の関係を整理し、キャンバスのノードから同じ Markdown 本文を開きます。',
    ],
    scholay: [
      '論文、著者、学術誌を検索し、候補を個人文献集に保存して、DOI、要旨、原資料を照合します。',
      'Prism で LaTeX 原稿を編集し、引用を管理しながら学術文章の執筆と推敲を進めます。',
      '原稿の構成、方法、表現を点検し、学術誌の公式要件に照らして投稿準備を確認します。',
    ],
  },
  fr: {
    'scholay-today': [
      'Organisez les dates de recherche, conférences et appels en conservant les sources et les éléments qui justifient chaque date.',
      'Revisitez les événements de l’histoire académique et parcourez les outils de recherche, projets ouverts et archives classées.',
      'Rassemblez localement les flux RSS et les tendances nationales et internationales, lisez les pages originales et exportez les contenus organisés par IA en Markdown ou avec des images.',
    ],
    skills: [
      'Construisez une matrice de recherche, élargissez une sélection initiale de publications et gérez une file de documents à examiner.',
      'Classez, enregistrez et nommez les sources de façon cohérente, puis transformez-les en fiches de preuves consultables et traçables.',
      'Vérifiez que les preuves étayent les citations avant de rédiger, en conservant les sources et leurs liens avec le texte.',
    ],
    'scholay-wiki': [
      'Organisez les guides de recherche bibliographique, de recherche de revues, de rédaction et d’évaluation par tâche de recherche.',
      'Retrouvez les articles grâce à la navigation par fonction ou aux index thématiques, avec des documents Markdown reliés entre eux.',
      'Cartographiez les relations entre connaissances avec Excalidraw et Obsidian ; les nœuds du canevas ouvrent les mêmes documents Markdown.',
    ],
    scholay: [
      'Recherchez des articles, auteurs et revues, rassemblez les publications candidates dans une bibliothèque personnelle et vérifiez DOI, résumés et sources originales.',
      'Éditez des manuscrits LaTeX, gérez les citations et rédigez ou révisez des textes académiques dans Prism.',
      'Examinez la structure, les méthodes et la formulation du manuscrit, puis vérifiez la préparation selon les exigences officielles de la revue.',
    ],
  },
  es: {
    'scholay-today': [
      'Organiza fechas de investigación, congresos y convocatorias con sus fuentes y fundamentos para comprobar cada dato en el anuncio original.',
      'Revisa acontecimientos de la historia académica y explora herramientas de investigación, proyectos abiertos y archivos clasificados.',
      'Reúne RSS y tendencias nacionales e internacionales en tu equipo, lee las páginas originales y exporta material organizado por IA como Markdown o contenido con imágenes.',
    ],
    skills: [
      'Crea una matriz de búsqueda, amplía la bibliografía inicial y mantén una cola de publicaciones pendientes de revisión.',
      'Clasifica, registra y asigna nombres coherentes a las fuentes, y conviértelas en fichas de evidencia que se puedan buscar y rastrear.',
      'Comprueba que la evidencia respalda las citas antes de redactar, conservando las fuentes y su relación con el texto.',
    ],
    'scholay-wiki': [
      'Organiza guías de búsqueda bibliográfica, consulta de revistas, escritura y evaluación según la tarea de investigación.',
      'Encuentra entradas mediante la navegación por función o los índices temáticos, con documentos Markdown enlazados entre sí.',
      'Organiza las relaciones entre conocimientos con Excalidraw y Obsidian; los nodos del lienzo abren los mismos documentos Markdown.',
    ],
    scholay: [
      'Busca artículos, autores y revistas, reúne publicaciones candidatas en una biblioteca personal y verifica DOI, resúmenes y fuentes originales.',
      'Edita manuscritos LaTeX, gestiona citas y redacta o revisa textos académicos en el espacio Prism.',
      'Revisa la estructura, los métodos y la expresión del manuscrito, y comprueba la preparación frente a los requisitos oficiales de la revista.',
    ],
  },
};
