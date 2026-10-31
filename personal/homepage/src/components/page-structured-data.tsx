import { localePath } from '@/lib/project-content';
import { siteMetadata } from '@/lib/site-metadata';
import type { Locale } from '@/lib/site-content';

// Keep this in the page's server-rendered tree, including its navigation payload.
// A script appended only to exported HTML would become stale after a Next Link.
export function PageStructuredData({ locale, path = '', title, description }: {
  locale: Locale; path?: string; title: string; description: string;
}) {
  const origin = new URL(siteMetadata.metadataBase!.toString()).origin;
  const url = origin + localePath(locale, path);
  const websiteId = origin + '/#website';
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': websiteId, url: origin + '/', name: '学术海' },
      {
        '@type': 'WebPage', '@id': url + '#webpage', url,
        name: path ? `${title} · 学术海` : title,
        description, inLanguage: locale === 'zh' ? 'zh-CN' : locale,
        isPartOf: { '@id': websiteId },
      },
    ],
  };
  return <script type="application/ld+json" data-page-seo
    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />;
}
