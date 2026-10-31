import { InputSchemePage } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata, projectCopy } from '@/lib/project-content';
export const metadata = pageMetadata('zh', 'projects/rimes/input-schemes', projectCopy.zh.catalog, projectCopy.zh.catalogIntro);
export default function Page() { return <><PageStructuredData locale="zh" path="projects/rimes/input-schemes" title={projectCopy.zh.catalog} description={projectCopy.zh.catalogIntro} /><InputSchemePage locale="zh" /></>; }
