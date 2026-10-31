import { GuideContent } from '../../GuideContent';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('guide');

export default function GuidePage() {
  return (
    <>
      <PageSchema page="guide" />
      <GuideContent />
    </>
  );
}
