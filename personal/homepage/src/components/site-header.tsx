import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
export function SiteHeader() { return <header className="site-header shell"><Link href="/" className="brand" aria-label="回到首页"><span className="brand-symbol">π</span><span>一四一五九二六<span className="brand-dot">.</span></span></Link><nav className="main-nav" aria-label="主导航"><Link href="/#journal">文章</Link><Link href="/#about">关于</Link><a href="/rss.xml/" target="_blank" rel="noreferrer">RSS <ArrowUpRight size={13}/></a></nav><ThemeToggle/></header>; }
