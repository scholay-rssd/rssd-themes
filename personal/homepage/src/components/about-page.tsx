import { ArrowUpRight } from 'lucide-react';
import { PortfolioFrame } from './portfolio-frame';
import { aboutCopy } from '@/lib/about-content';
import { socialLinks, type Locale } from '@/lib/site-content';

// **text** → <strong>text</strong>; nothing else is interpreted.
function Paragraph({ text }: { text: string }) {
  return <p className="about-lead">{text.split(/\*\*([^*]+)\*\*/).map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part)}</p>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  const t = aboutCopy[locale];
  return <PortfolioFrame locale={locale} path="about"><main className="shell about-page">
    <section className="content-section bio-section">
      <div className="home-heading"><span className="section-index">ABOUT</span><h1>{t.title}</h1></div>
      {t.paragraphs.map(text => <Paragraph key={text} text={text} />)}
    </section>
    <section className="content-section connect-section" id="connect">
      <div className="home-heading"><span className="section-index">ELSEWHERE</span><h2>{t.elsewhere}</h2></div>
      <div className="social-grid">{socialLinks.map((social, index) => (
        <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">
          <span>{String(index + 1).padStart(2, '0')}</span><strong>{social.name}</strong><ArrowUpRight size={16} />
        </a>
      ))}</div>
    </section>
  </main></PortfolioFrame>;
}
