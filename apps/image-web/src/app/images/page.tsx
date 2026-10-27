import { Home } from '../../Home';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('images');

export default function ImagesPage() {
  return <><PageSchema page="images" /><Home active="images" /></>;
}
