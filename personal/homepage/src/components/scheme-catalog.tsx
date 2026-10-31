'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import type { Locale } from '@/lib/site-content';
import '@/app/scheme-catalog.css';

type SchemePackage = {
  id: string;
  nameZH: string;
  nameEN: string;
  category: string;
  family: string;
  upstream: { url: string; repo: string; revision: string; revisionDate: string };
  license: string | null;
  redistribution: string;
  status: string;
  publishable: boolean;
  archive: string;
  bytes: number;
  sha256: string;
  downloadUrl: string | null;
  schemes: { id: string; name: string; recommended: boolean; importable: boolean }[];
  engine: { deploySeconds?: number; peakMemoryMB?: number; deviceRisk?: string } | null;
};

export type SchemeCatalogData = {
  updatedAt: string;
  sourceUrl: string;
  packages: SchemePackage[];
};

type Category = 'all' | 'phonetic' | 'shape' | 'phonetic-shape' | 'dialect' | 'auxiliary';
type StatusFilter = 'all' | 'verified' | 'downloadable' | 'pending';

const categories: Category[] = ['all', 'phonetic', 'shape', 'phonetic-shape', 'dialect', 'auxiliary'];
const statuses: StatusFilter[] = ['all', 'verified', 'downloadable', 'pending'];
const pageSize = 24;
const familyNames: Record<string, [string, string]> = {
  quanpin: ['全拼', 'Pinyin'], shuangpin: ['双拼', 'Double pinyin'], zhuyin: ['注音', 'Zhuyin'], chord: ['并击', 'Chorded input'],
  wubi: ['五笔', 'Wubi'], cangjie: ['仓颉', 'Cangjie'], zhengma: ['郑码', 'Zhengma'], stroke: ['笔画', 'Stroke'], yuhao: ['宇浩', 'Yuhao'], tiger: ['虎码', 'Tiger'], array: ['行列', 'Array'],
  flypy: ['小鹤音形', 'Flypy'], zrm: ['自然码', 'Ziranma'], jiandao: ['键道', 'Jiandao'], sbxlm: ['声笔系列', 'Shengbi'], moqi: ['墨奇', 'Moqi'], shanren: ['山人', 'Shanren'], erbi: ['二笔', 'Erbi'], xuma: ['徐码', 'Xuma'], chaizi: ['拆字', 'Character decomposition'],
  moran: ['魔然', 'Moran'], dayi: ['大易', 'Dayi'], boshiamy: ['嘸蝦米', 'Boshiamy'], sijiao: ['四角', 'Four-corner'],
  yue: ['粤语', 'Cantonese'], wu: ['吴语', 'Wu'], min: ['闽语', 'Min'], mandarin: ['官话', 'Mandarin'], historical: ['古汉语', 'Historical Chinese'], romanization: ['拉丁转写', 'Romanization'],
  gan: ['赣语', 'Gan'], hakka: ['客家话', 'Hakka'], jin: ['晋语', 'Jin'], ping: ['平话', 'Pinghua'], xiang: ['湘语', 'Xiang'], english: ['英文', 'English'], other: ['其他', 'Other'],
};

const translations = {
  zh: {
    label: '输入方案目录', total: '收录方案包', verifiedCount: 'Mac 主机验证', downloads: '可直接下载',
    updated: '目录更新', source: '查看收集来源', search: '搜索输入方案', placeholder: '名称、方案 ID、上游仓库或子分类',
    clear: '清空搜索', category: '输入类别', status: '适配与下载',
    categories: { all: '全部类别', phonetic: '音码', shape: '形码', 'phonetic-shape': '音形码', dialect: '方言与古汉语', auxiliary: '辅助' },
    statuses: { all: '全部状态', verified: '主机验证', downloadable: '可下载', pending: '待适配' },
    verified: 'Mac 主机验证', pending: '待适配', highResources: '高资源需求', license: '许可', unknownLicense: '未注明',
    schemas: '方案', download: '下载 ZIP', upstream: '上游源代码', details: '方案与包信息', recommended: '推荐',
    importable: '静态检查通过', needsWork: '需适配', revision: '上游版本', revisionDate: '版本日期', checksum: 'SHA-256 校验值',
    file: '文件', deployment: '部署用时', memory: '峰值内存', seconds: '秒', deviceRisk: '设备资源说明',
    compatibility: '“主机验证”仅表示 Mac 主机引擎部署、加载通过；iOS 仍需真机检验。其他平台暂不支持本目录导入。',
    sorted: '可下载方案优先，其次为主机验证方案', noMatches: '没有找到匹配的输入方案', noMatchesBody: '试试其他关键词，或重置筛选查看全部方案。',
    reset: '重置筛选', pagination: '输入方案分页', previous: '上一页', next: '下一页',
    results: (count: number, start: number, end: number) => `共 ${count} 个方案包 · 显示 ${start}–${end}`,
    page: (current: number, total: number) => `第 ${current} / ${total} 页`,
  },
  en: {
    label: 'Input scheme catalog', total: 'Packages collected', verifiedCount: 'Mac host verified', downloads: 'Downloads available',
    updated: 'Catalog updated', source: 'Collection source', search: 'Search input schemes', placeholder: 'Name, scheme ID, upstream repository, or subcategory',
    clear: 'Clear search', category: 'Input category', status: 'Verification and downloads',
    categories: { all: 'All categories', phonetic: 'Phonetic', shape: 'Shape', 'phonetic-shape': 'Phonetic & shape', dialect: 'Dialect', auxiliary: 'Auxiliary' },
    statuses: { all: 'All statuses', verified: 'Host verified', downloadable: 'Downloadable', pending: 'Needs adaptation' },
    verified: 'Mac host verified', pending: 'Needs adaptation', highResources: 'High resource use', license: 'License', unknownLicense: 'Unspecified',
    schemas: 'Schemes', download: 'Download ZIP', upstream: 'Upstream source', details: 'Schemes and package details', recommended: 'Recommended',
    importable: 'Schema checks passed', needsWork: 'Needs adaptation', revision: 'Upstream revision', revisionDate: 'Revision date', checksum: 'SHA-256 checksum',
    file: 'File', deployment: 'Deployment time', memory: 'Peak memory', seconds: 's', deviceRisk: 'Device resource notes',
    compatibility: '“Host verified” means engine deployment and loading passed on a Mac host. iOS still requires testing on a physical device. Importing this catalog is not supported on other platforms.',
    sorted: 'Downloadable packages first, then host-verified packages', noMatches: 'No matching input schemes', noMatchesBody: 'Try another keyword, or reset the filters to see every package.',
    reset: 'Reset filters', pagination: 'Input scheme pages', previous: 'Previous', next: 'Next',
    results: (count: number, start: number, end: number) => `${count} packages · Showing ${start}–${end}`,
    page: (current: number, total: number) => `Page ${current} of ${total}`,
  },
  ja: {
    label: '入力方式カタログ', total: '収集したパッケージ', verifiedCount: 'Mac ホストで検証', downloads: 'ダウンロード可能',
    updated: 'カタログ更新', source: '収集元を見る', search: '入力方式を検索', placeholder: '名前、方式 ID、元のリポジトリ、サブカテゴリ',
    clear: '検索をクリア', category: '入力カテゴリ', status: '検証とダウンロード',
    categories: { all: 'すべて', phonetic: '音韻', shape: '字形', 'phonetic-shape': '音韻・字形', dialect: '方言', auxiliary: '補助' },
    statuses: { all: 'すべての状態', verified: 'ホスト検証済み', downloadable: 'ダウンロード可能', pending: '調整が必要' },
    verified: 'Mac ホスト検証済み', pending: '調整が必要', highResources: '必要リソースが多い', license: 'ライセンス', unknownLicense: '記載なし',
    schemas: '入力方式', download: 'ZIP をダウンロード', upstream: '元のソースコード', details: '入力方式とパッケージ詳細', recommended: '推奨',
    importable: '静的チェック済み', needsWork: '調整が必要', revision: '元のリビジョン', revisionDate: 'リビジョン日付', checksum: 'SHA-256 チェックサム',
    file: 'ファイル', deployment: '配置時間', memory: '最大メモリ', seconds: '秒', deviceRisk: 'デバイスのリソースに関する注記',
    compatibility: '「ホスト検証済み」は Mac ホストでエンジンの配置と読み込みに成功したことを示します。iOS は実機での検証が必要です。他のプラットフォームでは、このカタログのインポートは未対応です。',
    sorted: 'ダウンロード可能な方式、ホスト検証済みの方式の順に表示', noMatches: '一致する入力方式がありません', noMatchesBody: '別のキーワードを試すか、フィルターをリセットしてください。',
    reset: 'フィルターをリセット', pagination: '入力方式のページ', previous: '前のページ', next: '次のページ',
    results: (count: number, start: number, end: number) => `${count} パッケージ · ${start}–${end} を表示`,
    page: (current: number, total: number) => `${total} ページ中 ${current} ページ`,
  },
  fr: {
    label: 'Catalogue des méthodes de saisie', total: 'Paquets recensés', verifiedCount: 'Vérifiés sur Mac', downloads: 'Téléchargements disponibles',
    updated: 'Catalogue mis à jour', source: 'Source de la collecte', search: 'Rechercher une méthode de saisie', placeholder: 'Nom, ID, dépôt source ou sous-catégorie',
    clear: 'Effacer la recherche', category: 'Type de saisie', status: 'Vérification et téléchargement',
    categories: { all: 'Toutes les catégories', phonetic: 'Phonétique', shape: 'Forme', 'phonetic-shape': 'Son et forme', dialect: 'Dialecte', auxiliary: 'Auxiliaire' },
    statuses: { all: 'Tous les états', verified: 'Vérifié sur Mac', downloadable: 'Téléchargeable', pending: 'À adapter' },
    verified: 'Vérifié sur Mac', pending: 'À adapter', highResources: 'Ressources élevées', license: 'Licence', unknownLicense: 'Non précisée',
    schemas: 'Méthodes', download: 'Télécharger le ZIP', upstream: 'Code source original', details: 'Méthodes et détails du paquet', recommended: 'Recommandée',
    importable: 'Contrôles statiques réussis', needsWork: 'À adapter', revision: 'Révision source', revisionDate: 'Date de révision', checksum: 'Somme SHA-256',
    file: 'Fichier', deployment: 'Durée de déploiement', memory: 'Mémoire maximale', seconds: 's', deviceRisk: 'Notes sur les ressources de l’appareil',
    compatibility: '« Vérifié sur Mac » signifie que le déploiement et le chargement du moteur ont réussi sur un Mac. iOS nécessite encore un test sur appareil réel. L’importation de ce catalogue n’est pas prise en charge sur les autres plateformes.',
    sorted: 'Paquets téléchargeables en premier, puis paquets vérifiés sur Mac', noMatches: 'Aucune méthode de saisie correspondante', noMatchesBody: 'Essayez un autre mot-clé ou réinitialisez les filtres.',
    reset: 'Réinitialiser les filtres', pagination: 'Pages des méthodes de saisie', previous: 'Précédent', next: 'Suivant',
    results: (count: number, start: number, end: number) => `${count} paquets · Affichage ${start}–${end}`,
    page: (current: number, total: number) => `Page ${current} sur ${total}`,
  },
  es: {
    label: 'Catálogo de métodos de entrada', total: 'Paquetes recopilados', verifiedCount: 'Verificados en Mac', downloads: 'Descargas disponibles',
    updated: 'Catálogo actualizado', source: 'Fuente de la recopilación', search: 'Buscar métodos de entrada', placeholder: 'Nombre, ID, repositorio original o subcategoría',
    clear: 'Borrar búsqueda', category: 'Categoría de entrada', status: 'Verificación y descarga',
    categories: { all: 'Todas las categorías', phonetic: 'Fonético', shape: 'Forma', 'phonetic-shape': 'Sonido y forma', dialect: 'Dialecto', auxiliary: 'Auxiliar' },
    statuses: { all: 'Todos los estados', verified: 'Verificado en Mac', downloadable: 'Descargable', pending: 'Por adaptar' },
    verified: 'Verificado en Mac', pending: 'Por adaptar', highResources: 'Alto uso de recursos', license: 'Licencia', unknownLicense: 'Sin especificar',
    schemas: 'Métodos', download: 'Descargar ZIP', upstream: 'Código fuente original', details: 'Métodos y detalles del paquete', recommended: 'Recomendado',
    importable: 'Comprobaciones estáticas correctas', needsWork: 'Por adaptar', revision: 'Revisión original', revisionDate: 'Fecha de revisión', checksum: 'Suma SHA-256',
    file: 'Archivo', deployment: 'Tiempo de despliegue', memory: 'Memoria máxima', seconds: 's', deviceRisk: 'Notas sobre recursos del dispositivo',
    compatibility: '« Verificado en Mac » significa que el despliegue y la carga del motor funcionaron en un Mac. iOS todavía requiere pruebas en un dispositivo físico. Otras plataformas no admiten la importación de este catálogo.',
    sorted: 'Primero los paquetes descargables y después los verificados en Mac', noMatches: 'No hay métodos de entrada que coincidan', noMatchesBody: 'Prueba otra palabra clave o restablece los filtros.',
    reset: 'Restablecer filtros', pagination: 'Páginas de métodos de entrada', previous: 'Anterior', next: 'Siguiente',
    results: (count: number, start: number, end: number) => `${count} paquetes · Mostrando ${start}–${end}`,
    page: (current: number, total: number) => `Página ${current} de ${total}`,
  },
};

function normalize(value: string) {
  return value.normalize('NFKC').toLowerCase();
}

function isVerified(item: SchemePackage) {
  return item.status === 'verified';
}

function hasHighResourceUse(item: SchemePackage) {
  return item.engine?.deviceRisk === 'high';
}

function fileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function SchemeCatalog({ locale, catalog }: { locale: Locale; catalog: SchemeCatalogData }) {
  const t = translations[locale];
  const componentId = useId();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({ query: '', category: 'all' as Category, status: 'all' as StatusFilter, page: 1 });

  const counts = useMemo(() => ({
    total: catalog.packages.length,
    verified: catalog.packages.filter(isVerified).length,
    downloads: catalog.packages.filter((item) => Boolean(item.downloadUrl)).length,
  }), [catalog.packages]);

  const filteredPackages = useMemo(() => {
    const keywords = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
    return catalog.packages.filter((item) => {
      if (filters.category !== 'all' && item.category !== filters.category) return false;
      if (filters.status === 'verified' && !isVerified(item)) return false;
      if (filters.status === 'downloadable' && !item.downloadUrl) return false;
      if (filters.status === 'pending' && isVerified(item)) return false;
      const searchText = normalize([
        item.id, item.nameZH, item.nameEN, item.category, item.family, item.upstream.repo, item.upstream.url,
        ...(familyNames[item.family] ?? []),
        ...item.schemes.flatMap((scheme) => [scheme.id, scheme.name]),
      ].join(' '));
      return keywords.every((keyword) => searchText.includes(keyword));
    }).sort((a, b) => Number(Boolean(b.downloadUrl)) - Number(Boolean(a.downloadUrl)) || Number(isVerified(b)) - Number(isVerified(a)) || a.id.localeCompare(b.id, 'en'));
  }, [catalog.packages, filters.category, filters.query, filters.status]);

  const pageCount = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const currentPage = Math.min(filters.page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visiblePackages = filteredPackages.slice(offset, offset + pageSize);
  const resetFilters = () => setFilters({ query: '', category: 'all', status: 'all', page: 1 });
  const changePage = (page: number) => {
    setFilters(state => ({ ...state, page }));
    resultsRef.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <section className="scheme-catalog" aria-label={t.label}>
      <div className="scheme-stats">
        {[[counts.total, t.total], [counts.verified, t.verifiedCount], [counts.downloads, t.downloads]].map(([count, label]) => (
          <div className="scheme-stat" key={label}>
            <strong>{count}</strong><span>{label}</span>
          </div>
        ))}
      </div>
      <div className="scheme-source-row">
        <span>{t.updated} <time dateTime={catalog.updatedAt}>{catalog.updatedAt.slice(0, 10)}</time></span>
        <a href={catalog.sourceUrl} target="_blank" rel="noreferrer">{t.source}<ExternalLink size={13} aria-hidden="true" /></a>
      </div>

      <div className="scheme-controls">
        <label className="scheme-search-label" htmlFor={`${componentId}-search`}>{t.search}</label>
        <div className="scheme-search">
          <Search size={19} aria-hidden="true" />
          <input id={`${componentId}-search`} type="search" value={filters.query} placeholder={t.placeholder} autoComplete="off"
            onChange={(event) => setFilters((state) => ({ ...state, query: event.target.value, page: 1 }))} />
          {filters.query && <button className="scheme-search-clear" type="button" aria-label={t.clear} onClick={() => setFilters((state) => ({ ...state, query: '', page: 1 }))}><X size={17} aria-hidden="true" /></button>}
        </div>
        <fieldset className="scheme-filter-group">
          <legend>{t.category}</legend>
          <div className="scheme-filter-buttons">
            {categories.map((category) => <button className="scheme-filter-button" key={category} type="button" aria-pressed={filters.category === category}
              onClick={() => setFilters((state) => ({ ...state, category, page: 1 }))}>{t.categories[category]}</button>)}
          </div>
        </fieldset>
        <fieldset className="scheme-filter-group">
          <legend>{t.status}</legend>
          <div className="scheme-filter-buttons">
            {statuses.map((status) => <button className="scheme-filter-button" key={status} type="button" aria-pressed={filters.status === status}
              onClick={() => setFilters((state) => ({ ...state, status, page: 1 }))}>{t.statuses[status]}</button>)}
          </div>
        </fieldset>
      </div>

      <p className="scheme-compatibility">{t.compatibility}</p>
      <div className="scheme-results-bar" ref={resultsRef}>
        <p className="scheme-results-count" role="status" aria-live="polite" aria-atomic="true">{t.results(filteredPackages.length, filteredPackages.length ? offset + 1 : 0, offset + visiblePackages.length)}</p>
        <span>{t.sorted}</span>
      </div>

      {visiblePackages.length > 0 ? <div className="scheme-grid">
        {visiblePackages.map((item) => {
          const title = locale === 'zh' || locale === 'ja' ? item.nameZH || item.nameEN : item.nameEN || item.nameZH;
          const alternateName = locale === 'zh' || locale === 'ja' ? item.nameEN : item.nameZH;
          const titleId = `${componentId}-${item.id}`;
          const categoryLabel = t.categories[item.category as Category] ?? item.category;
          return <article className="scheme-card" key={item.id} aria-labelledby={titleId}>
            <div className="scheme-card-topline"><span>{categoryLabel}</span>{item.family && <span>{familyNames[item.family]?.[locale === 'zh' || locale === 'ja' ? 0 : 1] ?? item.family}</span>}</div>
            <h2 className="scheme-card-title" id={titleId}>{title}</h2>
            {alternateName && alternateName !== title && <p className="scheme-alternate-name">{alternateName}</p>}
            <p className="scheme-repository">{item.upstream.repo || item.id}</p>
            <div className="scheme-badges">
              <span className={`scheme-badge ${isVerified(item) ? 'scheme-badge-verified' : 'scheme-badge-pending'}`}>{isVerified(item) ? t.verified : t.pending}</span>
              {hasHighResourceUse(item) && <span className="scheme-badge scheme-badge-resource">{t.highResources}</span>}
            </div>
            <dl className="scheme-card-facts">
              <div><dt>{t.schemas}</dt><dd>{item.schemes.length}</dd></div>
              <div><dt>{t.license}</dt><dd>{item.license || t.unknownLicense}</dd></div>
            </dl>
            <div className="scheme-card-actions">
              {item.downloadUrl && <a className="scheme-download" href={item.downloadUrl} download aria-label={`${t.download} · ${title}`}><ArrowDownToLine size={15} aria-hidden="true" />{t.download}<span>{fileSize(item.bytes)}</span></a>}
              <a className="scheme-upstream" href={item.upstream.url} target="_blank" rel="noreferrer" aria-label={`${t.upstream} · ${title}`}>{t.upstream}<ExternalLink size={13} aria-hidden="true" /></a>
            </div>
            <details className="scheme-details">
              <summary>{t.details}<span>{item.schemes.length}</span></summary>
              <div className="scheme-detail-content">
                <ul className="scheme-schema-list">
                  {item.schemes.map((scheme) => <li key={scheme.id}>
                    <div className="scheme-schema-name"><strong>{scheme.name || scheme.id}</strong>{scheme.recommended && <span>{t.recommended}</span>}</div>
                    <div className="scheme-schema-meta"><code>{scheme.id}</code><span>{scheme.importable ? t.importable : t.needsWork}</span></div>
                  </li>)}
                </ul>
                <dl className="scheme-detail-facts">
                  {item.upstream.revision && <div><dt>{t.revision}</dt><dd><code>{item.upstream.revision}</code></dd></div>}
                  {item.upstream.revisionDate && <div><dt>{t.revisionDate}</dt><dd>{item.upstream.revisionDate}</dd></div>}
                  {item.engine?.deploySeconds != null && <div><dt>{t.deployment}</dt><dd>{item.engine.deploySeconds} {t.seconds}</dd></div>}
                  {item.engine?.peakMemoryMB != null && <div><dt>{t.memory}</dt><dd>{item.engine.peakMemoryMB} MB</dd></div>}
                  {item.engine?.deviceRisk && <div><dt>{t.deviceRisk}</dt><dd>{item.engine.deviceRisk}</dd></div>}
                  {item.downloadUrl && <><div><dt>{t.file}</dt><dd>{item.archive}</dd></div><div><dt>{t.checksum}</dt><dd><code>{item.sha256}</code></dd></div></>}
                </dl>
              </div>
            </details>
          </article>;
        })}
      </div> : <div className="scheme-empty">
        <Search size={30} aria-hidden="true" /><h2>{t.noMatches}</h2><p>{t.noMatchesBody}</p>
        <button className="scheme-reset" type="button" onClick={resetFilters}>{t.reset}</button>
      </div>}

      {filteredPackages.length > 0 && <nav className="scheme-pagination" aria-label={t.pagination}>
        <button type="button" disabled={currentPage <= 1} onClick={() => changePage(currentPage - 1)}><ArrowLeft size={15} aria-hidden="true" />{t.previous}</button>
        <span aria-current="page">{t.page(currentPage, pageCount)}</span>
        <button type="button" disabled={currentPage >= pageCount} onClick={() => changePage(currentPage + 1)}>{t.next}<ArrowRight size={15} aria-hidden="true" /></button>
      </nav>}
    </section>
  );
}
