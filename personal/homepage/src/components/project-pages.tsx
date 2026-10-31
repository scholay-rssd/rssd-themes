import { ProjectJournal } from './project-journal';
import { ProjectSections } from './project-sections';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Keyboard, Layers, MessageSquare, Package } from 'lucide-react';
import { projects, type Locale } from '@/lib/site-content';
import { localePath, platformLinks, projectCopy, projectName, projectResources, projectSlugs, projectSummary, type ProjectSlug } from '@/lib/project-content';
import { PortfolioFrame } from './portfolio-frame';
import { SchemeCatalog, type SchemeCatalogData } from './scheme-catalog';
import catalog from '@/lib/input-schemes.json';
import { capabilityDescriptions } from '@/lib/project-capabilities';

const symbols = ['◉', '⌘', '✳', '▤', '↗'];
const moduleIcons = [Keyboard, MessageSquare, Layers, BookOpen];
const screenshots = ['01-home', '02-chord-keyboard', '03-buffer', '04-pinyin-keyboard'];

export function ProjectCards({ locale }: { locale: Locale }) {
  const t = projectCopy[locale];
  return <div className="project-grid">{projects.map((project, index) => <Link className={`project-card project-card-${index + 1}`} href={localePath(locale, `projects/${projectSlugs[index]}`)} key={project.name}>
    <div className="project-art" aria-hidden="true"><span className="project-symbol">{symbols[index]}</span><span className="project-art-name">{project.name}</span>{index === 1 && <Image className="project-rhino" src="/visuals/rimes-icon.webp" alt="" width={180} height={180} unoptimized />}</div>
    <div className="project-copy"><div className="project-meta"><span>{project.mark} / {project.category}</span><ArrowRight size={18} /></div>
      <h3>{projectName(locale, projectSlugs[index])}</h3><p>{projectSummary(locale, projectSlugs[index])}</p><span className="project-open">{t.detail}<ArrowRight size={16} /></span>
    </div></Link>)}</div>;
}

function Breadcrumb({ locale, slug }: { locale: Locale; slug?: ProjectSlug }) {
  const t = projectCopy[locale];
  return <nav className="project-breadcrumb" aria-label="Breadcrumb"><Link href={localePath(locale)}>{t.home}</Link><span>/</span><Link href={localePath(locale, 'projects')}>{t.projects}</Link>{slug && <><span>/</span><span aria-current="page">{projectName(locale, slug)}</span></>}</nav>;
}

function CatalogSpotlight({ locale }: { locale: Locale }) {
  const t = projectCopy[locale];
  const count = catalog.packages.length;
  const downloads = catalog.packages.filter(pkg => pkg.downloadUrl).length;
  return <Link className="catalog-spotlight" href={localePath(locale, 'projects/rimes/input-schemes')}>
    <div className="catalog-spotlight-icon"><Keyboard size={34} /><span>{count}</span></div>
    <div><span className="micro-label">RIMES / COMMUNITY RESOURCES</span><h2>{t.catalog}</h2><p>{t.catalogIntro}</p><span className="project-open">{t.browse} · {count} / {downloads} ZIP <ArrowRight size={17} /></span></div>
  </Link>;
}

export function ProjectIndex({ locale }: { locale: Locale }) {
  const t = projectCopy[locale];
  return <PortfolioFrame locale={locale} path="projects"><main className="shell project-main">
    <Breadcrumb locale={locale} /><header className="project-page-heading"><span className="section-index">WORK / ARCHIVE</span><h1>{t.indexTitle}</h1><p>{t.indexIntro}</p></header>
    <div className="project-spotlight-label"><span className="status-dot" />{t.recent} · Lingxi IME</div><CatalogSpotlight locale={locale} />
    <ProjectSections locale={locale} /><ProjectCards locale={locale} />
  </main></PortfolioFrame>;
}

export function ProjectDetail({ locale, slug }: { locale: Locale; slug: ProjectSlug }) {
  const t = projectCopy[locale];
  const index = projectSlugs.indexOf(slug);
  const rimes = slug === 'rimes';
  const productUrl = slug === 'scholay-today' ? 'https://today.scholay.com/' : projects[index].url;
  const capabilities = slug === 'scholay-today' ? t.today : slug === 'skills' ? t.skills : slug === 'scholay-wiki' ? t.wiki : t.scholay;
  return <PortfolioFrame locale={locale} path={`projects/${slug}`}><main className="shell project-main">
    <Breadcrumb locale={locale} slug={slug} />
    <header className={`project-detail-hero project-theme-${index}`}>
      <div className="project-detail-intro"><span className="section-index">{projects[index].category} / {t.maintained}</span><h1>{projectName(locale, slug)}</h1><p>{projectSummary(locale, slug)}</p><div className="project-action-row">
        <a className="solid-button" href={rimes ? '#platforms' : productUrl} {...(!rimes && { target: '_blank', rel: 'noopener noreferrer' })}>{rimes ? t.download : slug === 'scholay' || slug === 'scholay-today' ? t.visit : t.source}<ArrowUpRight size={17} /></a>
        {rimes && <Link className="outline-button" href={localePath(locale, 'projects/rimes/input-schemes')}>{t.catalog}<ArrowRight size={16} /></Link>}
      </div></div>
      {rimes ? <Image className="project-detail-mascot" src="/visuals/rimes-icon.webp" alt="Lingxi IME" width={320} height={320} priority unoptimized /> : <span className="project-detail-symbol" aria-hidden="true">{symbols[index]}</span>}
    </header>
    <section className="project-detail-section"><div className="home-heading"><span className="section-index">01 / PRODUCT</span><h2>{t.overview}</h2></div>
      <div className="capability-grid">{rimes ? t.modules.map((name, i) => { const Icon = moduleIcons[i]; return <article className="capability-card" key={name}><Icon size={24} /><span className="micro-label">{['INPUT', 'BUFFER', 'CAPSULE', 'MAILBOX'][i]}</span><h3>{name}</h3><p>{t.moduleText[i]}</p></article>; }) : capabilities.map((name, i) => <article className="capability-card" key={name}><span className="section-index">0{i + 1}</span><h3>{name}</h3><p>{capabilityDescriptions[locale][slug as Exclude<ProjectSlug, 'rimes'>][i]}</p></article>)}</div>
    </section>
    {rimes && <>
      <section className="project-detail-section" id="platforms"><div className="home-heading"><span className="section-index">02 / PLATFORMS</span><h2>{t.platforms}</h2><p>{t.checked}</p></div><div className="platform-grid">{platformLinks.map((platform, i) => <a className="platform-card" href={platform.url} key={platform.name} target="_blank" rel="noopener noreferrer"><div><strong>{platform.name}</strong><span>{platform.label}<ArrowUpRight size={15} /></span></div><p>{t.platformText[i]}</p></a>)}</div></section>
      <section className="project-detail-section"><div className="home-heading"><span className="section-index">03 / IN ACTION</span><h2>{t.gallery}</h2><p>{t.galleryNote}</p></div><div className="product-gallery">{screenshots.map((file, i) => <figure key={file}><a href={`/visuals/rimes/${file}.webp`} target="_blank" rel="noopener noreferrer"><Image src={`/visuals/rimes/${file}.webp`} alt={t.screenshotLabels[i]} width={660} height={1434} unoptimized /></a><figcaption>{t.screenshotLabels[i]} <ArrowUpRight size={12} /></figcaption></figure>)}</div></section>
      <CatalogSpotlight locale={locale} />
    </>}
    <section className="project-detail-section"><div className="home-heading"><span className="section-index">RESOURCES</span><h2>{t.resources}</h2></div><div className="resource-links">{projectResources[slug].map(resource => <a href={resource.url} key={resource.url} target="_blank" rel="noopener noreferrer"><BookOpen size={18} /><span>{resource.label === 'Public source · historical versions' && locale === 'zh' ? '公开源码与历史版本' : resource.label}</span><ArrowUpRight size={16} /></a>)}</div></section>
    <ProjectJournal slug={slug} locale={locale} /><Link className="project-return" href={localePath(locale, 'projects')}><ArrowLeft size={17} />{t.next}</Link>
  </main></PortfolioFrame>;
}

export function InputSchemePage({ locale }: { locale: Locale }) {
  const t = projectCopy[locale];
  return <PortfolioFrame locale={locale} path="projects/rimes/input-schemes"><main className="shell project-main scheme-page">
    <Breadcrumb locale={locale} slug="rimes" /><Link className="project-return" href={localePath(locale, 'projects/rimes')}><ArrowLeft size={15} />{projectName(locale, 'rimes')}</Link>
    <header className="project-page-heading"><span className="section-index">RIMES / INPUT SCHEMES</span><h1>{t.catalog}</h1><p>{t.catalogIntro}</p></header>
    <details className="scheme-import-guide"><summary><Package size={18} />{t.importTitle}<span>+</span></summary><ol>{t.importSteps.map(step => <li key={step}>{step}</li>)}</ol><p>{t.importNote}</p></details>
    <SchemeCatalog locale={locale} catalog={catalog as SchemeCatalogData} />
    <div className="catalog-provenance"><span>{t.checked}</span><a href="https://github.com/scholay/rimes/blob/main/Catalog/input-schemes/README.md" target="_blank" rel="noopener noreferrer">{t.catalogSource}<ArrowUpRight size={13} /></a><a href="/downloads/rimes/SHA256SUMS" download>{t.checksum}<ArrowRight size={13} /></a></div>
  </main></PortfolioFrame>;
}
