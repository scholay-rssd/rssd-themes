'use client';
import { ArrowUp, Check, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
export function ArticleActions() {
  const [progress, setProgress] = useState(0); const [copied, setCopied] = useState(false);
  useEffect(() => { function update() { const total = document.documentElement.scrollHeight - innerHeight; setProgress(total <= 0 ? 100 : Math.min(100, Math.round(scrollY / total * 100))); } update(); addEventListener('scroll', update, {passive:true}); addEventListener('resize', update); return () => {removeEventListener('scroll',update);removeEventListener('resize',update);}; }, []);
  async function copy() { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return <><div className="reading-progress" style={{width:`${progress}%`}} aria-hidden="true"/><div className="article-actions"><span>{progress}% 已读</span><button onClick={copy} aria-label="复制文章链接">{copied ? <Check size={17}/> : <Link2 size={17}/>}<span>{copied ? '已复制' : '分享'}</span></button><button onClick={() => scrollTo({top:0,behavior:'smooth'})} aria-label="回到顶部"><ArrowUp size={18}/></button></div></>;
}
