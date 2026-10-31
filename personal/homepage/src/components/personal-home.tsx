/* eslint-disable @next/next/no-html-link-for-pages -- These public content routes are served by the shared static engine, outside Next routing. */
import { ProjectSections } from './project-sections';
import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PortfolioHeader, PortfolioFooter, journalLabels } from './portfolio-frame';
import { ProjectCards } from './project-pages';
import { SplitKeyboard } from './split-keyboard';
import { localePath, projectCopy } from '@/lib/project-content';
import { copy, socialLinks, type Locale } from '@/lib/site-content';

const labels: Record<Locale, {
  greeting: string; profile: string; open: string; bench: string; benchTitle: string;
  benchText: string; keyboardAlt: string; rhinoAlt: string; pixelAlt: string; credit: string; capCredit: string;
}> = {
  zh: {
    greeting: '你好，我是学术海。欢迎来到我的小角落。',
    profile: '学术软件产品经理 / Scholay', open: '打开项目',
    bench: 'FROM THE WORKBENCH / 工作台', benchTitle: '输入，也是一种思考方式。',
    benchText: '我也在探索分体式实体键盘。这里是我在 Blender 制作的模型：点按键帽，或在 3D 区域里用键盘试按，看看输入发生的瞬间。',
    keyboardAlt: '模块化键盘的三维模型渲染', rhinoAlt: '戴橙色帽子的 Scholay 3D 犀牛',
    pixelAlt: 'Scholay 2D 像素犀牛', credit: '页面灵感来自', capCredit: '3D 帽子改作自',
  },
  en: {
    greeting: "Hello, I'm Xueshuhai. Welcome to my little corner.",
    profile: 'Academic software product manager / Scholay', open: 'Open project',
    bench: 'FROM THE WORKBENCH', benchTitle: 'Input is a way of thinking.',
    benchText: 'I also explore split physical keyboards. This is my Blender model: click a keycap, or focus the 3D scene and try your keyboard to see input in motion.',
    keyboardAlt: '3D render of a modular keyboard model', rhinoAlt: 'Scholay 3D rhino wearing an orange cap',
    pixelAlt: 'Scholay 2D pixel rhino', credit: 'Site inspired by', capCredit: '3D cap adapted from',
  },
  ja: {
    greeting: 'こんにちは、学術海です。私の小さな場所へようこそ。',
    profile: '学術ソフトウェアのプロダクトマネージャー / Scholay', open: 'プロジェクトを開く',
    bench: 'FROM THE WORKBENCH / 作業台', benchTitle: '入力も、思考のひとつ。',
    benchText: '分割式の物理キーボードも探求しています。Blenderで制作したモデルのキーをクリックするか、3D領域にフォーカスしてキーボードを試してみてください。',
    keyboardAlt: 'モジュール式キーボードの3Dレンダリング', rhinoAlt: 'オレンジ色の帽子をかぶった Scholay の3Dサイ',
    pixelAlt: 'Scholay の2Dピクセルサイ', credit: 'サイトの着想元', capCredit: '3D 帽子の原作者',
  },
  fr: {
    greeting: 'Bonjour, je suis Xueshuhai. Bienvenue dans mon petit univers.',
    profile: 'Product manager de logiciels académiques / Scholay', open: 'Ouvrir le projet',
    bench: "FROM THE WORKBENCH / À L'ATELIER", benchTitle: 'Saisir, c’est aussi penser.',
    benchText: "J’explore aussi les claviers physiques séparés. Voici mon modèle Blender : cliquez sur une touche ou activez la scène 3D et essayez votre clavier.",
    keyboardAlt: "Rendu 3D d'un clavier modulaire", rhinoAlt: 'Rhinocéros Scholay en 3D avec une casquette orange',
    pixelAlt: 'Rhinocéros Scholay en pixels 2D', credit: 'Site inspiré par', capCredit: 'Casquette 3D adaptée de',
  },
  es: {
    greeting: 'Hola, soy Xueshuhai. Bienvenido a mi pequeño rincón.',
    profile: 'Product manager de software académico / Scholay', open: 'Abrir proyecto',
    bench: 'FROM THE WORKBENCH / EN EL TALLER', benchTitle: 'Escribir también es pensar.',
    benchText: 'También exploro teclados físicos divididos. Este es mi modelo de Blender: pulsa una tecla o enfoca la escena 3D y prueba tu teclado.',
    keyboardAlt: 'Render 3D de un teclado modular', rhinoAlt: 'Rinoceronte 3D de Scholay con gorra naranja',
    pixelAlt: 'Rinoceronte 2D de Scholay en píxeles', credit: 'Sitio inspirado en', capCredit: 'Gorra 3D adaptada de',
  },
};


export function PersonalHome({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const l = labels[locale];
  return (
    <div className="portfolio" lang={locale === 'zh' ? 'zh-CN' : locale}>
      <PortfolioHeader locale={locale} />
      <main className="shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-stage">
            <div className="hero-stage-orbit orbit-one" /><div className="hero-stage-orbit orbit-two" />
            <span className="stage-cross cross-one">✦</span><span className="stage-cross cross-two">✦</span>
            <span className="stage-label stage-label-left">SCHOLAY<br />CURIOUS BY DESIGN</span>
            <span className="stage-label stage-label-right">3D / RHINO<br />01 — ∞</span>
            <Image className="hero-rhino" src="/visuals/scholay-rhino-3d.webp" width={640} height={640} alt={l.rhinoAlt} priority unoptimized />
          </div>
          <p className="greeting"><Sparkles size={16} aria-hidden="true" /> {l.greeting}</p>
          <div className="identity">
            <div><p className="micro-label">{t.eyebrow}</p><h1 id="hero-title">{locale === 'zh' ? '学术海' : 'Xueshuhai'}<span>.</span></h1><p className="identity-role">{l.profile}</p></div>
            <div className="pixel-avatar"><Image src="/visuals/scholay-rhino-2d.png" width={256} height={256} alt={l.pixelAlt} unoptimized /></div>
          </div>
          <div className="hero-intro">
            <p>{t.intro}</p><blockquote>{t.slogan}</blockquote>
            <a className="solid-button" href="#work">{t.explore}<ArrowDown size={17} /></a>
          </div>
        </section>
        <section className="content-section work-section" id="work">
          <div className="home-heading"><span className="section-index">01 / WORK</span><h2>{t.workTitle}</h2><p>{t.workIntro}</p></div>
          <ProjectSections locale={locale} /><ProjectCards locale={locale} />
          <Link className="project-archive-link" href={localePath(locale, "projects")}>{projectCopy[locale].projects}<ArrowRight size={17} /></Link>
        </section>
        <section className="content-section journal-section" id="journal">
          <div className="home-heading"><span className="section-index">JOURNAL / NOTES</span><h2>{journalLabels[locale][2]}</h2><p>{journalLabels[locale][3]}</p></div>
          <div className="social-grid"><a href="/journal/"><span>01</span><strong>{journalLabels[locale][0]}</strong><ArrowUpRight size={16}/></a><a href="/archive/"><span>02</span><strong>{journalLabels[locale][1]}</strong><ArrowUpRight size={16}/></a></div>
        </section>
        <section className="content-section bio-section" id="about">
          <div className="home-heading"><span className="section-index">02 / ABOUT</span><h2>{t.aboutTitle}</h2></div>
          <p className="about-lead">{t.aboutText}</p>
          <div className="workbench" id="keyboard">
            <SplitKeyboard locale={locale} />
            <div className="workbench-copy"><span className="micro-label">{l.bench}</span><h3>{l.benchTitle}</h3><p>{l.benchText}</p>
              <Image src="/visuals/scholay-rhino-typing.png" width={256} height={256} alt={l.pixelAlt} unoptimized />
            </div>
          </div>
        </section>
        <section className="content-section connect-section" id="connect">
          <div className="home-heading"><span className="section-index">03 / ELSEWHERE</span><h2>{t.connectTitle}</h2><p>{t.connectIntro}</p></div>
          <div className="social-grid">{socialLinks.map((social, index) => (
            <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer">
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{social.name}</strong><ArrowUpRight size={16} />
            </a>
          ))}</div>
        </section>
      </main>
      <PortfolioFooter locale={locale} />
    </div>
  );
}
