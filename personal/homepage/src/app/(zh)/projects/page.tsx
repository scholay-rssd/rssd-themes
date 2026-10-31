import { ProjectIndex } from '@/components/project-pages';
import { PageStructuredData } from '@/components/page-structured-data';
import { pageMetadata, projectCopy } from '@/lib/project-content';
export const metadata = pageMetadata('zh', 'projects', projectCopy.zh.projects, projectCopy.zh.indexIntro);
export default function Page() { return <><PageStructuredData locale="zh" path="projects" title={projectCopy.zh.projects} description={projectCopy.zh.indexIntro} /><ProjectIndex locale="zh" /></>; }
