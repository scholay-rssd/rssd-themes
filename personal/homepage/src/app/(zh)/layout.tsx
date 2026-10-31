import { siteMetadata, siteViewport } from '@/lib/site-metadata';
import { ClarityScript } from '@/components/clarity-script';
import '../globals.css';
import '../personal-home.css';
import '../project-pages.css';
import '../scheme-catalog.css';
import '../split-keyboard.css';
import '../color-mode.css';

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function ChineseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}<ClarityScript /></body></html>;
}
