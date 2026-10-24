'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Check, CheckCheck, Columns2, Download, FilePlus2, FileSearch, FileStack, FileText, GripVertical, ImageDown, Layers, LayoutGrid, ListOrdered, LoaderCircle, LockKeyhole, Minimize2, PenTool, Plus, Redo2, RotateCw, ScanText, Scissors, Search, ShieldCheck, Stamp, Trash2, Undo2, Upload, X, ZoomIn } from 'lucide-react';
import { zipSync } from 'fflate';
import { SiteHeader } from '../SiteHeader';
import { MAX_FILE_BYTES, MAX_PAGES, MAX_TOTAL_BYTES, movePage, parsePageRange, safeFilename } from './core';
import type { ImportedPdf, PdfPage, PdfSource } from './core';
import { createPdfClient } from './client';
import { createPdfRenderer, pageText, renderPage, watermarkImage } from './renderer';
import { EditTools } from './EditTools';
import { DuplexTools } from './DuplexTools';
import { StampTools } from './StampTools';
import { PdfCompare } from './PdfCompare';
import { inkCoverage } from './analysis';
import { DocumentTools } from './DocumentTools';
import type { OcrOptions, CompressionOptions } from './DocumentTools';
import { createOcrClient } from './ocr-client';
import { recognizePdf, downsamplePdf } from './document-jobs';
import type { PdfOperation } from './operations';
import { useOffline } from './use-offline';

type Mode = 'organize' | 'extract' | 'split' | 'images' | 'numbers' | 'watermark' | 'layout' | 'text' | 'duplex' | 'blank' | 'stamp' | 'compare' | 'ocr' | 'compress';
type History = { pages: PdfPage[]; past: PdfPage[][]; future: PdfPage[][] };
type Renderer = ReturnType<typeof createPdfRenderer>;
const modeGroups = ['页面整理', '版面印记', '识别与转换'] as const;
const modes = [
  { id: 'organize', group: '页面整理', label: '整理与合并', icon: Layers, detail: '拖拽调整页序、旋转或删除页面，可将多份 PDF 与图片合并为一份文档。' },
  { id: 'extract', group: '页面整理', label: '提取页面', icon: FileStack, detail: '勾选或输入页码范围，将选中的页面导出为新 PDF。' },
  { id: 'split', group: '页面整理', label: '拆分文档', icon: Scissors, detail: '将每页单独保存为一份 PDF，统一打包为 ZIP 下载。' },
  { id: 'duplex', group: '页面整理', label: '双面重排', icon: ArrowUpDown, detail: '将分开扫描的正反面交错排回阅读顺序，确认新页序后再应用。' },
  { id: 'blank', group: '页面整理', label: '空白页识别', icon: FileSearch, detail: '按墨迹比例筛选疑似空白页，逐页预览确认后再手动删除。' },
  { id: 'numbers', group: '版面印记', label: '添加页码', icon: ListOrdered, detail: '按当前页序编号，先应用到页面预览效果，确认后再导出。' },
  { id: 'watermark', group: '版面印记', label: '文字水印', icon: Stamp, detail: '叠加中英文水印，可调颜色、角度与不透明度。' },
  { id: 'stamp', group: '版面印记', label: '签名与图片', icon: PenTool, detail: '手写签名或上传图片，调整位置、大小与不透明度后应用到页面。' },
  { id: 'layout', group: '版面印记', label: '裁剪与排版', icon: LayoutGrid, detail: '裁剪四边留白、等比适配 A4，或将 2 / 4 页合排到一张纸。' },
  { id: 'images', group: '识别与转换', label: '转为图片', icon: ImageDown, detail: '逐页渲染为 PNG 或 JPG 图片，打包为 ZIP 下载。' },
  { id: 'text', group: '识别与转换', label: '提取文字', icon: FileText, detail: '提取文档内已有的可选文字，支持按页搜索并导出 TXT；扫描图片请改用 OCR。' },
  { id: 'ocr', group: '识别与转换', label: '扫描件 OCR', icon: ScanText, detail: '使用本地模型识别中英文扫描件，导出 TXT 或可搜索 PDF。' },
  { id: 'compress', group: '识别与转换', label: '压缩 PDF', icon: Minimize2, detail: '提供重存优化与扫描件降采样，对比压缩前后体积后下载。' },
  { id: 'compare', group: '识别与转换', label: '视觉对比', icon: Columns2, detail: '同步翻页，通过滑块、透明叠加或左右并排对照两份文档。' },
] as const;
const bytesLabel = (size: number) => `${(size / 1024 / 1024).toFixed(1)} MiB`;
function highlightText(text: string, query: string) {
  const first = query ? text.toLowerCase().indexOf(query.toLowerCase()) : 0;
  const offset = Math.max(0, first - 200), end = offset + 4000;
  text = `${offset ? '…' : ''}${text.slice(offset, end)}${text.length > end ? '…' : ''}`;
  if (!query) return text;
  const parts = [], lower = text.toLowerCase(), needle = query.toLowerCase();
  let start = 0, found = lower.indexOf(needle);
  while (found !== -1 && parts.length < 200) {
    parts.push(text.slice(start, found), <mark key={found}>{text.slice(found, found + query.length)}</mark>);
    start = found + query.length; found = lower.indexOf(needle, start);
  }
  parts.push(text.slice(start));
  return parts;
}

function PageCanvas({ page, source, renderer, large = false }: { page: PdfPage; source: PdfSource; renderer: Renderer; large?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(large);
  const [image, setImage] = useState<string>();
  const [error, setError] = useState(false);
  useEffect(() => {
    if (large || !ref.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '250px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [large]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    let url: string | undefined;
    setImage(undefined); setError(false);
    void (async () => {
      const doc = await renderer.getDocument(source);
      const original = await doc.getPage(page.index + 1);
      const viewport = original.getViewport({ scale: 1, rotation: page.rotation });
      const canvas = document.createElement('canvas');
      await renderPage(doc, page, canvas, (large ? 1400 : 360) / Math.max(viewport.width, viewport.height));
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('预览失败')), 'image/png'));
      canvas.width = 0; canvas.height = 0;
      url = URL.createObjectURL(blob);
      if (active) setImage(url); else URL.revokeObjectURL(url);
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [visible, page.index, page.rotation, page.sourceId, source, renderer, large]);
  return <div ref={ref} className={`pdf-page-image${large ? ' large' : ''}`} aria-busy={visible && !image && !error}>
    {image ? <img src={image} alt={`${source.name} 第 ${page.index + 1} 页${page.rotation ? `，旋转 ${page.rotation} 度` : ''}`} draggable={false} />
      : error ? <span className="pdf-preview-failed"><FileText size={24} />预览不可用</span> : <LoaderCircle size={20} className="pdf-spinner" aria-label="正在生成预览" />}
  </div>;
}

function SortablePage({ id, index, selected, disabled, children }: { id: string; index: number; selected: boolean; disabled: boolean; children: (handleRef: (element: Element | null) => void) => ReactNode }) {
  const { ref, handleRef, isDragging } = useSortable({ id, index, disabled, transition: { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', idle: true } });
  return <article ref={ref} data-page-id={id} className={`pdf-page${selected ? ' selected' : ''}${isDragging ? ' is-dragging' : ''}`}>{children(handleRef)}</article>;
}

export function PdfApp() {
  const [sources, setSources] = useState<PdfSource[]>([]);
  const [history, setHistory] = useState<History>({ pages: [], past: [], future: [] });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>('organize');
  const [scope, setScope] = useState('all');
  const [range, setRange] = useState('');
  const [rangeError, setRangeError] = useState('');
  const [filename, setFilename] = useState('folioforge-document');
  const [imageFormat, setImageFormat] = useState('png');
  const [dpi, setDpi] = useState('144');
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [dragging, setDragging] = useState(false);
  const [dragPage, setDragPage] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const [result, setResult] = useState<{ url: string; name: string; size: number; count: number; before?: number; note?: string; pdf?: PdfSource; rotation?: number }>();
  const [outputPreview, setOutputPreview] = useState(false);
  const outputDialog = useRef<HTMLDialogElement>(null);
  const [ocrOptions, setOcrOptions] = useState<OcrOptions>({ language: 'chi_sim+eng', format: 'txt', dpi: 200, force: false });
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({ method: 'optimize', dpi: 150, quality: .8, consent: false });
  const ocrClient = useRef<ReturnType<typeof createOcrClient> | null>(null);
  const [textPages, setTextPages] = useState<{ id: string; number: number; text: string }[]>([]);
  const [textQuery, setTextQuery] = useState('');
  const [applied, setApplied] = useState('');
  const [blankThreshold, setBlankThreshold] = useState('0.025');
  const [blankCandidates, setBlankCandidates] = useState<{ id: string; coverage: number }[]>();
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const cancelled = useRef(false);
  const client = useRef<ReturnType<typeof createPdfClient> | null>(null);
  const renderer = useRef<Renderer | null>(null);
  const offline = useOffline();
  const { pages } = history;
  const countSelected = pages.filter(p => selected.has(p.id)).length;
  const outputPages = scope === 'selected' || mode === 'extract' ? pages.filter(p => selected.has(p.id)) : pages;
  const selectedMode = modes.find(m => m.id === mode)!;
  const totalSize = sources.reduce((n, s) => n + s.bytes.length, 0);
  const activeSources = sources.filter(s => pages.some(p => p.sourceId === s.id));
  const previewIndex = pages.findIndex(p => p.id === preview);
  const getClient = () => client.current ??= createPdfClient();
  const getRenderer = () => renderer.current ??= createPdfRenderer();
  const textMatches = textPages.filter(p => p.text.toLowerCase().includes(textQuery.toLowerCase()));

  useEffect(() => {
    const tool = new URLSearchParams(location.search).get('tool');
    if (tool && modes.some(item => item.id === tool)) {
      setMode(tool as Mode); setScope(tool === 'extract' ? 'selected' : 'all');
    }
  }, []);
  useEffect(() => () => { client.current?.destroy(); renderer.current?.destroy(); ocrClient.current?.destroy(); }, []);
  useEffect(() => {
    if (outputPreview && result?.pdf) outputDialog.current?.showModal();
    else outputDialog.current?.close();
  }, [outputPreview, result]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (result?.pdf) renderer.current?.release(result.pdf.id); }, [result]);
  useEffect(() => {
    setTextPages([]); setTextQuery('');
    setBlankCandidates(undefined);
    const ids = new Set([...history.pages, ...history.past.flat(), ...history.future.flat()].map(p => p.sourceId));
    setSources(old => old.every(s => ids.has(s.id)) ? old : old.filter(s => ids.has(s.id)));
    renderer.current?.retain(ids);
  }, [history]);
  useEffect(() => {
    if (preview && !dialog.current?.open) dialog.current?.showModal();
    else if (!preview) dialog.current?.close();
  }, [preview]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (pages.length) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pages.length]);

  const edit = useCallback((next: PdfPage[], message: string) => {
    setHistory(old => ({ pages: next, past: [...old.past.slice(-19), old.pages], future: [] }));
    setResult(undefined); setRangeError(''); setAnnouncement(message);
    setApplied('');
  }, []);
  function undo(redo = false) {
    setHistory(old => {
      const stack = redo ? old.future : old.past;
      if (!stack.length) return old;
      return redo ? { pages: stack[0], past: [...old.past, old.pages], future: stack.slice(1) }
        : { pages: stack[stack.length - 1], past: stack.slice(0, -1), future: [old.pages, ...old.future] };
    });
    setSelected(new Set()); setResult(undefined); setRangeError(''); setApplied(''); setAnnouncement(redo ? '已重做' : '已撤销');
  }
  function rotate(ids: Set<string>) {
    edit(pages.map(p => ids.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p), `已旋转 ${ids.size} 页`);
  }
  function remove(ids: Set<string>) {
    edit(pages.filter(p => !ids.has(p.id)), `已删除 ${ids.size} 页，可使用撤销恢复`);
    setSelected(new Set());
  }
  function reorder(from: number, to: number) {
    const next = movePage(pages, from, to);
    if (next !== pages) {
      edit(next, `页面已从第 ${from + 1} 位移到第 ${to + 1} 位`);
    }
  }
  function clear() {
    if (!window.confirm('清空当前任务？未下载的编辑结果将丢失，原文件不受影响。')) return;
    setSources([]); setHistory({ pages: [], past: [], future: [] }); setSelected(new Set()); setResult(undefined); setErrors([]);
    setApplied('');
    renderer.current?.destroy(); renderer.current = null; setRange(''); setRangeError(''); setAnnouncement('任务已清空');
  }
  async function importFiles(files: File[]) {
    if (busyRef.current || !files.length) return;
    busyRef.current = true; cancelled.current = false; setBusy('正在读取文件'); setErrors([]); setProgress(0);
    const imported: PdfSource[] = [];
    const additions: PdfPage[] = [];
    const failures: string[] = [];
    let size = totalSize;
    try {
      for (let i = 0; i < files.length; i++) {
        if (cancelled.current) break;
        const file = files[i];
        setBusy(`正在读取 ${file.name}`); setProgress(Math.round(i / files.length * 100));
        try {
          if (file.size > MAX_FILE_BYTES) throw new Error('单个文件不能超过 40 MiB。');
          if (size + file.size > MAX_TOTAL_BYTES) throw new Error('任务总大小不能超过 100 MiB，请清空后分批处理。');
          const data = await getClient().run<ImportedPdf>({ action: 'inspect', bytes: new Uint8Array(await file.arrayBuffer()), name: file.name });
          if (cancelled.current) break;
          if (pages.length + additions.length + data.rotations.length > MAX_PAGES) throw new Error('工作台最多保留 200 页，请分批处理。');
          if (size + data.bytes.length > MAX_TOTAL_BYTES) throw new Error('转换后的任务总大小超过 100 MiB，请分批处理。');
          const sourceId = crypto.randomUUID();
          imported.push({ id: sourceId, name: file.name, bytes: data.bytes, originalSize: file.size });
          additions.push(...data.rotations.map((rotation, index) => ({ id: crypto.randomUUID(), sourceId, index, rotation })));
          size += data.bytes.length;
        } catch (error) {
          if (!cancelled.current) failures.push(`${file.name}：${error instanceof Error ? error.message : '导入失败。'}`);
        }
      }
      if (additions.length) {
        setSources(old => [...old, ...imported]);
        edit([...pages, ...additions], `已导入 ${imported.length} 个文件，共 ${additions.length} 页`);
        if (!pages.length && imported.length === 1) setFilename(safeFilename(imported[0].name.replace(/\.(png|jpe?g)$/i, '')));
      }
      setErrors(failures);
    } finally { busyRef.current = false; setBusy(''); setProgress(0); }
  }
  async function sample() {
    if (busyRef.current) return;
    busyRef.current = true; cancelled.current = false; setBusy('正在准备示例'); setErrors([]);
    try {
      const bytes = await getClient().run<Uint8Array>({ action: 'sample' });
      busyRef.current = false;
      await importFiles([new File([bytes.slice().buffer], 'FolioForge-示例文档.pdf', { type: 'application/pdf' })]);
    } catch (error) { if (!cancelled.current) setErrors([error instanceof Error ? error.message : '示例加载失败']); }
    finally { busyRef.current = false; setBusy(''); }
  }
  function cancel() {
    cancelled.current = true; client.current?.destroy(); client.current = null; ocrClient.current?.destroy(); ocrClient.current = null; setAnnouncement('已取消操作');
  }
  function selectRange() {
    try {
      const indices = parsePageRange(range, pages.length);
      setSelected(new Set(indices.map(i => pages[i].id))); setRangeError(''); setAnnouncement(`已选中 ${indices.length} 页`); setResult(undefined);
    } catch (error) { setRangeError((error as Error).message); }
  }
  function chooseMode(next: Mode) {
    setMode(next); setScope(next === 'extract' ? 'selected' : 'all'); setResult(undefined);
    if ((mode === 'ocr') !== (next === 'ocr')) { setTextPages([]); setTextQuery(''); }
  }
  async function applyOperation(operation: PdfOperation) {
    if (busyRef.current || !outputPages.length) return;
    busyRef.current = true; cancelled.current = false; setBusy('正在应用到页面'); setProgress(0); setErrors([]); setResult(undefined);
    try {
      if (operation.kind === 'watermark') operation = { ...operation, image: await watermarkImage(operation.text, operation.color) };
      if (cancelled.current) return;
      const data = await getClient().run<ImportedPdf>({ action: 'transform', sources: activeSources, pages: outputPages, title: safeFilename(filename), operation }, setProgress);
      if (cancelled.current) return;
      const sourceId = crypto.randomUUID();
      const replacements = data.rotations.map((rotation, index) => ({ id: crypto.randomUUID(), sourceId, index, rotation }));
      const chosen = new Set(outputPages.map(p => p.id));
      const nup = operation.kind === 'nup';
      let inserted = false, index = 0;
      const next = pages.flatMap(p => {
        if (!chosen.has(p.id)) return [p];
        if (!nup) return [replacements[index++]];
        if (inserted) return [];
        inserted = true; return replacements;
      });
      const retained = new Set([...pages, ...history.past.slice(-19).flat(), ...next].map(p => p.sourceId));
      const size = sources.filter(s => retained.has(s.id)).reduce((n, s) => n + s.bytes.length, 0) + data.bytes.length;
      if (size > MAX_TOTAL_BYTES) throw new Error('处理结果与撤销历史合计超过 100 MiB，请下载当前结果后清空任务，分批处理。');
      setSources(old => [...old, { id: sourceId, name: `${safeFilename(filename)} · ${selectedMode.label}.pdf`, bytes: data.bytes, originalSize: data.bytes.length }]);
      const message = `已处理 ${outputPages.length} 页${nup ? `，合排为 ${replacements.length} 页` : ''}。预览已更新，可撤销或继续导出。`;
      edit(next, message); setSelected(new Set(replacements.map(p => p.id))); setApplied(message);
    } catch (error) { if (!cancelled.current) setErrors([error instanceof Error ? error.message : '处理失败，请重试。']); }
    finally { busyRef.current = false; setBusy(''); setProgress(0); }
  }
  async function detectBlankPages() {
    if (busyRef.current || !outputPages.length) return;
    busyRef.current = true; cancelled.current = false; setBusy('正在检测空白候选页'); setProgress(0); setErrors([]); setBlankCandidates(undefined); setSelected(new Set());
    const candidates: NonNullable<typeof blankCandidates> = [];
    try {
      for (let i = 0; i < outputPages.length; i++) {
        if (cancelled.current) return;
        const ref = outputPages[i], source = sources.find(s => s.id === ref.sourceId)!;
        const doc = await getRenderer().getDocument(source);
        const text = await pageText(doc, ref.index);
        if (!text.trim()) {
          const page = await doc.getPage(ref.index + 1), view = page.getViewport({ scale: 1, rotation: ref.rotation });
          const canvas = document.createElement('canvas');
          try {
            await renderPage(doc, ref, canvas, 1200 / Math.max(view.width, view.height));
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('当前浏览器无法分析页面像素。');
            const coverage = inkCoverage(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
            if (coverage <= Number(blankThreshold)) candidates.push({ id: ref.id, coverage });
          } finally { canvas.width = 0; canvas.height = 0; }
        }
        setProgress(Math.round((i + 1) / outputPages.length * 100));
      }
      if (!cancelled.current) { setBlankCandidates(candidates); setAnnouncement(`检测完成，找到 ${candidates.length} 个候选页，请人工确认。`); }
    } catch (error) { if (!cancelled.current) setErrors([error instanceof Error ? error.message : '检测失败，请重试。']); }
    finally { busyRef.current = false; setBusy(''); setProgress(0); }
  }
  async function exportDocument() {
    if (busyRef.current || !outputPages.length) return;
    busyRef.current = true; cancelled.current = false; setErrors([]); setResult(undefined); setBusy('正在导出'); setProgress(0);
    try {
      const name = safeFilename(filename);
      let blob: Blob | undefined;
      let downloadName: string;
      let before: number | undefined, note: string | undefined, pdf: PdfSource | undefined;
      if (mode === 'ocr' || mode === 'compress') {
        let currentPage = 0;
        const context = { pages: outputPages, sources: activeSources, renderer: getRenderer(), cancelled: () => cancelled.current, progress: (i: number, total: number) => {
          currentPage = i; setProgress(Math.round(i / total * 100)); setBusy(`${mode === 'ocr' ? '正在识别' : '正在压缩'} · ${Math.min(i + 1, total)} / ${total} 页`);
        } };
        let bytes: Uint8Array | undefined;
        if (mode === 'ocr') {
          setBusy('正在准备本地 OCR 引擎'); setTextPages([]); setTextQuery('');
          ocrClient.current = createOcrClient(n => setProgress(Math.round((currentPage + n) / outputPages.length * 100)));
          const recognized = await recognizePdf(context, ocrClient.current, ocrOptions);
          if (cancelled.current) return;
          setTextPages(recognized.texts); bytes = recognized.bytes;
          if (!bytes) blob = new Blob(['\ufeff', recognized.texts.map(p => `--- 第 ${p.number} 页 ---\n${p.text || '（此页未识别到文字）'}`).join('\n\n')], { type: 'text/plain;charset=utf-8' });
          note = '识别完成，请核对文字。识别页可能存在错字或阅读顺序错误。';
        } else {
          if (compressionOptions.method === 'scan' && !compressionOptions.consent) throw new Error('请先确认扫描件降采样会丢失可选文字等内容。');
          setBusy('正在计算当前范围体积');
          const optimized = await getClient().run<{ original: Uint8Array; bytes: Uint8Array }>({ action: 'optimize', sources: activeSources, pages: outputPages, title: name });
          if (cancelled.current) return;
          before = optimized.original.length;
          const candidate = compressionOptions.method === 'scan' ? await downsamplePdf(context, compressionOptions.dpi, compressionOptions.quality) : optimized.bytes;
          if (cancelled.current) return;
          bytes = candidate.length < before ? candidate : optimized.original;
          note = candidate.length < before ? `减少 ${((1 - bytes.length / before) * 100).toFixed(1)}%${compressionOptions.method === 'scan' ? '；输出为图片页，可选文字与链接已移除' : '；页面内容未降采样'}` : '未缩小，已保留当前范围的原文件内容。';
        }
        if (bytes) {
          blob = new Blob([bytes.slice().buffer], { type: 'application/pdf' });
          pdf = { id: crypto.randomUUID(), name: `${name}-${mode}.pdf`, bytes, originalSize: bytes.length };
        }
        downloadName = `${name}-${mode === 'ocr' ? 'ocr' : 'compressed'}.${bytes ? 'pdf' : 'txt'}`;
      } else if (mode === 'text') {
        const extracted: typeof textPages = [];
        let length = 0;
        for (const ref of outputPages) {
          if (cancelled.current) return;
          const doc = await getRenderer().getDocument(sources.find(s => s.id === ref.sourceId)!);
          const text = await pageText(doc, ref.index);
          if (cancelled.current) return;
          length += text.length;
          if (length > 5_000_000) throw new Error('提取文字超过 500 万字符，请缩小页面范围后重试。');
          extracted.push({ id: ref.id, number: pages.findIndex(p => p.id === ref.id) + 1, text });
          setProgress(Math.round(extracted.length / outputPages.length * 100));
        }
        setTextPages(extracted);
        blob = new Blob(['\ufeff', extracted.map(p => `--- 第 ${p.number} 页 ---\n${p.text || '（此页未提取到文字）'}`).join('\n\n')], { type: 'text/plain;charset=utf-8' });
        downloadName = `${name}.txt`;
      } else if (mode === 'images') {
        const images: Record<string, Uint8Array> = {};
        for (let i = 0; i < outputPages.length; i++) {
          if (cancelled.current) return;
          const page = outputPages[i];
          const source = sources.find(s => s.id === page.sourceId)!;
          const doc = await getRenderer().getDocument(source);
          const canvas = document.createElement('canvas');
          await renderPage(doc, page, canvas, Number(dpi) / 72);
          const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('图片生成失败，请降低分辨率后重试。')), `image/${imageFormat === 'jpg' ? 'jpeg' : 'png'}`, 0.92));
          canvas.width = 0; canvas.height = 0;
          images[`${name}-${String(i + 1).padStart(3, '0')}.${imageFormat}`] = new Uint8Array(await image.arrayBuffer());
          const exportedSize = Object.values(images).reduce((n, data) => n + data.length, 0);
          if (exportedSize > MAX_TOTAL_BYTES) throw new Error('图片结果超过 100 MiB，请降低分辨率或分批选择页面。');
          setProgress(Math.round((i + 1) / outputPages.length * 100));
        }
        if (cancelled.current) return;
        blob = new Blob([zipSync(images, { level: 0 }).slice().buffer], { type: 'application/zip' });
        downloadName = `${name}-images.zip`;
      } else {
        const outputs = await getClient().run<Uint8Array[]>({ action: 'export', sources: activeSources, pages: outputPages, title: name, split: mode === 'split' }, setProgress);
        if (cancelled.current) return;
        if (mode === 'split') {
          const entries = Object.fromEntries(outputs.map((bytes, i) => [`${name}-${String(i + 1).padStart(3, '0')}.pdf`, bytes]));
          blob = new Blob([zipSync(entries, { level: 0 }).slice().buffer], { type: 'application/zip' });
          downloadName = `${name}-pages.zip`;
        } else { blob = new Blob([outputs[0].slice().buffer], { type: 'application/pdf' }); downloadName = `${name}.pdf`; }
      }
      if (cancelled.current) return;
      if (!blob) throw new Error('未能生成输出文件，请重试。');
      const rotation = pdf ? (await (await getRenderer().getDocument(pdf)).getPage(1)).rotate : undefined;
      if (cancelled.current) return;
      const url = URL.createObjectURL(blob);
      setResult({ url, name: downloadName, size: blob.size, count: outputPages.length, before, note, pdf, rotation });
      setAnnouncement('导出完成，可以下载结果');
    } catch (error) { if (!cancelled.current) setErrors([error instanceof Error ? error.message : '导出失败，请重试。']); }
    finally { ocrClient.current?.destroy(); ocrClient.current = null; busyRef.current = false; setBusy(''); setProgress(0); }
  }

  return <div className="app-shell pdf-app">
    <SiteHeader active="pdf" onHelp={() => document.getElementById('pdf-guide')?.scrollIntoView({ behavior: 'smooth' })} />
    <main>
      <section className="pdf-studio-bar">
        <div className="pdf-studio-title">
          <h1>PDF 工作台</h1>
          <span className="pdf-studio-sep" aria-hidden="true" />
          <span className="pdf-mode-badge">{selectedMode.label}</span>
          <p className="pdf-mode-summary">{selectedMode.detail}</p>
        </div>
        <span className="pdf-status-pill"><LockKeyhole size={12} />{pages.length ? `${activeSources.length} 份来源 · ${pages.length} 页` : '本地离线处理'}</span>
      </section>
      <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple hidden aria-label="导入 PDF 或图片" onChange={event => { void importFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
      <div className={`workspace pdf-workspace${dragging ? ' pdf-drop-active' : ''}`} onDragOver={event => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); setDragging(true); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={event => { if (event.dataTransfer.files.length) { event.preventDefault(); setDragging(false); void importFiles(Array.from(event.dataTransfer.files)); } }}>
        <div className="pdf-tool-tabs" role="group" aria-label="PDF 工具">
          {modeGroups.map(groupName => (
            <div className="pdf-rail-group" key={groupName}>
              <span className="pdf-rail-heading">{groupName}</span>
              <div className="pdf-rail-items">
                {modes.filter(item => item.group === groupName).map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" aria-pressed={mode === id} onClick={() => chooseMode(id)} disabled={!!busy}><Icon size={15} />{label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {mode === 'compare' ? <div className="pdf-compare-shell"><PdfCompare sources={activeSources} pages={pages} renderer={getRenderer()} busy={busy} onAdd={() => input.current?.click()} onClear={clear} onCancel={cancel} />{!!errors.length && <div className="pdf-errors" role="alert">{errors.join('；')}</div>}</div> : <>
        <section className="workspace-main pdf-main" aria-label="页面工作区" aria-busy={!!busy}>
          <div className="panel-heading">
            <h2><FileText size={16} />文档页面 <span className="count">{pages.length}</span></h2>
            <div className="toolbar"><button disabled={!!busy || !sources.length} onClick={clear} aria-label="清空 PDF 任务">清空</button><button disabled={!!busy} onClick={() => input.current?.click()}><Plus size={14} />添加文件</button></div>
          </div>
          {!!errors.length && <div className="pdf-errors" role="alert"><div><strong>未能完成处理</strong><ul>{errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div><button aria-label="关闭错误提示" onClick={() => setErrors([])}><X size={16} /></button></div>}
          {applied && <p className="pdf-applied" role="status"><Check size={15} />{applied}</p>}
          {!!pages.length ? <>
            <div className="pdf-selection-toolbar">
              <label><input type="checkbox" aria-label="全选页面" checked={countSelected === pages.length} disabled={!!busy} onChange={e => { setSelected(e.target.checked ? new Set(pages.map(p => p.id)) : new Set()); setResult(undefined); }} />已选 {countSelected} 页</label>
              <div className="pdf-batch-actions"><button disabled={!!busy || !countSelected} onClick={() => rotate(selected)}><RotateCw size={14} />旋转</button><button disabled={!!busy || !countSelected} onClick={() => remove(selected)}><Trash2 size={14} />删除</button><span className="pdf-toolbar-divider" /><button disabled={!!busy || !history.past.length} onClick={() => undo()} aria-label="撤销"><Undo2 size={16} /></button><button disabled={!!busy || !history.future.length} onClick={() => undo(true)} aria-label="重做"><Redo2 size={16} /></button></div>
            </div>
            <div className="pdf-document-strip"><span>{activeSources.length} 个文件 · {bytesLabel(totalSize)}</span><span>拖拽页面排序，也可使用前移 / 后移按钮</span></div>
            {mode === 'text' || mode === 'ocr' ? <div className="pdf-text-panel">
              <label className="pdf-text-search"><Search size={16} /><input type="search" aria-label="搜索提取文字" placeholder="搜索提取文字" value={textQuery} disabled={!textPages.length || !!busy} onChange={e => setTextQuery(e.target.value)} /></label>
              {!textPages.length ? <p className="pdf-text-hint">{mode === 'ocr' ? '选择语言和输出格式，点击“开始 OCR”。完成后可在这里按页核对、搜索文字并查看原页。' : '点击“提取文字”，即可在这里按页阅读和搜索。扫描图片页请切换到“扫描件 OCR”。'}</p> : <>
                <p className="pdf-text-hint" role="status">已{mode === 'ocr' ? '识别' : '提取'} {textPages.length} 页{textQuery && `，${textMatches.length} 页包含“${textQuery}”`}。每页预览最多 4000 字符，输出保留完整结果；复杂排版可能需要手动整理。</p>
                {!textMatches.length && <p className="pdf-text-hint">没有匹配文字，请更换关键词。</p>}
                {textMatches.map(item => <article className="pdf-text-page" key={item.id}><button onClick={() => setPreview(item.id)} disabled={!!busy}>第 {item.number} 页<ZoomIn size={14} /><span>查看原页</span></button><pre tabIndex={0} aria-label={`第 ${item.number} 页提取文字`}>{item.text ? highlightText(item.text, textQuery) : '此页未提取到文字，可能是扫描页。'}</pre></article>)}
              </>}
            </div> : <DragDropProvider onDragStart={event => setDragPage(String(event.operation.source?.id))} onDragEnd={event => {
              setDragPage(undefined);
              const { source } = event.operation;
              if (!event.canceled && isSortable(source)) reorder(source.initialIndex, source.index);
            }}><div className={`pdf-pages${dragPage ? ' is-sorting' : ''}`}>
              {pages.map((page, index) => {
                const source = sources.find(s => s.id === page.sourceId)!;
                return <SortablePage key={page.id} id={page.id} index={index} selected={selected.has(page.id)} disabled={!!busy}>{handleRef => <>
                  <div className="pdf-page-top"><label><input type="checkbox" aria-label={`选择第 ${index + 1} 页`} checked={selected.has(page.id)} disabled={!!busy} onChange={event => { const next = new Set(selected); if (event.target.checked) next.add(page.id); else next.delete(page.id); setSelected(next); setResult(undefined); }} /><span>{String(index + 1).padStart(2, '0')}</span></label><button ref={handleRef} className="pdf-drag-handle" aria-label={`拖动第 ${index + 1} 页排序`} title="拖动排序；也可按空格和方向键" disabled={!!busy}><GripVertical size={15} aria-hidden="true" /></button></div>
                  <button className="pdf-preview-button" aria-label={`预览第 ${index + 1} 页`} onClick={() => setPreview(page.id)}><PageCanvas page={page} source={source} renderer={getRenderer()} /><span className="pdf-zoom"><ZoomIn size={15} />预览</span></button>
                  <p title={source.name}>{source.name}</p><span className="pdf-source-page">原文件第 {page.index + 1} 页{page.rotation ? ` · ${page.rotation}°` : ''}</span>
                  {mode === 'blank' && blankCandidates?.some(p => p.id === page.id) && <span className="pdf-blank-tag">候选空白 · 请确认</span>}
                  <div className="pdf-page-actions"><button disabled={!!busy || index === 0} aria-label={`前移第 ${index + 1} 页`} title="前移" onClick={() => reorder(index, index - 1)}><ArrowUp size={14} /></button><button disabled={!!busy || index === pages.length - 1} aria-label={`后移第 ${index + 1} 页`} title="后移" onClick={() => reorder(index, index + 1)}><ArrowDown size={14} /></button><button disabled={!!busy} aria-label={`旋转第 ${index + 1} 页`} title="顺时针旋转 90°" onClick={() => rotate(new Set([page.id]))}><RotateCw size={14} /></button><button disabled={!!busy} aria-label={`删除第 ${index + 1} 页`} title="删除页面" onClick={() => remove(new Set([page.id]))}><Trash2 size={14} /></button></div>
                </>}</SortablePage>;
              })}
              <button className="pdf-add-page" disabled={!!busy} onClick={() => input.current?.click()}><FilePlus2 size={28} /><strong>继续添加</strong><span>PDF / PNG / JPG</span></button>
            </div></DragDropProvider>}
          </> : <div className="dropzone pdf-empty">
            <div className="import-icon"><FilePlus2 size={30} strokeWidth={1.5} /></div>
            <h2>{history.past.length ? '页面已全部移除' : '从一份文档开始'}</h2>
            <p>{history.past.length ? '撤销可以恢复页面，也可以添加新的文件。' : '把 PDF 拖到这里，或添加图片生成 PDF'}</p>
            <button className="primary import-button" disabled={!!busy} onClick={() => input.current?.click()}><Upload size={16} />选择文件<ArrowRight size={15} /></button>
            {history.past.length ? <button className="pdf-empty-undo" disabled={!!busy} onClick={() => undo()}><Undo2 size={14} />撤销删除</button> : <div className="sample-line">想先试试看？<button disabled={!!busy} onClick={() => void sample()}>载入示例文档<ArrowRight size={12} /></button></div>}
            <span className="drop-hint">单个文件 ≤ 40 MiB · 总计 ≤ 100 MiB · 最多 200 页</span>
          </div>}
          <div className="workspace-bottom"><span>支持拖入多份 PDF 或 PNG / JPG 图片</span><span>支持最近 20 步撤销与重做</span></div>
        </section>
        <aside className="settings pdf-settings" aria-label="导出设置">
          <div className="panel-heading"><h2>导出设置</h2><span className="settings-dot" /></div>
          <div className="pdf-setting-section"><h3>{selectedMode.label}</h3><p>{selectedMode.detail}</p></div>
          {mode !== 'duplex' && <fieldset className="pdf-setting-section" disabled={!!busy}>
            <legend>页面范围</legend>
            <label className="pdf-radio"><input type="radio" name="pdf-scope" checked={scope === 'all' && mode !== 'extract'} disabled={mode === 'extract'} onChange={() => { setScope('all'); setResult(undefined); }} /><span>全部页面</span><small>{pages.length} 页</small></label>
            <label className="pdf-radio"><input type="radio" name="pdf-scope" checked={scope === 'selected' || mode === 'extract'} onChange={() => { setScope('selected'); setResult(undefined); }} /><span>选中的页面</span><small>{countSelected} 页</small></label>
            <label className="pdf-field-label" htmlFor="pdf-range">按当前顺序选择页码</label>
            <div className="pdf-range-row"><input id="pdf-range" placeholder="例如 1-3, 5" value={range} onChange={event => setRange(event.target.value)} aria-invalid={!!rangeError} aria-describedby="pdf-range-error" onKeyDown={e => { if (e.key === 'Enter' && pages.length) selectRange(); }} /><button disabled={!pages.length} onClick={selectRange}>选择</button></div>
            <p id="pdf-range-error" className={rangeError ? 'pdf-field-error' : 'pdf-field-hint'}>{rangeError || '页码对应左侧排列后的顺序。'}</p>
          </fieldset>}
          {mode === 'duplex' && <DuplexTools pages={pages} sources={activeSources} busy={!!busy} onApply={next => { edit(next, '已重排正反页面，可撤销'); setSelected(new Set()); setApplied('已重排正反页面。请查看缩略图确认，可撤销或继续导出。'); }} />}
          {mode === 'blank' && <fieldset className="pdf-setting-section pdf-edit-tools" disabled={!!busy}>
            <legend>空白候选检测</legend>
            <label className="pdf-edit-field">检测灵敏度<select value={blankThreshold} onChange={e => { setBlankThreshold(e.target.value); setBlankCandidates(undefined); }}><option value="0.005">保守 · 最多 0.005% 墨迹</option><option value="0.025">标准 · 最多 0.025% 墨迹</option><option value="0.1">宽松 · 最多 0.1% 墨迹</option></select></label>
            <button className="primary pdf-apply" disabled={!outputPages.length} onClick={() => void detectBlankPages()}><Search size={15} />检测 {outputPages.length} 页</button>
            <p className="pdf-field-hint">检测可见像素，含文字层的页面保留。浅色印章、细线和扫描噪点可能影响结果，请预览确认。</p>
            {blankCandidates && <div className="pdf-blank-results" aria-live="polite"><strong>{blankCandidates.length ? `找到 ${blankCandidates.length} 个候选页，尚未删除` : '没有找到空白候选页'}</strong>
              <div>{blankCandidates.map(candidate => { const number = pages.findIndex(p => p.id === candidate.id) + 1; return <div className="pdf-blank-result" key={candidate.id}><label><input type="checkbox" checked={selected.has(candidate.id)} onChange={e => { const next = new Set(selected); if (e.target.checked) next.add(candidate.id); else next.delete(candidate.id); setSelected(next); }} />候选第 {number} 页</label><button onClick={() => setPreview(candidate.id)} aria-label={`预览空白候选第 ${number} 页`}><ZoomIn size={13} />查看</button></div>; })}</div>
              {!!blankCandidates.length && <><button className="pdf-inline-action" onClick={() => setSelected(new Set(blankCandidates.map(p => p.id)))}>选择全部候选</button><button className="pdf-delete-candidates" disabled={!blankCandidates.some(p => selected.has(p.id))} onClick={() => remove(new Set(blankCandidates.filter(p => selected.has(p.id)).map(p => p.id)))}><Trash2 size={14} />删除勾选的候选页</button></>}
            </div>}
          </fieldset>}
          {mode === 'stamp' && <StampTools pages={outputPages} sources={activeSources} renderer={getRenderer()} busy={!!busy} onApply={operation => void applyOperation(operation)} />}
          <DocumentTools mode={mode} ocr={ocrOptions} compression={compressionOptions} busy={!!busy} onOcr={options => { setOcrOptions(options); setResult(undefined); }} onCompression={options => { setCompressionOptions(options); setResult(undefined); }} />
          <EditTools mode={mode} busy={!!busy} count={outputPages.length} onApply={operation => void applyOperation(operation)} />
          {mode === 'images' && <fieldset className="pdf-setting-section" disabled={!!busy}><legend>图片设置</legend><label className="pdf-field-label" htmlFor="pdf-image-format">输出格式</label><select id="pdf-image-format" value={imageFormat} onChange={e => { setImageFormat(e.target.value); setResult(undefined); }}><option value="png">PNG · 无损图片</option><option value="jpg">JPG · 较小文件</option></select><label className="pdf-field-label" htmlFor="pdf-dpi">分辨率</label><select id="pdf-dpi" value={dpi} onChange={e => { setDpi(e.target.value); setResult(undefined); }}><option value="72">72 DPI · 屏幕阅读</option><option value="144">144 DPI · 清晰预览</option><option value="216">216 DPI · 更精细</option></select><p className="pdf-field-hint">单页最长边限 4096px，最多 1200 万像素。</p></fieldset>}
          <fieldset className="pdf-setting-section" disabled={!!busy}><legend>输出文件</legend><label className="pdf-field-label" htmlFor="pdf-filename">文件名</label><div className="pdf-filename-row"><input id="pdf-filename" value={filename} maxLength={120} onChange={event => { setFilename(event.target.value); setResult(undefined); }} /><span>{mode === 'split' || mode === 'images' ? '.zip' : mode === 'text' || (mode === 'ocr' && ocrOptions.format === 'txt') ? '.txt' : '.pdf'}</span></div><p className="pdf-field-hint">{mode === 'split' ? '每页独立保存，文件名自动添加序号。' : mode === 'images' ? '图片按页面顺序编号，打包下载。' : mode === 'text' ? '生成 UTF-8 TXT，按当前页序分隔。不识别扫描图片。' : '按照当前顺序导出，原文件保持不变。'}</p></fieldset>
          <div className="pdf-export-section">
            <div className="pdf-output-summary"><span>本次导出</span><strong>{outputPages.length} 页</strong></div>
            <button className="primary pdf-export" disabled={!!busy || !outputPages.length || (mode === 'compress' && compressionOptions.method === 'scan' && !compressionOptions.consent)} onClick={() => void exportDocument()}>{busy ? <LoaderCircle size={17} className="pdf-spinner" /> : <Download size={17} />}{busy ? '正在处理' : mode === 'ocr' ? '开始 OCR' : mode === 'compress' ? '压缩并比较体积' : mode === 'text' ? '提取文字并生成 TXT' : mode === 'images' || mode === 'split' ? '生成 ZIP' : '生成 PDF'}{!busy && <ArrowRight size={15} />}</button>
            {(mode === 'extract' || scope === 'selected') && !countSelected && <p className="pdf-field-hint">在左侧勾选页面，或输入页码范围。</p>}
            {!!busy && <div className="pdf-progress" role="status"><span>{busy}</span><progress value={progress} max={100} aria-label="处理进度" /><button onClick={cancel}>取消操作</button></div>}
            {result && <div className="pdf-result" role="status"><strong><Check size={15} />导出完成</strong><span title={result.name}>{result.name}</span><small>{result.count} 页 · {bytesLabel(result.size)}</small>{result.before !== undefined && <small>处理前 {result.before.toLocaleString()} 字节 → 处理后 {result.size.toLocaleString()} 字节</small>}{result.note && <p>{result.note}</p>}{result.pdf && <button className="pdf-inline-action" onClick={() => setOutputPreview(true)}><ZoomIn size={14} />预览结果首页</button>}<a className="primary" href={result.url} download={result.name}><Download size={15} />下载结果</a></div>}
          </div>
        </aside>
        </>}
      </div>
      <section className="pdf-guide" id="pdf-guide" aria-label="使用指南与功能说明"><details><summary>使用指南与支持范围</summary><div><article><h2><Layers size={16} />页面整理</h2><p>导入多份 PDF 或 PNG / JPG 图片后，可拖拽卡片或使用上下箭头调整顺序，勾选页面后批量旋转或删除，支持 20 步撤销与重做。</p></article><article><h2><CheckCheck size={16} />导出与识别</h2><p>支持按页码范围（如 1-3, 5）提取、单页拆分打包 ZIP、批量转图片、中英文扫描件 OCR（导出 TXT 或可搜索 PDF）以及体积压缩。</p></article><article><h2><ShieldCheck size={16} />支持范围</h2><p>单个文件 ≤ 40 MiB，总计 ≤ 100 MiB，最多 200 页。不支持密码加密文档、交互表单与数字签名字段；有损压缩会移除原有文字层与链接。</p></article></div></details></section>
      <footer className="pdf-footer"><span>FolioForge · 页匠</span><span role="status"><span className="live-dot" />{offline}</span></footer>
    </main>
    <span className="pdf-sr-only" aria-live="polite">{announcement}</span>
    <dialog ref={outputDialog} className="pdf-preview-dialog" onCancel={() => setOutputPreview(false)} onClick={event => { if (event.target === event.currentTarget) setOutputPreview(false); }} aria-label="PDF 输出预览">
      {result?.pdf && <><div className="pdf-dialog-heading"><strong>输出预览 · 第 1 页</strong><button onClick={() => setOutputPreview(false)} aria-label="关闭输出预览"><X size={20} /></button></div><div className="pdf-preview-content"><PageCanvas page={{ id: 'output', sourceId: result.pdf.id, index: 0, rotation: result.rotation ?? 0 }} source={result.pdf} renderer={getRenderer()} large /></div></>}
    </dialog>
    <dialog ref={dialog} className="pdf-preview-dialog" onCancel={() => setPreview(undefined)} onClick={event => { if (event.target === event.currentTarget) setPreview(undefined); }} aria-label="PDF 页面预览">
      {previewIndex >= 0 && <><div className="pdf-dialog-heading"><strong>第 {previewIndex + 1} 页 / 共 {pages.length} 页</strong><button onClick={() => setPreview(undefined)} aria-label="关闭页面预览"><X size={20} /></button></div><div className="pdf-preview-content"><PageCanvas page={pages[previewIndex]} source={sources.find(s => s.id === pages[previewIndex].sourceId)!} renderer={getRenderer()} large /></div><div className="pdf-dialog-footer"><button disabled={previewIndex === 0} onClick={() => setPreview(pages[previewIndex - 1].id)}><ArrowLeft size={15} />上一页</button><span title={sources.find(s => s.id === pages[previewIndex].sourceId)?.name}>{sources.find(s => s.id === pages[previewIndex].sourceId)?.name}</span><button disabled={previewIndex === pages.length - 1} onClick={() => setPreview(pages[previewIndex + 1].id)}>下一页<ArrowRight size={15} /></button></div></>}
    </dialog>
  </div>;
}
