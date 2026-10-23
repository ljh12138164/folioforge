'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown,
  CircleHelp, FileImage, FolderOpen, LoaderCircle, LockKeyhole,
  ImagePlus, Maximize2, Plus, RefreshCw, ShieldCheck, SlidersHorizontal, Trash2, Upload, X, Zap,
} from 'lucide-react';
import { zipSync } from 'fflate';
import { createEngine, formats, MAX_FILE_BYTES } from '@pixelforge/image-engine';
import type { Capability, ConvertOptions } from '@pixelforge/image-engine';
import { SiteHeader } from './SiteHeader';

type Output = { url: string; before: string; after: string; name: string; size: number; width: number; height: number; originalWidth: number; originalHeight: number; format: string };
type Item = { id: string; file: File; sourceUrl: string; status: 'waiting' | 'working' | 'done' | 'error'; output?: Output; error?: string };
const initialOptions: ConvertOptions = { format: 'WEBP', quality: 82, stripMetadata: true, background: '#ffffff' };
const accept = formats.map((format) => `.${format.extension}`).concat('.jpeg', '.heif', '.tif').join(',');
const size = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
const statusNames = { waiting: '等待转换', working: '转换中', done: '已完成', error: '未完成' };

function save(url: string, name: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
}

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string>();
  const [options, setOptions] = useState(initialOptions);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [engineError, setEngineError] = useState('');
  const [engineVersion, setEngineVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [modal, setModal] = useState<'formats' | 'help' | null>(null);
  const [split, setSplit] = useState(50);
  const [previewError, setPreviewError] = useState<string>();
  const [processed, setProcessed] = useState(0);
  const [advancedFormats, setAdvancedFormats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);
  const urls = useRef(new Set<string>());
  const active = items.find((item) => item.id === selected) ?? items[0];
  const done = items.filter((item) => item.output);
  const target = formats.find((format) => format.id === options.format)!;
  const writable = formats.filter((format) => capabilities.some((item) => item.id === format.id && item.write));
  const ready = capabilities.length > 0 && !engineError;
  const originalTotal = done.reduce((sum, item) => sum + item.file.size, 0);
  const outputTotal = done.reduce((sum, item) => sum + item.output!.size, 0);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requested = formats.find((item) => item.id === query.get('format') && !['HEIC', 'SVG'].includes(item.id));
    const quality = Number(query.get('quality'));
    const width = Number(query.get('maxWidth'));
    setOptions((previous) => ({ ...previous,
      format: requested?.id ?? previous.format,
      quality: Number.isInteger(quality) && quality >= 1 && quality <= 100 ? quality : previous.quality,
      maxWidth: Number.isInteger(width) && width >= 1 && width <= 16384 ? width : undefined,
    }));
    if (requested && !formats.slice(0, 8).includes(requested)) setAdvancedFormats(true);
  }, []);

  function makeUrl(blob: Blob) {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  }
  function release(url: string) { URL.revokeObjectURL(url); urls.current.delete(url); }
  function releaseOutput(output?: Output) { if (output) [output.url, output.before, output.after].forEach(release); }

  useEffect(() => {
    let mounted = true;
    setCapabilities([]);
    setEngineError('');
    const client = createEngine(new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }));
    engine.current = client;
    client.ready.then((result) => {
      if (!mounted) return;
      setCapabilities(result);
      if (!result.some((item) => item.id === 'WEBP' && item.write)) {
        const fallback = result.find((item) => item.write);
        if (fallback) setOptions((previous) => ({ ...previous, format: fallback.id }));
      }
    }).catch((error: Error) => { if (mounted) setEngineError(error.message); });
    return () => { mounted = false; client.dispose(); };
  }, [engineVersion]);

  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  useEffect(() => { if (modal) document.getElementById('reference')?.scrollIntoView({ block: 'start' }); }, [modal]);

  function addFiles(files: File[]) {
    if (busy) return;
    const errors: string[] = [];
    const next = files.filter((file) => {
      if (!file.size || file.size > MAX_FILE_BYTES) { errors.push(`${file.name}：文件为空或超过 40 MB`); return false; }
      if (!accept.split(',').some((extension) => file.name.toLowerCase().endsWith(extension))) {
        errors.push(`${file.name}：暂不支持此扩展名`); return false;
      }
      return true;
    }).map((file): Item => ({ id: crypto.randomUUID(), file, sourceUrl: makeUrl(file), status: 'waiting' }));
    setItems((previous) => [...previous, ...next]);
    if (next.length) setSelected(next[0].id);
    setMessage(errors.join('；'));
  }

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files.length) { event.preventDefault(); addFiles(Array.from(event.clipboardData.files)); }
    };
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [busy]);

  async function loadSample() {
    try {
      const response = await fetch('/sample-landscape.png');
      if (!response.ok) throw new Error('示例加载失败');
      addFiles([new File([await response.blob()], '示例-山景.png', { type: 'image/png' })]);
    } catch { setMessage('无法加载示例图片，请导入本地图片。'); }
  }

  function removeItem(item: Item) {
    release(item.sourceUrl);
    releaseOutput(item.output);
    setItems((previous) => previous.filter(({ id }) => id !== item.id));
  }

  async function run() {
    if (!ready || !engine.current || busy || !items.length) return;
    const client = engine.current;
    const snapshot = { ...options };
    setBusy(true);
    setMessage('');
    for (const [index, item] of items.entries()) {
      setProcessed(index + 1);
      setSelected(item.id);
      setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, status: 'working', error: undefined } : entry));
      try {
        const result = await client.convert(item.file, snapshot);
        const format = formats.find((entry) => entry.id === snapshot.format)!;
        const output: Output = {
          url: makeUrl(new Blob([result.data], { type: format.mime })),
          before: makeUrl(new Blob([result.before], { type: 'image/png' })),
          after: makeUrl(new Blob([result.after], { type: 'image/png' })),
          name: `${item.file.name.replace(/\.[^.]+$/, '')}.${format.extension}`,
          size: result.data.byteLength, width: result.width, height: result.height,
          originalWidth: result.originalWidth, originalHeight: result.originalHeight, format: format.label,
        };
        releaseOutput(item.output);
        setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, status: 'done', output } : entry));
      } catch (error) {
        releaseOutput(item.output);
        setItems((previous) => previous.map((entry) => entry.id === item.id ? { ...entry, status: 'error', output: undefined, error: error instanceof Error ? error.message : '转换失败' } : entry));
      }
    }
    setBusy(false);
  }

  async function downloadAll() {
    setZipping(true);
    try {
      const entries: Record<string, Uint8Array> = Object.create(null);
      for (const item of done) {
        let name = item.output!.name;
        let suffix = 2;
        while (name in entries) name = item.output!.name.replace(/(\.[^.]+)$/, `-${suffix++}$1`);
        entries[name] = new Uint8Array(await (await fetch(item.output!.url)).arrayBuffer());
      }
      const zipped = zipSync(entries, { level: 0 });
      const url = makeUrl(new Blob([new Uint8Array(zipped)], { type: 'application/zip' }));
      save(url, 'pixelforge-images.zip');
      setTimeout(() => release(url), 1000);
    } catch { setMessage('打包失败，请尝试逐张下载。'); }
    finally { setZipping(false); }
  }

  return <div className="app-shell" onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
    <SiteHeader active="convert" onFormats={() => setModal('formats')} onHelp={() => setModal('help')} />

    <main>
      <section className="intro workspace-intro">
        <div><h1>转换工作台</h1><p>添加图片，选好格式后开始转换。</p></div>
        <div className="workspace-label"><span>01 导入图片 → 02 选择格式 → 03 下载结果</span></div>
      </section>
      <section className="workspace">
        <div className="workspace-main">
          <div className="panel-heading"><h2><FolderOpen size={17} />你的图片<span className="count">{items.length.toString().padStart(2, '0')}</span></h2><div className="toolbar">{!!items.length && <button disabled={busy || zipping} onClick={() => { items.forEach((item) => { release(item.sourceUrl); releaseOutput(item.output); }); setItems([]); setSelected(undefined); }}><Trash2 size={14} />清空</button>}<button disabled={busy} onClick={() => inputRef.current?.click()}><Plus size={16} />添加图片</button></div></div>

          {!items.length ? <div className={`dropzone ${dragging ? 'dragging' : ''}`}>
            <div className="import-icon" aria-hidden="true"><ImagePlus size={46} strokeWidth={1.2} /></div>
            <h3>把图片拖到这里</h3><p>或者从设备中选择，一次可以添加多张</p><button className="primary import-button" onClick={() => inputRef.current?.click()}><Upload size={17} />选择图片<ArrowUpRight size={16} /></button><div className="drop-hint">支持 JPG、PNG、WebP、AVIF、HEIC 等格式<span>单张最大 40 MB</span></div><div className="sample-line">手边没有图片？<button onClick={loadSample}>试试这张示例<ArrowRight size={13} /></button></div>
          </div> : <>
            <div className="preview-toolbar"><span><span className="live-dot" />{active?.output ? '转换效果对比' : '原图预览'}</span><span>{active?.output ? `${active.output.originalWidth} × ${active.output.originalHeight} → ${active.output.width} × ${active.output.height}` : active?.file.name}</span></div>
            <div className={`preview checkerboard${active?.output ? ' has-result' : ''}`} style={active?.output ? { aspectRatio: `${active.output.originalWidth} / ${active.output.originalHeight}` } : undefined}>
              {active?.output ? <div className="compare-images"><img src={active.output.after} alt="转换后的图片" style={{ clipPath: `inset(0 0 0 ${split}%)` }} /><img className="before-image" src={active.output.before} alt="转换前的图片" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} /><span className="compare-label label-before">原图</span><span className="compare-label label-after">{active.output.format}</span><div className="compare-divider" style={{ left: `${split}%` }}><span><SlidersHorizontal size={14} /></span></div><input aria-label="拖动以对比转换前后图片" type="range" min="0" max="100" value={split} onChange={(event) => setSplit(Number(event.target.value))} /></div> : <><img key={active?.id} className="source-image" src={active?.sourceUrl} alt="待转换图片预览" style={{ display: previewError === active?.id ? 'none' : undefined }} onError={() => setPreviewError(active?.id)} /><div className="preview-fallback" style={{ display: previewError === active?.id ? undefined : 'none' }}><FileImage size={40} strokeWidth={1} /><span>浏览器无法直接显示的格式<br />转换完成后即可预览</span></div></>}
              {active?.status === 'working' && <div className="working-overlay"><LoaderCircle className="spin" size={26} /><span>正在本地转换…</span></div>}
            </div>
            <div className="file-list">{items.map((item, index) => <div key={item.id} className={`file-row ${active?.id === item.id ? 'selected' : ''}`}><button className="file-select" onClick={() => setSelected(item.id)} aria-label={`预览 ${item.file.name}`}><span className="file-number">{String(index + 1).padStart(2, '0')}</span><span className={`file-icon ${item.status === 'done' ? 'done' : ''}`}>{item.status === 'working' ? <LoaderCircle size={20} className="spin" /> : item.status === 'done' ? <Check size={20} /> : <FileImage size={20} />}</span><span className="file-info"><strong>{item.file.name}</strong><span>{size(item.file.size)}{item.output && <> <ArrowRight size={11} /> <b>{size(item.output.size)}</b> <span className="result-format">{item.output.format}</span></>}{item.error && <span className="file-error">{item.error}</span>}</span></span></button><span className={`status status-${item.status}`}>{statusNames[item.status]}</span>{item.output && <button className="icon-button" aria-label={`下载 ${item.output.name}`} onClick={() => save(item.output!.url, item.output!.name)}><ArrowDownToLine size={17} /></button>}<button className="icon-button remove" disabled={busy || zipping} aria-label={`移除 ${item.file.name}`} onClick={() => removeItem(item)}><X size={16} /></button></div>)}</div>
            <button className="add-more" disabled={busy} onClick={() => inputRef.current?.click()}><Plus size={15} />继续添加，或直接拖入更多图片</button>
          </>}
          <input ref={inputRef} className="sr-only" aria-label="选择图片文件" type="file" multiple accept={accept} disabled={busy} onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
          <div className="workspace-bottom"><span><LockKeyhole size={13} />本地处理 · 无需注册 · 无上传</span><span>也支持粘贴图片 <kbd>Ctrl</kbd> + <kbd>V</kbd></span></div>
        </div>

        <aside className="settings">
          <div className="panel-heading"><h2><SlidersHorizontal size={17} />转换设置</h2><span className="settings-dot" /></div>
          <fieldset disabled={busy || zipping}>
            <div className="setting-section format-section"><div className="field-title"><label>目标格式</label><button className="text-button" onClick={() => setAdvancedFormats(!advancedFormats)}>{advancedFormats ? '收起' : '更多格式'}<ChevronDown size={13} className={advancedFormats ? 'rotate' : ''} /></button></div><div className="format-grid">{(advancedFormats ? writable : formats.slice(0, 8)).map((format) => {
              const supported = capabilities.some((item) => item.id === format.id && item.write);
              return <button key={format.id} disabled={!supported} aria-pressed={options.format === format.id} title={supported ? format.description : ready ? '当前引擎不支持导出此格式' : '引擎加载中'} className={`format-option ${options.format === format.id ? 'chosen' : ''}`} onClick={() => setOptions({ ...options, format: format.id })}>{format.label}{options.format === format.id && <Check size={12} />}</button>;
            })}</div><div className="format-note">{target.description}{target.id === 'ICO' && ' · 最长边 256px'}</div></div>

            <div className="setting-section"><div className="field-title"><label htmlFor="quality">图片质量</label><output htmlFor="quality" className="quality-value">{target.lossy ? options.quality : '—'}<span>{target.lossy ? '%' : '无损 / 固定编码'}</span></output></div><input id="quality" className="quality-slider" type="range" min="1" max="100" value={options.quality} disabled={!target.lossy} onChange={(event) => setOptions({ ...options, quality: Number(event.target.value) })} style={{ '--range': `${options.quality}%` } as React.CSSProperties} /><div className="range-labels"><span>更小体积</span><span>更高画质</span></div></div>

            <div className="setting-section"><div className="field-title"><label htmlFor="max-width">调整尺寸</label><span className="subtle"><Maximize2 size={11} />保持比例</span></div><div className="dimension-inputs"><div><input id="max-width" aria-label="最大宽度" type="number" min="1" max="16384" step="1" placeholder="原始宽度" value={options.maxWidth ?? ''} onChange={(event) => setOptions({ ...options, maxWidth: event.target.value ? Number(event.target.value) : undefined })} /><span>W</span></div><X size={12} /><div><input aria-label="最大高度" type="number" min="1" max="16384" step="1" placeholder="原始高度" value={options.maxHeight ?? ''} onChange={(event) => setOptions({ ...options, maxHeight: event.target.value ? Number(event.target.value) : undefined })} /><span>H</span></div></div><p className="field-help">留空保持原尺寸，只缩小、不放大</p></div>

            <div className="setting-section extra-settings"><label className="checkbox-row"><input type="checkbox" checked={options.stripMetadata} onChange={(event) => setOptions({ ...options, stripMetadata: event.target.checked })} /><span><strong>移除元数据</strong><small>也会移除 ICC 色彩配置</small></span><ShieldCheck size={16} /></label>{(options.format === 'JPEG' || options.format === 'BMP') && <label className="background-setting">透明区域填充颜色<input type="color" value={options.background} onChange={(event) => setOptions({ ...options, background: event.target.value })} /></label>}</div>
          </fieldset>
          <div className="convert-actions"><button className="primary convert-button" disabled={!ready || !items.length || busy || zipping} onClick={run}>{busy ? <><LoaderCircle size={17} className="spin" />正在转换 {processed} / {items.length}</> : <><Zap size={17} />{done.length ? '重新转换' : '转换全部图片'}<span>{items.length ? `${items.length} 张` : <ArrowRight size={17} />}</span></>}</button><p>{busy ? '请保持页面打开，转换在设备上进行' : ready ? '转换在你的设备上完成' : engineError ? '引擎加载失败' : '正在准备本地转换引擎…'}</p>{engineError && <div className="engine-error" role="alert">{engineError}<button onClick={() => setEngineVersion((version) => version + 1)}><RefreshCw size={12} />重新加载引擎</button></div>}</div>
        </aside>
      </section>

      {message && <div className="notice" role="alert"><CircleHelp size={16} /><span>{message}</span><button aria-label="关闭提示" onClick={() => setMessage('')}><X size={15} /></button></div>}
      {!!done.length && <section className="download-bar"><span className="complete-icon"><CheckCheck size={21} /></span><div><strong>{done.length} 张图片已转换</strong><p>{size(originalTotal)} <ArrowRight size={12} /> {size(outputTotal)} <span>{outputTotal < originalTotal ? `节省 ${Math.round((1 - outputTotal / originalTotal) * 100)}%` : '此设置下输出体积更大'}</span></p></div><button className="primary" disabled={busy || zipping} onClick={downloadAll}>{zipping ? <LoaderCircle className="spin" size={16} /> : <ArrowDownToLine size={16} />}下载 ZIP</button></section>}

      <div className="tool-note"><ShieldCheck size={16} /><p>仅处理静态图片。HEIC / HEIF 仅支持导入；PSD 只保留合成图。</p><button onClick={() => setModal('formats')}>查看格式支持<ArrowUpRight size={13} /></button></div>
      <footer><span>PixelForge · 本地图片工具</span><span className={`engine-status ${ready ? 'online' : ''}`}><span />{ready ? `引擎就绪 · ${writable.length} 种导出格式` : engineError ? '引擎需要重新加载' : '本地引擎准备中'}</span></footer>
    </main>

    {modal && <section id="reference" className="reference-panel" aria-label={modal === 'formats' ? '格式支持' : '使用指南'}><div className="dialog-content"><div className="dialog-heading"><h2>{modal === 'formats' ? '格式支持' : '使用指南'}</h2><button className="icon-button" aria-label="收起说明" onClick={() => setModal(null)}><X size={20} /></button></div>{modal === 'formats' ? <><p className="dialog-description">导入与导出分别检测。SVG 通过浏览器栅格化；其他格式由本地 WASM 处理。仅转换静态图像，PSD 仅读取合成图。</p><div className="format-table"><div className="format-table-heading"><span>格式 / 用途</span><span>导入</span><span>导出</span></div>{formats.map((format) => { const ability = capabilities.find((item) => item.id === format.id); return <div key={format.id}><span><strong>{format.label}</strong><small>{format.description}</small></span><span className={ability?.read ? 'supported' : ''}>{ready ? ability?.read ? '支持' : '不支持' : '检测中'}</span><span className={ability?.write ? 'supported' : ''}>{ready ? ability?.write ? '支持' : '不支持' : '检测中'}</span></div>; })}</div><p className="field-help">不包含 PDF、相机 RAW 与位图转矢量。EXR 等高动态范围文件的色深和色彩保真不在本版承诺范围内。</p></> : <div className="guide"><article><span>01</span><div><h3>导入你的图片</h3><p>选择文件、拖入文件或粘贴剪贴板图片。每张不超过 40 MB、4800 万像素。</p></div></article><article><span>02</span><div><h3>选择格式，调整设置</h3><p>选择目标格式和质量；宽高指定最大边界，始终等比缩小。ICO 最长边为 256px。JPG / BMP 的透明区域会填充所选背景色。</p></div></article><article><span>03</span><div><h3>预览，然后下载</h3><p>转换完成后拖动分割线对比效果，逐张下载或打包 ZIP。更改设置后点击「重新转换」更新结果。</p></div></article><div className="guide-note"><LockKeyhole size={19} /><p>图片只在内存中处理。刷新或关闭页面会清空列表，请先下载结果。网页版首次访问需要下载转换引擎；桌面版随应用提供。</p></div></div>}</div></section>}
    {dragging && !busy && <div className="drag-overlay"><Upload size={42} /><strong>松开，添加到工作台</strong><span>图片会留在你的设备里</span></div>}
  </div>;
}
