import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { interleavePages } from './core';
import type { PdfPage, PdfSource } from './core';

export function DuplexTools({ pages, sources, busy, onApply }: { pages: PdfPage[]; sources: PdfSource[]; busy: boolean; onApply: (pages: PdfPage[]) => void }) {
  const [method, setMethod] = useState('split');
  const [split, setSplit] = useState('');
  const [reverse, setReverse] = useState(true);
  const [swap, setSwap] = useState(false);
  const boundary = split === '' ? Math.ceil(pages.length / 2) : Number(split);
  const validSplit = Number.isInteger(boundary) && boundary > 0 && boundary < pages.length;
  const valid = method === 'split' ? validSplit : sources.length === 2;
  const front = method === 'split' ? pages.slice(0, boundary) : pages.filter(p => p.sourceId === sources[swap ? 1 : 0]?.id);
  const back = method === 'split' ? pages.slice(boundary) : pages.filter(p => p.sourceId === sources[swap ? 0 : 1]?.id);
  const next = valid ? interleavePages(front, back, reverse) : [];
  const changed = next.some((p, i) => p.id !== pages[i]?.id);
  const order = new Map(pages.map((p, i) => [p.id, i + 1]));
  return <fieldset className="pdf-setting-section pdf-edit-tools" disabled={busy}>
    <legend>双面扫描重排</legend>
    <label className="pdf-edit-field">页面来源<select value={method} onChange={e => setMethod(e.target.value)}><option value="split">当前页面分为正反两段</option><option value="files">两份文件交错</option></select></label>
    {method === 'split' ? <>
      <label className="pdf-edit-field">正面页数<input type="number" min="1" max={Math.max(1, pages.length - 1)} value={split === '' ? (pages.length ? boundary : '') : split} onChange={e => setSplit(e.target.value)} aria-invalid={pages.length >= 2 && !validSplit} aria-describedby="pdf-duplex-hint" /></label>
      <p className="pdf-field-hint" id="pdf-duplex-hint">前 {validSplit ? boundary : 'N'} 页作为正面，其余作为背面。以工作区当前顺序为准。</p>
    </> : <>
      <label className="pdf-edit-field">正面文件<select value={swap ? 'second' : 'first'} onChange={e => setSwap(e.target.value === 'second')} disabled={sources.length !== 2}><option value="first">{sources[0]?.name || '请先添加文件'}</option>{sources[1] && <option value="second">{sources[1].name}</option>}</select></label>
      {sources.length === 2 && <p className="pdf-field-hint">背面文件：{sources[swap ? 0 : 1].name}。各文件内沿用当前页序。</p>}
    </>}
    <label className="pdf-radio pdf-duplex-reverse"><input type="checkbox" checked={reverse} onChange={e => setReverse(e.target.checked)} /><span>反转背面顺序</span></label>
    <p className="pdf-field-hint">背面按最后一张到第一张扫描时，保持此项勾选。不会旋转页面。</p>
    {!valid ? <p className={pages.length ? 'pdf-field-error' : 'pdf-field-hint'} role={pages.length ? 'alert' : undefined}>{method === 'files' ? '两份文件模式需要恰好两个来源文件；请添加文件，或改用分段模式。' : pages.length < 2 ? '请至少添加两页。' : `正面页数须为 1–${pages.length - 1} 之间的整数。`}</p> : <div className="pdf-duplex-preview" aria-live="polite">
      <strong>重排预览 · 正面 {front.length} 页 / 背面 {back.length} 页</strong>
      <p>当前页码：{next.map(p => order.get(p.id)).join(' → ')}</p>
      {front.length !== back.length && <p>正反面数量不等，多出的 {Math.abs(front.length - back.length)} 页按该面顺序追加到末尾；不补空白页。</p>}
      {!changed && <p>当前页序已与结果一致。</p>}
    </div>}
    <button className="primary pdf-apply" disabled={!valid || !changed} onClick={() => onApply(next)}><ArrowDownUp size={15} />应用重排</button>
    <p className="pdf-field-hint">作用于全部页面。应用后查看缩略图确认，支持撤销，再生成 PDF 下载。</p>
  </fieldset>;
}
