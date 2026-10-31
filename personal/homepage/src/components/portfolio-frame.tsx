import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { copy, type Locale } from '@/lib/site-content';
import { localePath } from '@/lib/project-content';
import { PortfolioLanguagePicker } from './portfolio-language-picker';

export const journalLabels: Record<Locale,[string,string,string,string]> = {zh:['手记','项目板块','零散的观察，也值得留下。','记录产品实践、生活近况与值得记住的日子。'],en:['Journal','Categories','Small observations, kept along the way.','Notes on products, everyday life, and dates worth remembering.'],ja:['手記','分類','小さな気づきも、残しておきたい。','プロダクトの実践、日々の記録、覚えておきたい日。'],fr:['Carnet','Catégories','Garder les petites observations.','Pratique produit, quotidien et dates à retenir.'],es:['Diario','Categorías','Guardar también las pequeñas observaciones.','Notas de producto, vida cotidiana y fechas para recordar.']};

export function PortfolioHeader({ locale, path = '' }: { locale: Locale; path?: string }) {
  const home = localePath(locale);
  const navigation = JSON.parse(process.env.SCHOLAY_SITE_NAVIGATION || '[]') as { id: string; label: string; href: string; localize?: boolean; labels?: Partial<Record<Locale, string>> }[];
  const current = '/' + (path ? path.replace(/^\/+|\/+$/g, '') + '/' : '');
  return <header className="site-header"><div className="topbar shell">
    <Link className="site-brand" href={home} aria-label="学术海 / Xueshuhai"><Image className="brand-mark" src="/brand/site-logo.webp?v=bw-v8-20261017" alt="" width={40} height={40} unoptimized /><span>学术海<small>XUESHUHAI</small></span></Link>
    <nav className="section-nav" aria-label={locale === 'zh' ? '主导航' : 'Main navigation'}>
      {navigation.map(item => {
        const [base, hash] = item.href.split('#');
        const href = item.localize ? localePath(locale, base) + (hash ? '#' + hash : '') : item.href;
        const active = !hash && (base === '/' ? current === '/' : current.startsWith(base));
        const label = item.labels?.[locale] || item.label;
        return item.localize ? <Link key={item.id} href={href} aria-current={active ? 'page' : undefined}>{label}</Link> : <a key={item.id} href={href} aria-current={active ? 'page' : undefined}>{label}</a>;
      })}
    </nav>
    <nav className="network-nav" aria-label="Scholay sites">
      <a href="https://today.scholay.com/" target="_blank" rel="noopener noreferrer">Today <ArrowUpRight size={14} /></a>
      <a href="https://www.scholay.com/" target="_blank" rel="noopener noreferrer">Scholay <ArrowUpRight size={14} /></a>
      <Link href={home} aria-current={path ? undefined : 'page'}>学术海 <ArrowUpRight size={14} /></Link>
      <a href="https://github.com/scholay" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={14} /></a>
    </nav>
    <PortfolioLanguagePicker locale={locale} path={path} />
  </div></header>;
}

export function PortfolioFooter({ locale }: { locale: Locale }) {
  return <footer className="site-footer"><div className="shell footer-content">
    <span>© {new Date().getFullYear()} 学术海 · XUESHUHAI</span><span><a href="https://github.com/janraasch/hugo-bearblog">Bear Blog</a> · <a href="/theme-license.txt">MIT</a></span><span>{copy[locale].footer}</span>
    <span><a href="https://www.craftz.dog/" target="_blank" rel="noopener noreferrer">craftzdog</a> · 3D cap: <a href="https://poly.pizza/m/aWxhfEnYwl" target="_blank" rel="noopener noreferrer">J-Toastie</a> (<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>)</span>
  </div></footer>;
}

export function PortfolioFrame({ locale, path, children }: { locale: Locale; path: string; children: React.ReactNode }) {
  return <div className="portfolio" lang={locale === 'zh' ? 'zh-CN' : locale}><PortfolioHeader locale={locale} path={path} />{children}<PortfolioFooter locale={locale} /></div>;
}
