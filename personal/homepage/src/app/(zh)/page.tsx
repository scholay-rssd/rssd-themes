import { PersonalHome } from '@/components/personal-home';
import { PageStructuredData } from '@/components/page-structured-data';
import { homeTitle, siteDescription } from '@/lib/site-metadata';

export default function Home() {
  return <><PageStructuredData locale="zh" title={homeTitle('zh')} description={siteDescription} /><PersonalHome locale="zh" /></>;
}
