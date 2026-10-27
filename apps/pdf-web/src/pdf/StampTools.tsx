import { useEffect, useRef, useState } from 'react';
import { PenLine, Stamp } from 'lucide-react';
import { renderPage } from './renderer';
import { stampPlacement } from './analysis';
import type { createPdfRenderer } from './renderer';
import type { PdfPage, PdfSource } from './core';
import type { PdfOperation } from './operations';

type Asset = { bytes: Uint8Array; url: string; width: number; height: number };
export function StampTools({ pages, sources, renderer, busy, onApply }: { pages: PdfPage[]; sources: PdfSource[]; renderer: ReturnType<typeof createPdfRenderer>; busy: boolean; onApply: (operation: PdfOperation) => void }) {
  const [method, setMethod] = useState('draw');
  const [asset, setAsset] = useState<Asset>();
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; width: number; height: number }>();
  const [pageId, setPageId] = useState('');
  const [position, setPosition] = useState({ x: 75, y: 85, width: 25, angle: 0, opacity: 1 });
  const canvas = useRef<HTMLCanvasElement>(null), placement = useRef<HTMLDivElement>(null);
  const drawing = useRef(false), version = useRef(0), [loading, setLoading] = useState(false);
  const page = pages.find(p => p.id === pageId) ?? pages[0];
  const source = sources.find(s => s.id === page?.sourceId);
  useEffect(() => { if (new URLSearchParams(location.search).get('stamp') === 'watermark') { setMethod('upload'); setPosition({ x: 50, y: 50, width: 50, angle: 0, opacity: .3 }); } }, []);
  useEffect(() => () => { if (asset) URL.revokeObjectURL(asset.url); }, [asset]);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    let active = true, url: string | undefined;
    setPreview(undefined);
    if (page && source) void (async () => {
      const doc = await renderer.getDocument(source), original = await doc.getPage(page.index + 1);
      const v = original.getViewport({ scale: 1, rotation: page.rotation });
      const c = document.createElement('canvas'); await renderPage(doc, page, c, 800 / Math.max(v.width, v.height));
      const blob = await new Promise<Blob>((resolve, reject) => c.toBlob(b => b ? resolve(b) : reject(new Error('预览生成失败')), 'image/png'));
      url = URL.createObjectURL(blob);
      if (active) setPreview({ url, width: c.width, height: c.height }); else URL.revokeObjectURL(url);
      c.width = 0; c.height = 0;
    })().catch(() => { if (active) setError('页面预览失败，请重新导入文件。'); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [page, source, renderer]);
  async function saveCanvas(c: HTMLCanvasElement) {
    const current = ++version.current; setLoading(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => c.toBlob(b => b ? resolve(b) : reject(new Error('图片生成失败。')), 'image/png'));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (current === version.current) { setAsset({ bytes, url: URL.createObjectURL(blob), width: c.width, height: c.height }); setError(''); }
    } catch (e) { if (current === version.current) setError((e as Error).message); }
    finally { if (current === version.current) setLoading(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    const current = ++version.current; setLoading(true); setAsset(undefined); setError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5 MiB。');
      const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!(header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71) && !(header[0] === 255 && header[1] === 216)) throw new Error('请选择有效的 PNG 或 JPG 图片。');
      const bitmap = await createImageBitmap(file);
      try {
        if (bitmap.width * bitmap.height > 8_000_000) throw new Error('图片不能超过 800 万像素。');
        if (current !== version.current) return;
        const c = document.createElement('canvas'), scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
        c.width = Math.max(1, Math.round(bitmap.width * scale)); c.height = Math.max(1, Math.round(bitmap.height * scale));
        c.getContext('2d')!.drawImage(bitmap, 0, 0, c.width, c.height); await saveCanvas(c);
      } finally { bitmap.close(); }
    } catch (e) { if (current === version.current) { setError(e instanceof Error ? e.message : '图片读取失败。'); setLoading(false); } }
  }
  function clear() { version.current++; drawing.current = false; setAsset(undefined); setError(''); setLoading(false); canvas.current?.getContext('2d')?.clearRect(0, 0, 600, 200); }
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - bounds.left) * 600 / bounds.width, (event.clientY - bounds.top) * 200 / bounds.height];
  }
  async function finishDrawing() {
    if (!drawing.current || !canvas.current) return; drawing.current = false;
    const original = canvas.current, ctx = original.getContext('2d')!, pixels = ctx.getImageData(0, 0, 600, 200).data;
    let left = 600, top = 200, right = -1, bottom = -1;
    for (let y = 0; y < 200; y++) for (let x = 0; x < 600; x++) if (pixels[(y * 600 + x) * 4 + 3]) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
    if (right < 0) return;
    const cropped = document.createElement('canvas'); cropped.width = right - left + 9; cropped.height = bottom - top + 9;
    cropped.getContext('2d')!.drawImage(original, left, top, right - left + 1, bottom - top + 1, 4, 4, right - left + 1, bottom - top + 1);
    await saveCanvas(cropped);
  }
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (busy || !asset || !preview || !placement.current) return;
    const bounds = placement.current.getBoundingClientRect();
    setPosition(old => ({ ...old, x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)) }));
  }
  const box = asset && preview ? stampPlacement(preview.width, preview.height, asset.width, asset.height, position.width, position.x, position.y, position.angle) : undefined;
  return <fieldset className="pdf-setting-section pdf-edit-tools pdf-stamp-tools" disabled={busy}>
    <legend>签名与图片水印</legend>
    <label className="pdf-edit-field">签名或图片来源<select value={method} onChange={e => { clear(); setMethod(e.target.value); }}><option value="draw">手写签名</option><option value="upload">上传 PNG / JPG 图片</option></select></label>
    {method === 'draw' ? <><canvas ref={canvas} width={600} height={200} className="pdf-sign-pad" aria-label="手写签名区域" onPointerDown={e => { if (busy) return; drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const ctx = e.currentTarget.getContext('2d')!, [x, y] = point(e); ctx.strokeStyle = '#14171f'; ctx.fillStyle = '#14171f'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); }} onPointerMove={e => { if (!drawing.current) return; const [x, y] = point(e), ctx = e.currentTarget.getContext('2d')!; ctx.lineTo(x, y); ctx.stroke(); }} onPointerUp={() => void finishDrawing()} onPointerCancel={() => void finishDrawing()} /><button className="pdf-inline-action" onClick={clear}><PenLine size={13} />清空签名</button><p className="pdf-field-hint">用鼠标或触控笔书写，也可切换为上传图片。</p></> : <><label className="pdf-edit-field">选择签名或 Logo<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label><p className="pdf-field-hint">≤ 5 MiB、800 万像素，最长边缩至 2048px。推荐透明 PNG；JPG 的白底会保留。</p></>}
    {asset && <p className="pdf-field-hint" role="status">图片已就绪 · {asset.width} × {asset.height}px</p>}
    {error && <p className="pdf-field-error" role="alert">{error}</p>}
    {pages.length > 0 && <label className="pdf-edit-field">定位预览页<select value={page?.id ?? ''} onChange={e => setPageId(e.target.value)}>{pages.map((p, i) => <option key={p.id} value={p.id}>本次处理第 {i + 1} 页</option>)}</select></label>}
    <div ref={placement} className="pdf-stamp-placement" aria-label="签名位置预览" onPointerDown={e => { if (!asset || busy) return; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }}>
      {preview ? <><img src={preview.url} alt="当前页面定位预览" draggable={false} />{asset && box && <img className="pdf-stamp-overlay" src={asset.url} alt="待应用的签名或图片" draggable={false} style={{ width: `${box.width / preview.width * 100}%`, left: `${box.cx / preview.width * 100}%`, top: `${(1 - box.cy / preview.height) * 100}%`, transform: `translate(-50%, -50%) rotate(${-position.angle}deg)`, opacity: position.opacity }} />}</> : <p>{page ? '正在生成定位预览…' : '添加页面后，在这里预览位置。'}</p>}
    </div>
    <p className="pdf-field-hint">点击或拖动页面调整位置，也可使用下方位置滑块。不同尺寸页面按相同比例放置，边缘自动收回纸内。</p>
    {([['x', '横向位置', 0, 100], ['y', '纵向位置', 0, 100], ['width', '图片宽度', 1, 90]] as const).map(([key, label, min, max]) => <label className="pdf-edit-field" key={key}>{label} · {Math.round(position[key])}%<input type="range" min={min} max={max} value={position[key]} onChange={e => setPosition({ ...position, [key]: Number(e.target.value) })} /></label>)}
    <div className="pdf-field-grid"><label className="pdf-edit-field">旋转角度<select value={position.angle} onChange={e => setPosition({ ...position, angle: Number(e.target.value) })}><option value="0">水平</option><option value="45">45°</option><option value="-45">−45°</option></select></label><label className="pdf-edit-field">不透明度 · {Math.round(position.opacity * 100)}%<input type="range" min="5" max="100" value={position.opacity * 100} onChange={e => setPosition({ ...position, opacity: Number(e.target.value) / 100 })} /></label></div>
    <button className="primary pdf-apply" disabled={!pages.length || !asset || loading} onClick={() => { if (asset) onApply({ kind: 'stamp', image: asset.bytes, ...position }); }}><Stamp size={15} />{loading ? '正在准备图片' : `应用到 ${pages.length} 页`}</button>
    <p className="pdf-field-hint">应用后可在左侧预览位置效果，支持随时撤销。</p>
  </fieldset>;
}
