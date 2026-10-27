import { useEffect, useState } from 'react';
import { WandSparkles } from 'lucide-react';
import type { PdfOperation } from './operations';

export function EditTools({ mode, busy, count, onApply }: { mode: string; busy: boolean; count: number; onApply: (operation: PdfOperation) => void }) {
  const [numbers, setNumbers] = useState({ start: 1, size: 12, position: 'bottom' as 'top' | 'bottom', align: 'center' as 'left' | 'center' | 'right', total: true });
  const [watermark, setWatermark] = useState({ text: '', color: '#5a6275', opacity: .2, angle: 45, width: 65 });
  const [layout, setLayout] = useState<'crop' | 'fit' | 'nup'>('crop');
  const [crop, setCrop] = useState({ top: 5, right: 5, bottom: 5, left: 5 });
  const [paper, setPaper] = useState({ landscape: true, margin: 10, gap: 5, count: 2 as 2 | 4 });
  useEffect(() => {
    const preset = new URLSearchParams(location.search).get('layout');
    if (preset === 'fit' || preset === 'nup') { setLayout(preset); setPaper(old => ({ ...old, landscape: preset === 'nup' })); }
  }, []);
  const number = (label: string, value: number, min: number, max: number, change: (n: number) => void) => <label className="pdf-edit-field"><span>{label}</span><input type="number" value={Number.isNaN(value) ? '' : value} min={min} max={max} onChange={e => change(e.target.value === '' ? NaN : Number(e.target.value))} /></label>;
  if (!['numbers', 'watermark', 'layout'].includes(mode)) return null;
  return <fieldset className="pdf-setting-section pdf-edit-tools" disabled={busy}>
    <legend>处理设置</legend>
    {mode === 'numbers' ? <>
      <div className="pdf-field-grid">{number('起始页码', numbers.start, 1, 999999, start => setNumbers({ ...numbers, start }))}{number('字号（pt）', numbers.size, 8, 36, size => setNumbers({ ...numbers, size }))}</div>
      <label className="pdf-edit-field"><span>页码位置</span><select value={numbers.position} onChange={e => setNumbers({ ...numbers, position: e.target.value as 'top' | 'bottom' })}><option value="bottom">页面底部</option><option value="top">页面顶部</option></select></label>
      <label className="pdf-edit-field"><span>对齐方式</span><select value={numbers.align} onChange={e => setNumbers({ ...numbers, align: e.target.value as 'left' | 'center' | 'right' })}><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></label>
      <label className="pdf-edit-field"><span>页码格式</span><select value={String(numbers.total)} onChange={e => setNumbers({ ...numbers, total: e.target.value === 'true' })}><option value="true">当前编号 / 结束编号</option><option value="false">仅当前编号</option></select></label>
      <p className="pdf-field-hint">按本次处理的页面连续编号，边缘留白约 6 mm。可先裁剪或适配纸张，再添加页码。</p>
    </> : mode === 'watermark' ? <>
      <label className="pdf-edit-field"><span>水印文字</span><input value={watermark.text} maxLength={100} placeholder="例如：内部资料 · 请勿外传" onChange={e => setWatermark({ ...watermark, text: e.target.value })} /></label>
      <div className="pdf-field-grid"><label className="pdf-edit-field"><span>水印颜色</span><input type="color" value={watermark.color} onChange={e => setWatermark({ ...watermark, color: e.target.value })} /></label>{number('不透明度（%）', Math.round(watermark.opacity * 100), 5, 100, opacity => setWatermark({ ...watermark, opacity: opacity / 100 }))}</div>
      <label className="pdf-edit-field"><span>倾斜角度</span><select value={watermark.angle} onChange={e => setWatermark({ ...watermark, angle: Number(e.target.value) })}><option value="45">斜向上 · 45°</option><option value="0">水平 · 0°</option><option value="-45">斜向下 · -45°</option></select></label>
      {number('水印宽度（页面 %）', watermark.width, 20, 90, width => setWatermark({ ...watermark, width }))}
      <p className="pdf-field-hint">支持中英文水印，按页面宽度自适应缩放。</p>
    </> : <>
      <label className="pdf-edit-field"><span>版式操作</span><select value={layout} onChange={e => { setLayout(e.target.value as typeof layout); if (e.target.value === 'fit') setPaper({ ...paper, landscape: false }); else if (e.target.value === 'nup') setPaper({ ...paper, landscape: paper.count === 2 }); }}><option value="crop">裁剪边缘</option><option value="fit">适配 A4 纸张</option><option value="nup">多页拼版</option></select></label>
      {layout === 'crop' ? <><div className="pdf-field-grid">{(['top', 'right', 'bottom', 'left'] as const).map((side, i) => <div key={side}>{number(`${['上', '右', '下', '左'][i]}边裁剪（mm）`, crop[side], 0, 200, n => setCrop({ ...crop, [side]: n }))}</div>)}</div><p className="pdf-field-hint">按当前页面方向裁剪四边白边。</p></> : <>
        {layout === 'nup' && <label className="pdf-edit-field"><span>每张纸的页数</span><select value={paper.count} onChange={e => setPaper({ ...paper, count: Number(e.target.value) as 2 | 4, landscape: e.target.value === '2' })}><option value="2">2 页 · 从左到右</option><option value="4">4 页 · 从左到右、从上到下</option></select></label>}
        <label className="pdf-edit-field"><span>A4 纸张方向</span><select value={String(paper.landscape)} onChange={e => setPaper({ ...paper, landscape: e.target.value === 'true' })}><option value="false">纵向 · 210 × 297 mm</option><option value="true">横向 · 297 × 210 mm</option></select></label>
        <div className="pdf-field-grid">{number('纸张留白（mm）', paper.margin, 0, 60, margin => setPaper({ ...paper, margin }))}{layout === 'nup' && number('页面间距（mm）', paper.gap, 0, 40, gap => setPaper({ ...paper, gap }))}</div>
        <p className="pdf-field-hint">等比居中缩放，保留原有文字与矢量。{layout === 'nup' && '选中页合排后放在第一个选中位置。'}</p>
      </>}
    </>}
    <button className="primary pdf-apply" disabled={!count || (mode === 'watermark' && !watermark.text.trim())} onClick={() => onApply(mode === 'numbers' ? { kind: 'numbers', ...numbers } : mode === 'watermark' ? { kind: 'watermark', ...watermark } : layout === 'crop' ? { kind: 'crop', ...crop } : { kind: layout, ...paper })}><WandSparkles size={15} />应用到 {count} 页</button>
    <p className="pdf-field-hint">应用后可在左侧预览效果，支持随时撤销。</p>
  </fieldset>;
}
