import type { Metadata } from 'next';
import { PdfApp } from '../../pdf/PdfApp';
import '../../pdf/pdf.css';

export const metadata: Metadata = {
  title: 'FolioForge 页匠 · 离线 PDF 工作台',
  description: '本地整理 PDF，双面重排、空白页识别、签名与水印、裁剪拼版、文字提取与对比，中英文 OCR、可搜索 PDF 和压缩。文件无需上传，缓存完成后可离线使用。',
};

export default function PdfPage() { return <PdfApp />; }
