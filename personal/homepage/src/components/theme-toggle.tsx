'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { const value = localStorage.getItem('theme'); const enabled = value === 'dark' || (!value && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = enabled ? 'dark' : 'light'; const frame = requestAnimationFrame(() => setDark(enabled)); return () => cancelAnimationFrame(frame); }, []);
  function toggle() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; localStorage.setItem('theme', next ? 'dark' : 'light'); }
  return <button className="icon-button" onClick={toggle} aria-label={dark ? '切换浅色模式' : '切换深色模式'} title="切换主题">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>;
}
