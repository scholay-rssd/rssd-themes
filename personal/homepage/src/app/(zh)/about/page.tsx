import { AboutPage } from '@/components/about-page';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata } from '@/lib/project-content';
import { aboutCopy } from '@/lib/about-content';
const plain = (text: string) => text.replace(/\*\*/g, '');
export const metadata = pageMetadata('zh', 'about', aboutCopy.zh.title, plain(aboutCopy.zh.paragraphs[0]));
export default function Page() { return <><PageStructuredData locale="zh" path="about" title={aboutCopy.zh.title} description={plain(aboutCopy.zh.paragraphs[0])} /><AboutPage locale="zh" /></>; }
