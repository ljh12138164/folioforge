import { ToolsHome } from '../tools/ToolsHome';
import { pageMetadata, PageSchema } from '../seo';

export const metadata = pageMetadata('home');
export default function Page() { return <><PageSchema page="home" /><ToolsHome /></>; }
