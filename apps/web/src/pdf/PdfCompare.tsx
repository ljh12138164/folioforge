import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { renderPage } from './renderer';
import type { createPdfRenderer } from './renderer';
import type { PdfPage, PdfSource } from './core';

export function PdfCompare({ sources, pages, renderer, busy, onAdd, onClear, onCancel }: { sources: PdfSource[]; pages: PdfPage[]; renderer: ReturnType<typeof createPdfRenderer>; busy: string; onAdd: () => void; onClear: () => void; onCancel: () => void }) {
  const [leftId, setLeftId] = useState(''), [rightId, setRightId] = useState('');
  const [index, setIndex] = useState(0), [mode, setMode] = useState('slider'), [amount, setAmount] = useState(50);
  const [images, setImages] = useState<{ left: string; right: string; width: number; height: number }>();
  const [error, setError] = useState('');
  const left = sources.find(s => s.id === leftId) ?? sources[0];
  const right = sources.find(s => s.id === rightId) ?? sources.find(s => s.id !== left?.id);
  const leftPages = pages.filter(p => p.sourceId === left?.id), rightPages = pages.filter(p => p.sourceId === right?.id);
  const count = Math.max(leftPages.length, rightPages.length), current = Math.max(0, Math.min(index, count - 1));
  const a = leftPages[current], b = rightPages[current], valid = left && right && left.id !== right.id;
  useEffect(() => {
    let active = true;
    const urls: string[] = []; setImages(undefined); setError('');
    if (valid) void (async () => {
      const docs = await Promise.all([renderer.getDocument(left), renderer.getDocument(right)]);
      const refs = [a, b];
      const views = await Promise.all(refs.map(async (ref, i) => ref ? (await docs[i].getPage(ref.index + 1)).getViewport({ scale: 1, rotation: ref.rotation }) : undefined));
      const width = Math.max(...views.map(v => v?.width ?? 0)), height = Math.max(...views.map(v => v?.height ?? 0));
      const scale = Math.min(1.5, 1400 / Math.max(width, height), Math.sqrt(2_000_000 / (width * height)));
      const outputs = await Promise.all(refs.map(async (ref, i) => {
        const frame = document.createElement('canvas'); frame.width = Math.max(1, Math.round(width * scale)); frame.height = Math.max(1, Math.round(height * scale));
        const ctx = frame.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, frame.width, frame.height);
        if (ref) { const c = document.createElement('canvas'); await renderPage(docs[i], ref, c, scale); ctx.drawImage(c, (frame.width - c.width) / 2, (frame.height - c.height) / 2); c.width = 0; c.height = 0; }
        const blob = await new Promise<Blob>((resolve, reject) => frame.toBlob(value => value ? resolve(value) : reject(new Error('对比预览生成失败。')), 'image/png'));
        frame.width = 0; frame.height = 0;
        const url = URL.createObjectURL(blob); if (!active) { URL.revokeObjectURL(url); return ''; } urls.push(url); return url;
      }));
      if (active) setImages({ left: outputs[0], right: outputs[1], width, height });
    })().catch(e => { if (active) setError(e instanceof Error ? e.message : '页面预览失败，请重新添加文件。'); });
    return () => { active = false; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, [left, right, a, b, valid, renderer]);
  const choose = (side: 'left' | 'right', value: string) => { (side === 'left' ? setLeftId : setRightId)(value); setIndex(0); };
  return <section className="pdf-compare" aria-label="PDF 视觉对比">
    <div className="panel-heading"><h2>文档对比</h2><div className="toolbar"><button disabled={!!busy || !pages.length} onClick={onClear}>清空</button><button disabled={!!busy} onClick={onAdd}><Plus size={14} />添加对比文件</button></div></div>
    {busy && <p className="pdf-compare-note" role="status">{busy}<button className="pdf-inline-action" onClick={onCancel}>取消操作</button></p>}
    <div className="pdf-compare-controls"><label>左侧文件<select value={left?.id ?? ''} disabled={!!busy || !sources.length} onChange={e => choose('left', e.target.value)}>{!sources.length && <option value="">请添加 PDF</option>}{sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>右侧文件<select value={right?.id ?? ''} disabled={!!busy || sources.length < 2} onChange={e => choose('right', e.target.value)}>{!right && <option value="">请添加另一份 PDF</option>}{sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>对比方式<select value={mode} onChange={e => setMode(e.target.value)}><option value="slider">滑块对比</option><option value="overlay">透明叠加</option><option value="side">左右并排</option></select></label></div>
    <p className="pdf-compare-note">按两份文档在工作区的当前页序同步翻页，以相同可见尺寸居中对齐。</p>
    {!valid ? <div className="pdf-compare-empty"><h3>{left && right ? '请选择两个不同来源' : '添加两份 PDF，开始对比'}</h3><p>导入两份 PDF，通过滑块、叠加或并排方式逐页比对。</p><button className="primary" disabled={!!busy} onClick={onAdd}>选择文件</button></div> : <>
      <div className="pdf-compare-navigation"><button aria-label="对比上一页" disabled={current === 0} onClick={() => setIndex(current - 1)}><ArrowLeft size={15} />上一页</button><label>对比页码<select value={current} onChange={e => setIndex(Number(e.target.value))}>{Array.from({ length: count }, (_, i) => <option key={i} value={i}>第 {i + 1} 页 / {count}</option>)}</select></label><button aria-label="对比下一页" disabled={current >= count - 1} onClick={() => setIndex(current + 1)}>下一页<ArrowRight size={15} /></button></div>
      {(!a || !b) && <p className="pdf-compare-note pdf-compare-missing" role="status">{!a ? '左侧' : '右侧'}文件没有第 {current + 1} 页；该侧暂以空白显示。</p>}
      {error ? <p className="pdf-compare-note" role="alert">{error}</p> : images ? <>
        {mode === 'side' ? <div className="pdf-compare-side"><figure><img src={images.left} alt={`左侧第 ${current + 1} 页${a ? '' : '（无对应页）'}`} /><figcaption>左侧 · {left.name}</figcaption></figure><figure><img src={images.right} alt={`右侧第 ${current + 1} 页${b ? '' : '（无对应页）'}`} /><figcaption>右侧 · {right.name}</figcaption></figure></div> : <div className="pdf-compare-stage" style={{ aspectRatio: `${images.width} / ${images.height}`, width: `min(100%, 780px, ${(images.width / images.height) * 70}dvh)` }}>
          <img src={images.left} alt={`左侧第 ${current + 1} 页`} /><img src={images.right} alt={`右侧第 ${current + 1} 页`} style={mode === 'slider' ? { clipPath: `inset(0 0 0 ${amount}%)` } : { opacity: amount / 100 }} />{mode === 'slider' && <span className="pdf-compare-divider" style={{ left: `${amount}%` }} />}
        </div>}
        {mode !== 'side' && <label className="pdf-compare-range">{mode === 'slider' ? `分界位置 · ${amount}%（左文件 / 右文件）` : `右侧叠加不透明度 · ${amount}%`}<input type="range" min="0" max="100" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>}
      </> : <p className="pdf-compare-note" role="status">正在渲染两份文档…</p>}
    </>}
  </section>;
}
