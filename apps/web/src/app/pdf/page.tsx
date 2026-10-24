import { PdfApp } from '../../pdf/PdfApp';
import { pageMetadata, PageSchema } from '../../seo';

export const metadata = pageMetadata('pdf');

export default function PdfPage() { return <><PageSchema page="pdf" /><PdfApp /></>; }
