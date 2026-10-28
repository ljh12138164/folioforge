'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Check, Disc, File as FileIcon, FileImage, Grid2X2, ImagePlus, Images, Info, Layers3, LoaderCircle, Mountain, MoveHorizontal, PanelsTopLeft, Play } from 'lucide-react';
import { createEngine, formats } from '@pixelforge/image-engine';
import type { FormatId } from '@pixelforge/image-engine';
import { SiteHeader } from './SiteHeader';

const formatIcons: Partial<Record<FormatId, typeof FileImage>> = { GIF: Images, TIFF: Layers3, BMP: Grid2X2, ICO: Disc, JXL: FileImage, QOI: Box, TGA: FileIcon, PSD: PanelsTopLeft, JP2: ImagePlus, EXR: Mountain };

export function Home({ active = 'home' }: { active?: 'home' | 'images' }) {
  const [format, setFormat] = useState<FormatId>('WEBP');
  const [quality, setQuality] = useState(82);
  const [width, setWidth] = useState('');
  const [split, setSplit] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ before: string; after: string; label: string }>();
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);
  const urls = useRef<string[]>([]);
  const target = formats.find((item) => item.id === format)!;
  const outputFormats = formats;

  useEffect(() => () => { engine.current?.dispose(); urls.current.forEach(URL.revokeObjectURL); }, []);

  async function previewSample() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      engine.current ??= createEngine(new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }));
      const response = await fetch('/sample-landscape.png');
      if (!response.ok) throw new Error('示例图片加载失败，请稍后再试。');
      const converted = await engine.current.convert(new File([await response.blob()], '示例-山景.png', { type: 'image/png' }), {
        format, quality, maxWidth: width ? Number(width) : undefined, stripMetadata: true, background: '#ffffff',
      });
      urls.current.forEach(URL.revokeObjectURL);
      const before = URL.createObjectURL(new Blob([converted.before], { type: 'image/png' }));
      const after = URL.createObjectURL(new Blob([converted.after], { type: 'image/png' }));
      urls.current = [before, after];
      setResult({ before, after, label: target.label });
    } catch (cause) { setError(cause instanceof Error ? cause.message : '示例转换失败，请重试。'); }
    finally { setBusy(false); }
  }

  return <div className="home-page">
    <SiteHeader active={active} />
    <main className="home-main">
      <section className="home-intro">
        <h1>图片格式转换</h1>
        <p>支持 WebP、AVIF、JPG、PNG、SVG 等 16 种格式导出，可批量调整画质与尺寸。</p>
        <div className="home-actions"><button className="primary" type="submit" form="home-settings" disabled={busy}><Images size={18} />开始转换<ArrowRight size={16} /></button><button className="secondary" disabled={busy} onClick={previewSample}>{busy ? <LoaderCircle size={17} className="spin" /> : <Play size={17} />}{busy ? '正在转换示例' : result ? '重新转换示例' : '试用示例'}</button></div>
      </section>

      <section className="home-demo" aria-label="图片转换示例">
        <div className="home-picture">
          <img src={result?.before ?? '/sample-landscape.png'} alt="山林与湖泊的示例图片" width={2172} height={724} fetchPriority="high" />
          {result && <img src={result.after} alt="示例图片的实际转换结果" style={{ clipPath: `inset(0 0 0 ${split}%)` }} />}
          <span className="compare-label label-before">{result ? '原图' : '示例图片'}</span><span className="compare-label label-after">{result ? `转换结果 · ${result.label}` : '点击「试用示例」查看结果'}</span>
          <div className="compare-divider" style={{ left: `${split}%` }}><span><MoveHorizontal size={16} /></span></div>
          <input aria-label="拖动以对比示例转换效果" type="range" min="0" max="100" value={split} onChange={(event) => setSplit(Number(event.target.value))} />
          {busy && <div className="home-demo-loading" role="status"><LoaderCircle size={18} className="spin" />正在转换示例…</div>}
        </div>
        <form id="home-settings" className="home-settings" action="/convert/" method="get">
          <fieldset disabled={busy}><legend className="sr-only">转换设置</legend><span>选择格式</span><div className="home-format-options">{outputFormats.slice(0, 4).map((item) => <label key={item.id} className={format === item.id ? 'chosen' : ''}><input type="radio" name="format" value={item.id} checked={format === item.id} onChange={() => setFormat(item.id)} />{item.label}{format === item.id && <Check size={13} />}</label>)}</div></fieldset>
          {target.lossy && <label className="home-quality">画质<input name="quality" aria-label="示例图片画质" type="range" min="1" max="100" value={quality} disabled={busy} onChange={(event) => setQuality(Number(event.target.value))} /><output>{quality}</output></label>}
          <label className="home-size">尺寸<select name="maxWidth" value={width} onChange={(event) => setWidth(event.target.value)} disabled={busy}><option value="">保持原始尺寸</option><option value="1920">最长宽度 1920px</option><option value="1280">最长宽度 1280px</option><option value="640">最长宽度 640px</option></select></label>
          <button type="submit" className="secondary" disabled={busy}>用此参数进入工作台<ArrowRight size={15} /></button>
        </form>
      </section>
      {error && <p role="alert" className="home-error">{error}</p>}
      <p className="home-demo-note">示例图片仅供体验转换效果。修改格式、画质或尺寸后，点击「重新转换示例」即可查看变化。</p>

      <section className="home-formats" id="formats">
        <h2>还支持这些格式</h2>
        <div className="home-format-list">{outputFormats.slice(4).map((item) => { const Icon = formatIcons[item.id] ?? FileImage; return <a key={item.id} href={`/convert/?format=${item.id}`}><Icon size={21} strokeWidth={1.5} /><span>{item.label}</span></a>; })}</div>
        <p><Info size={15} />HEIC、SVG 支持导入与导出，HEIF 可导入。SVG 导出为矢量描摹；PSD 只保留合成图。</p>
      </section>
      <section className="home-guide" id="guide"><h2>批量处理说明</h2><div><p>在转换工作台中可一次添加多张图片，统一设置目标格式、编码质量和最大宽高。转换完成后可单张下载，也可打包为 ZIP。</p><p>单张图片上限为 40 MB、4800 万像素。图片任务和转换结果会自动保存在此设备，刷新或重开页面可继续；清空任务会删除本地副本。</p><a href="/convert/">进入转换工作台<ArrowRight size={16} /></a></div></section>
      <footer><span>PixelForge</span><span>支持 16 种图片格式</span></footer>
    </main>
  </div>;
}
