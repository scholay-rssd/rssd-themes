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
        const englishContent = locale === 'en' && ['/journal/', '/archive/', '/content-feed.xml'].includes(base);
        const href = englishContent ? '/en' + base + (hash ? '#' + hash : '') : item.localize ? localePath(locale, base) + (hash ? '#' + hash : '') : item.href;
        const active = !hash && (base === '/' ? current === '/' : current.startsWith(base));
        const label = item.labels?.[locale] || item.label;
        return item.localize ? <Link key={item.id} href={href} aria-current={active ? 'page' : undefined}>{label}</Link> : <a key={item.id} href={href} aria-current={active ? 'page' : undefined}>{label}</a>;
      })}
    </nav>
    <nav className="network-nav" aria-label="Scholay sites">
      <a href="https://today.scholay.com/" target="_blank" rel="noopener noreferrer">Today <ArrowUpRight size={14} /></a>
      <a href="https://www.scholay.com/" target="_blank" rel="noopener noreferrer">Scholay <ArrowUpRight size={14} /></a>
      <Link href={home} aria-current={path ? undefined : 'page'}>学术海 <ArrowUpRight size={14} /></Link>
    </nav>
    <PortfolioLanguagePicker locale={locale} path={path} />
    <a className="github-mark" href="https://github.com/scholay-rssd/rssd" target="_blank" rel="noopener noreferrer" aria-label="RSSD 源代码" title="RSSD 源代码"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.7 7.7 0 0 1 8 3.87c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a>
  </div></header>;
}

export function PortfolioFooter({ locale }: { locale: Locale }) {
  return <footer className="site-footer"><div className="shell footer-content">
    <span>© {new Date().getFullYear()} 学术海 · XUESHUHAI</span><span><a href="https://github.com/janraasch/hugo-bearblog">Bear Blog</a> · <a href="/theme-license.txt">MIT</a></span><span>{copy[locale].footer}</span>
    <span><a href="https://www.craftz.dog/" target="_blank" rel="noopener noreferrer">craftzdog</a> · 3D cap: <a href="https://poly.pizza/m/aWxhfEnYwl" target="_blank" rel="noopener noreferrer">J-Toastie</a> (<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>)</span>
    <nav className="site-family" aria-label="其他站点">{[
      ['https://today.scholay.com/','今日学术','scholay-today'],
      ['https://xsime.com/','犀术 IME','xsime'],
      ['https://www.piggytuck.com/','小猪盖被','piggytuck'],
      ['https://pet.piggytuck.com/','小猪萌宠','pets'],
      ['https://legis.wiki/','犀术智法','legis'],
      ['https://metho.scholay.com/','研究方法','metho'],
      ['https://enter.scholay.com/','学术之门','enter'],
      ['https://xsiching.com/','犀术国学','xsiching'],
      ['https://study.scholay.com/','智能学堂','study'],
    ].map(([href,name,id])=> <a key={id} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}><img src={'/family/'+id+'.png'} alt="" width={22} height={22} /></a>)}</nav>
  </div></footer>;
}

export function PortfolioFrame({ locale, path, children }: { locale: Locale; path: string; children: React.ReactNode }) {
  return <div className="portfolio" lang={locale === 'zh' ? 'zh-CN' : locale}><PortfolioHeader locale={locale} path={path} />{children}<PortfolioFooter locale={locale} /></div>;
}
