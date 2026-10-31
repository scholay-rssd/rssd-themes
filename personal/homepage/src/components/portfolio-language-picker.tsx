'use client';

import { languages, localeLabels, type Locale } from '@/lib/site-content';
import { localePath } from '@/lib/project-content';

export function PortfolioLanguagePicker({ locale, path }: { locale: Locale; path: string }) {
  return <label className="language-picker"><span className="sr-only">Language</span>
    <select value={locale} aria-label="Language" id="language-select" onChange={event => window.location.assign(localePath(event.target.value as Locale, path))}>
      {languages.map(lang => <option key={lang} value={lang}>{localeLabels[lang]}</option>)}
    </select>
  </label>;
}
