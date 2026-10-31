import type { Locale } from '@/lib/site-content';
const ids = ['keyboard-projects', 'input-method-projects', 'website-projects', 'open-tools', 'academic-sites'];
const names: Record<Locale, string[]> = {
  zh: ['键盘项目', '输入法项目', '网站服务项目', '开源工具项目', '学术网站项目'],
  en: ['Keyboards', 'Input methods', 'Web services', 'Open source tools', 'Academic websites'],
  ja: ['キーボード', '入力メソッド', 'Web サービス', 'オープンソース', '学術サイト'],
  fr: ['Claviers', 'Méthodes de saisie', 'Services web', 'Outils ouverts', 'Sites académiques'],
  es: ['Teclados', 'Métodos de entrada', 'Servicios web', 'Herramientas abiertas', 'Sitios académicos'],
};
export function ProjectSections({ locale }: { locale: Locale }) {
  return <nav className="resource-links" aria-label={locale === 'zh' ? '项目板块' : 'Project categories'}>{ids.map((id, i) => <a href={`/archive/${id}/`} key={id}><span>{names[locale][i]}</span><span aria-hidden="true">↗</span></a>)}</nav>;
}
