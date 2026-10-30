'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown,
  CircleHelp, FileImage, FolderOpen, LoaderCircle, LockKeyhole,
  ImagePlus, Maximize2, Pause, Plus, RefreshCw, ShieldCheck, SlidersHorizontal, Square, Trash2, Upload, X, Zap,
} from 'lucide-react';
import { zipSync } from 'fflate';
import { createEngine, formats, MAX_FILE_BYTES } from '@pixelforge/image-engine';
import type { Capability, Conversion, ConvertOptions } from '@pixelforge/image-engine';
import { SiteHeader } from './SiteHeader';
import { openTaskStore } from './task-store';
import type { Task, TaskOutput } from './task-store';
import { concurrencyFor, needsExclusive, runQueue } from './task-runner';
import { ImageComparison } from './ImageComparison';
import { useImageI18n } from './i18n';

type Output = TaskOutput & { url: string; before: string; after: string };
type Item = Omit<Task, 'output'> & { sourceUrl: string; output?: Output };
const initialOptions: ConvertOptions = { format: 'WEBP', quality: 82, stripMetadata: true, background: '#ffffff' };
const accept = formats.map((format) => `.${format.extension}`).concat('.jpeg', '.heif', '.tif').join(',');
const size = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;

function stored(item: Item): Task {
  const { sourceUrl, output, ...task } = item;
  if (!output) return task;
  const { url, before, after, ...result } = output;
  return { ...task, output: result };
}

function save(url: string, name: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
}

function newEngine() { return createEngine(new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' })); }

export function App() {
  const { t } = useImageI18n();
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
  const [preview, setPreview] = useState<{ key: string; output?: Output; error?: string }>();
  const [processed, setProcessed] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);
  const [parallelism, setParallelism] = useState(1);
  const [advancedFormats, setAdvancedFormats] = useState(false);
  const [queueLoading, setQueueLoading] = useState(true);
  const [temporaryReason, setTemporaryReason] = useState('');
  const [persistent, setPersistent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stopping, setStopping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);
  const extraEngines = useRef(new Set<ReturnType<typeof createEngine>>());
  const urls = useRef(new Set<string>());
  const store = useRef<Awaited<ReturnType<typeof openTaskStore>> | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const editing = useRef(false);
  const running = useRef(false);
  const mounted = useRef(false);
  const control = useRef({ mode: 'run' as 'run' | 'pause' | 'cancel' });
  const active = items.find((item) => item.id === selected) ?? items[0];
  const done = items.filter((item) => item.output);
  const target = formats.find((format) => format.id === options.format)!;
  const writable = formats.filter((format) => capabilities.some((item) => item.id === format.id && item.write));
  const ready = capabilities.length > 0 && !engineError;
  const originalTotal = done.reduce((sum, item) => sum + item.file.size, 0);
  const outputTotal = done.reduce((sum, item) => sum + item.output!.size, 0);
  const locked = queueLoading || saving;
  const resumable = items.some((item) => item.status === 'paused' || item.status === 'interrupted' || (item.status === 'waiting' && item.options));
  const previewKey = `${active?.id}:${JSON.stringify(options)}`;
  const currentOutput = active?.output && JSON.stringify(active.options) === JSON.stringify(options) ? active.output : undefined;
  const comparison = currentOutput ?? (!busy && !locked && ready && preview?.key === previewKey ? preview.output : undefined);
  const comparisonError = preview?.key === previewKey ? preview.error : undefined;
  const statusNames = t.app.statusNames;

  useEffect(() => {
    let active = true;
    mounted.current = true;
    let unlock: () => void;
    const lifetime = new Promise<void>((resolve) => { unlock = resolve; });
    function applyOptions(saved = initialOptions) {
      const query = new URLSearchParams(window.location.search);
      const requested = formats.find((item) => item.id === query.get('format'));
      const quality = Number(query.get('quality'));
      const width = Number(query.get('maxWidth'));
      const next = { ...saved,
        format: requested?.id ?? saved.format,
        quality: Number.isInteger(quality) && quality >= 1 && quality <= 100 ? quality : saved.quality,
        maxWidth: query.has('maxWidth') ? Number.isInteger(width) && width >= 1 && width <= 16384 ? width : undefined : saved.maxWidth,
      };
      setOptions(next);
      if (!formats.slice(0, 8).some((item) => item.id === next.format)) setAdvancedFormats(true);
    }
    function useTemporaryWorkspace(reason: string) {
      setPersistent(false);
      applyOptions();
      setTemporaryReason(reason);
      setQueueLoading(false);
    }
    async function initialize() {
      if (!navigator.locks) {
        useTemporaryWorkspace('此浏览器暂不支持自动保存任务。');
        return;
      }
      let workspace = sessionStorage.getItem('pixelforge-workspace');
      if (!workspace) {
        workspace = localStorage.getItem('pixelforge-workspaces-enabled') ? crypto.randomUUID() : 'legacy';
        sessionStorage.setItem('pixelforge-workspace', workspace);
      }
      const queueLock = workspace === 'legacy' ? 'pixelforge-task-queue' : `pixelforge-task-queue:${workspace}`;
      await navigator.locks.request(queueLock, { ifAvailable: true }, async (lock) => {
        if (!active) return;
        if (!lock) {
          sessionStorage.setItem('pixelforge-workspace', crypto.randomUUID());
          await initialize();
          return;
        }
        if (workspace === 'legacy') localStorage.setItem('pixelforge-workspaces-enabled', 'true');
        let client: Awaited<ReturnType<typeof openTaskStore>> | undefined;
        try {
          client = await openTaskStore(workspace);
          const saved = await client.load();
          if (!active) return;
          store.current = client;
          setPersistent(true);
          applyOptions(saved.options);
          void navigator.storage?.persist?.().catch(() => false);
          const tasks = saved.tasks.sort((a, b) => a.order - b.order).map((task): Task => task.status === 'working' ? { ...task, status: 'interrupted' } : task);
          await client.put(tasks.filter((task) => task.status === 'interrupted'));
          if (!active) return;
          updateItems(tasks.map((task) => ({ ...task, sourceUrl: makeUrl(task.file), output: task.output ? showOutput(task.output) : undefined })));
          if (tasks.length) setMessage('已恢复此标签页的任务。已完成结果可下载，未完成任务可继续。');
        } catch {
          if (active) useTemporaryWorkspace('暂时无法访问本机的任务存储。');
        } finally {
          if (active) setQueueLoading(false);
          await lifetime;
          client?.close();
        }
      });
    }
    void initialize().catch(() => { if (active) useTemporaryWorkspace('暂时无法启用自动保存。'); });
    return () => { active = false; mounted.current = false; unlock!(); };
  }, []);

  useEffect(() => {
    if (!temporaryReason || !items.length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [temporaryReason, items.length]);

  function updateItems(next: Item[]) { itemsRef.current = next; setItems(next); }

  function makeUrl(blob: Blob) {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  }
  function release(url: string) { URL.revokeObjectURL(url); urls.current.delete(url); }
  function releaseOutput(output?: Output) { if (output) [output.url, output.before, output.after].forEach(release); }
  function showOutput(output: TaskOutput): Output {
    return { ...output, url: makeUrl(output.files.data), before: makeUrl(output.files.before), after: makeUrl(output.files.after) };
  }
  function conversionOutput(file: File, options: ConvertOptions, result: Conversion): Output {
    const format = formats.find((entry) => entry.id === options.format)!;
    return showOutput({
      files: {
        data: new Blob([result.data], { type: format.mime }),
        before: new Blob([result.before], { type: 'image/png' }),
        after: new Blob([result.after], { type: 'image/png' }),
      },
      name: `${file.name.replace(/\.[^.]+$/, '')}.${format.extension}`,
      size: result.data.byteLength, width: result.width, height: result.height,
      originalWidth: result.originalWidth, originalHeight: result.originalHeight, format: format.label,
    });
  }

  useEffect(() => {
    if (!active || !ready || busy || locked || currentOutput) return;
    let cancelled = false;
    let client: ReturnType<typeof createEngine> | undefined;
    let output: Output | undefined;
    setPreview({ key: previewKey });
    const timer = setTimeout(async () => {
      client = newEngine();
      try {
        const result = await client.convert(active.file, options);
        if (cancelled) return;
        output = conversionOutput(active.file, options, result);
        setPreview({ key: previewKey, output });
      } catch (error) {
        if (!cancelled) setPreview({ key: previewKey, error: error instanceof Error ? error.message : '预览转换失败，请重试。' });
      } finally { client.dispose(); }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); client?.dispose(); releaseOutput(output); };
  }, [previewKey, active?.output, ready, busy, locked]);

  async function edit(action: () => Promise<void>) {
    if (editing.current || running.current || queueLoading) return;
    editing.current = true;
    setPreview(undefined);
    setSaving(true);
    try { await action(); }
    catch { setMessage('无法保存任务变更，请检查设备存储空间后重试。变更未应用。'); }
    finally { editing.current = false; if (mounted.current) setSaving(false); }
  }

  useEffect(() => {
    let mounted = true;
    setCapabilities([]);
    setEngineError('');
    const client = newEngine();
    engine.current = client;
    client.ready.then((result) => {
      if (!mounted) return;
      setCapabilities(result);
      if (!result.some((item) => item.id === 'WEBP' && item.write)) {
        const fallback = result.find((item) => item.write);
        if (fallback) setOptions((previous) => ({ ...previous, format: fallback.id }));
      }
    }).catch((error: Error) => { if (mounted) setEngineError(error.message); });
    return () => { mounted = false; client.dispose(); extraEngines.current.forEach((extra) => extra.dispose()); extraEngines.current.clear(); };
  }, [engineVersion]);

  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  useEffect(() => { if (modal) document.getElementById('reference')?.scrollIntoView({ block: 'start' }); }, [modal]);

  async function addFiles(files: File[]) {
    if (busy || locked || editing.current || running.current) return;
    const errors: string[] = [];
    const next = files.filter((file) => {
      if (!file.size || file.size > MAX_FILE_BYTES) { errors.push(`${file.name}：文件为空或超过 40 MB`); return false; }
      if (!accept.split(',').some((extension) => file.name.toLowerCase().endsWith(extension))) {
        errors.push(`${file.name}：暂不支持此扩展名`); return false;
      }
      return true;
    }).map((file, index): Item => ({ id: crypto.randomUUID(), file, order: Math.max(0, ...itemsRef.current.map((item) => item.order)) + index + 1, sourceUrl: makeUrl(file), status: 'waiting' }));
    await edit(async () => {
      try {
        if (persistent) await store.current!.put(next.map(stored));
        updateItems([...itemsRef.current, ...next]);
        if (next.length) setSelected(next[0].id);
        setMessage(errors.join('；'));
      } catch (error) { next.forEach((item) => release(item.sourceUrl)); throw error; }
    });
  }

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files.length) { event.preventDefault(); addFiles(Array.from(event.clipboardData.files)); }
    };
    document.addEventListener('paste', paste);
    return () => document.removeEventListener('paste', paste);
  }, [busy, locked, persistent]);

  async function loadSample() {
    try {
      const response = await fetch('/sample-landscape.png');
      if (!response.ok) throw new Error('示例加载失败');
      await addFiles([new File([await response.blob()], '示例-山景.png', { type: 'image/png' })]);
    } catch { setMessage('无法加载示例图片，请导入本地图片。'); }
  }

  async function removeItem(item: Item) {
    await edit(async () => {
      if (persistent) await store.current!.remove(item.id);
      release(item.sourceUrl);
      releaseOutput(item.output);
      updateItems(itemsRef.current.filter(({ id }) => id !== item.id));
    });
  }

  async function clearItems() {
    await edit(async () => {
      if (persistent) await store.current!.remove();
      itemsRef.current.forEach((item) => { release(item.sourceUrl); releaseOutput(item.output); });
      updateItems([]);
      setSelected(undefined);
    });
  }

  async function run(mode: 'all' | 'resume' | 'retry' = 'all') {
    if (!ready || !engine.current || running.current || locked || editing.current || !items.length) return;
    const client = engine.current;
    const clients: (ReturnType<typeof createEngine> | undefined)[] = [client];
    const limit = concurrencyFor(navigator.hardwareConcurrency, (navigator as Navigator & { deviceMemory?: number }).deviceMemory);
    const retriable: Item[] = [];
    const finished = new Set<string>();
    const estimates = new Map<Item, Promise<boolean>>();
    const exclusiveJobs = new Set<Item>();
    let serial = false;
    const snapshot = { ...options };
    const signal = { mode: 'run' as 'run' | 'pause' | 'cancel' };
    const cancelled = () => signal.mode === 'cancel';
    control.current = signal;
    running.current = true;
    setPreview(undefined);
    setBusy(true);
    setProcessed(0);
    setParallelism(limit);
    setStopping(false);
    setMessage('');
    const jobs = itemsRef.current.filter((item) => mode === 'all' || (mode === 'retry' ? item.status === 'error' : ['paused', 'interrupted', 'waiting'].includes(item.status)))
      .map((item): Item => ({ ...item, status: 'waiting', options: mode === 'all' ? snapshot : item.options ?? snapshot, output: undefined, error: undefined }));
    setProcessingTotal(jobs.length);
    async function commit(item: Item) {
      if (persistent) await store.current!.put([stored(item)]);
      if (mounted.current) updateItems(itemsRef.current.map((entry) => entry.id === item.id ? item : entry));
    }
    async function execute(item: Item, slot: number, retry = false) {
      if (!mounted.current || signal.mode !== 'run') return;
      if (exclusiveJobs.has(item) || retry) {
        clients.slice(1).forEach((extra) => { extra?.dispose(); if (extra) extraEngines.current.delete(extra); });
        clients.length = 1;
      }
      setSelected(item.id);
      await commit({ ...item, status: 'working' });
      if (!mounted.current || signal.mode !== 'run') return;
      let completed: Item;
      let worker = clients[slot];
      try {
        if (!worker || worker.failed) {
          worker = newEngine();
          extraEngines.current.add(worker);
          clients[slot] = worker;
        }
        const result = await worker.convert(item.file, item.options!);
        if (!mounted.current) return;
        const output = conversionOutput(item.file, item.options!, result);
        completed = { ...item, status: cancelled() ? 'cancelled' : 'done', output: cancelled() ? undefined : output };
        if (cancelled()) releaseOutput(output);
      } catch (error) {
        if (!mounted.current) return;
        const message = error instanceof Error ? error.message : '转换失败';
        if (!cancelled() && (worker?.failed || /内存不足|out of memory|memory access|memory allocation/i.test(message))) {
          serial = true;
          setParallelism(1);
          worker?.dispose();
          clients[slot] = undefined;
          if (!retry) retriable.push(item);
        }
        completed = { ...item, status: cancelled() ? 'cancelled' : 'error', error: cancelled() ? undefined : message };
      }
      try { await commit(completed); }
      catch (error) { releaseOutput(completed.output); throw error; }
      finished.add(item.id);
      if (mounted.current) setProcessed(finished.size);
    }
    try {
      if (persistent) await store.current!.put(jobs.map(stored), snapshot);
      if (!mounted.current) return;
      const queued = new Map(jobs.map((item) => [item.id, item]));
      itemsRef.current.forEach((item) => { if (queued.has(item.id)) releaseOutput(item.output); });
      updateItems(itemsRef.current.map((item) => queued.get(item.id) ?? item));
      const stopped = () => !mounted.current || signal.mode !== 'run';
      await runQueue(jobs, limit, execute, stopped, async (item) => {
        if (!estimates.has(item)) estimates.set(item, needsExclusive(item.file));
        const alone = await estimates.get(item) || serial;
        if (alone) exclusiveJobs.add(item);
        return alone;
      });
      if (retriable.length && !stopped()) {
        setMessage('部分图片遇到内存或引擎错误，已降低为逐张处理并重试一次。');
        await runQueue(retriable, 1, (item, slot) => execute(item, slot, true), stopped, async () => true);
      }
      if (!mounted.current) return;
      if (signal.mode !== 'run') {
        const pending = itemsRef.current.filter((item) => ['waiting', 'working'].includes(item.status))
          .map((item): Item => ({ ...item, status: signal.mode === 'cancel' ? 'cancelled' : 'paused' }));
        if (persistent) await store.current!.put(pending.map(stored));
        const stopped = new Map(pending.map((item) => [item.id, item]));
        updateItems(itemsRef.current.map((item) => stopped.get(item.id) ?? item));
      }
    } catch {
      if (mounted.current) {
        updateItems(itemsRef.current.map((item) => item.status === 'working' ? { ...item, status: 'interrupted' } : item.status === 'waiting' && item.options ? { ...item, status: 'paused' } : item));
        setMessage('任务保存失败，已停止领取新图片。请检查存储空间后继续。');
      }
    } finally {
      extraEngines.current.forEach((extra) => extra.dispose());
      extraEngines.current.clear();
      if (exclusiveJobs.size) client.dispose();
      if (mounted.current && !cancelled() && client.failed) { setCapabilities([]); setEngineVersion((version) => version + 1); }
      running.current = false;
      if (mounted.current) { setBusy(false); setStopping(false); }
    }
  }

  function stop(mode: 'pause' | 'cancel') {
    control.current.mode = mode;
    setStopping(true);
    if (mode === 'cancel') { engine.current?.dispose(); extraEngines.current.forEach((extra) => extra.dispose()); setCapabilities([]); setEngineVersion((version) => version + 1); }
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

  return <div className="app-shell" aria-busy={locked} onDragStart={(event) => event.preventDefault()} onDragOver={(event) => { event.preventDefault(); setDragging(!busy && !locked && event.dataTransfer.types.includes('Files')); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.types.includes('Files')) void addFiles(Array.from(event.dataTransfer.files)); }}>
    <SiteHeader active="convert" onFormats={() => setModal('formats')} onHelp={() => setModal('help')} />

    <main>
      <section className="pdf-studio-bar workspace-intro">
        <div className="pdf-studio-title">
          <h1>{t.app.workbenchTitle}</h1>
          <span className="pdf-studio-sep" aria-hidden="true" />
          <span className="pdf-mode-badge">{target.label}</span>
          <p className="pdf-mode-summary">{t.app.workbenchSummary}</p>
        </div>
        <span className="pdf-status-pill"><LockKeyhole size={12} />{temporaryReason ? t.app.pillTemp : items.length ? t.app.pillQueue.replace('{0}', String(items.length)).replace('{1}', String(done.length)) : t.app.pillOffline}</span>
      </section>
      {temporaryReason && <div className="workspace-session-notice" role="status" aria-label="工作区保存方式"><CircleHelp size={17} /><div><strong>{t.app.tempNoticeTitle}</strong><p>{temporaryReason} {t.app.tempNoticeDesc}</p></div></div>}
      {(saving || (!busy && (resumable || items.some((item) => item.status === 'error')))) && <div className="task-controls" aria-label="任务保存与恢复">
        {saving && <span role="status">{persistent ? t.app.saving : t.app.updating}</span>}
        {!busy && resumable && <button disabled={locked || !ready} onClick={() => void run('all')}>{t.app.reconvertAll}</button>}
        {!busy && items.some((item) => item.status === 'error') && <button disabled={locked || !ready} onClick={() => void run('retry')}>{t.app.retryFailed}</button>}
      </div>}
      <section className="workspace">
        <div className="workspace-main">
          <div className="panel-heading"><h2><FolderOpen size={17} />{t.app.yourImages}<span className="count">{items.length.toString().padStart(2, '0')}</span></h2><div className="toolbar">{!!items.length && <button disabled={busy || zipping || locked} onClick={() => void clearItems()}><Trash2 size={14} />{t.app.clear}</button>}<button disabled={busy || locked} onClick={() => inputRef.current?.click()}><Plus size={16} />{t.app.addImages}</button></div></div>

          {!items.length ? <div className={`dropzone ${dragging ? 'dragging' : ''}`}>
            <div className="import-icon" aria-hidden="true"><ImagePlus size={46} strokeWidth={1.2} /></div>
            <h3>{t.app.dropTitle}</h3><p>{t.app.dropSubtitle}</p><button className="primary import-button" disabled={locked} onClick={() => inputRef.current?.click()}><Upload size={17} />{t.app.chooseImages}<ArrowUpRight size={16} /></button><div className="drop-hint">{t.app.supportedFormatsHint}<span>{t.app.maxSizePerFile}</span></div><div className="sample-line">{t.app.noImagesHint}<button disabled={locked} onClick={loadSample}>{t.app.trySampleAction}<ArrowRight size={13} /></button></div>
          </div> : <>
            {active && <ImageComparison key={comparison?.url ?? previewKey} source={active.sourceUrl} file={active.file} result={comparison} targetFormat={target.label} working={!comparison && !comparisonError} previewError={comparisonError} />}
            <div className="file-list">{items.map((item, index) => <div key={item.id} className={`file-row ${active?.id === item.id ? 'selected' : ''}`}><button className="file-select" onClick={() => setSelected(item.id)} aria-label={`预览 ${item.file.name}`}><span className="file-number">{String(index + 1).padStart(2, '0')}</span><span className={`file-icon ${item.status === 'done' ? 'done' : ''}`}>{item.status === 'working' ? <LoaderCircle size={20} className="spin" /> : item.status === 'done' ? <Check size={20} /> : <FileImage size={20} />}</span><span className="file-info"><strong>{item.file.name}</strong><span>{size(item.file.size)}{item.output && <> <ArrowRight size={11} /> <b>{size(item.output.size)}</b> <span className="result-format">{item.output.format}</span></>}{item.error && <span className="file-error">{item.error}</span>}</span></span></button><span className={`status status-${item.status}`}>{statusNames[item.status]}</span>{item.output && <button className="icon-button" aria-label={`下载 ${item.output.name}`} onClick={() => save(item.output!.url, item.output!.name)}><ArrowDownToLine size={17} /></button>}<button className="icon-button remove" disabled={busy || zipping || locked} aria-label={`移除 ${item.file.name}`} onClick={() => removeItem(item)}><X size={16} /></button></div>)}</div>
            <button className="add-more" disabled={busy || locked} onClick={() => inputRef.current?.click()}><Plus size={15} />{t.app.continueAdd}</button>
          </>}
          <input ref={inputRef} className="sr-only" aria-label="选择图片文件" type="file" multiple accept={accept} disabled={busy || locked} onChange={(event) => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
          <div className="workspace-bottom"><span>{t.app.bottomLimit}</span><span>{t.app.bottomClipboard} <kbd>Ctrl</kbd> + <kbd>V</kbd></span></div>
        </div>

        <aside className="settings">
          <div className="panel-heading"><h2><SlidersHorizontal size={17} />{t.app.settingsTitle}</h2><span className="settings-dot" /></div>
          <fieldset disabled={busy || zipping || locked}>
            <div className="setting-section format-section"><div className="field-title"><label>{t.app.targetFormatLabel}</label>{writable.length > 8 && <button className="text-button" onClick={() => setAdvancedFormats(!advancedFormats)}>{advancedFormats ? t.app.lessFormats : t.app.moreFormats}<ChevronDown size={13} className={advancedFormats ? 'rotate' : ''} /></button>}</div><div className="format-grid">{(advancedFormats ? writable : writable.slice(0, 8)).map((format) => {
              return <button key={format.id} aria-pressed={options.format === format.id} title={format.description} className={`format-option ${options.format === format.id ? 'chosen' : ''}`} onClick={() => setOptions({ ...options, format: format.id })}>{format.label}{options.format === format.id && <Check size={12} />}</button>;
            })}</div><div className="format-note">{target.description}{target.id === 'ICO' && t.app.icoNote}{target.id === 'HEIC' && t.app.heicNote}</div></div>

            {options.format === 'SVG' ? <div className="setting-section"><div className="field-title" id="svg-preset-label">{t.app.svgPresetLabel}</div><div className="format-grid svg-preset-grid" role="group" aria-labelledby="svg-preset-label">{([{ id: 'poster', label: t.app.svgPresets.poster }, { id: 'bw', label: t.app.svgPresets.bw }, { id: 'photo', label: t.app.svgPresets.photo }] as const).map((preset) => <button key={preset.id} className={`format-option${(options.svgPreset ?? 'poster') === preset.id ? ' chosen' : ''}`} aria-pressed={(options.svgPreset ?? 'poster') === preset.id} onClick={() => setOptions({ ...options, svgPreset: preset.id })}>{preset.label}</button>)}</div><p className="field-help">{t.app.svgPresetHelp}</p></div> : target.lossy && <div className="setting-section"><div className="field-title"><label htmlFor="quality">{t.app.imageQuality}</label><output htmlFor="quality" className="quality-value">{target.lossy ? options.quality : '—'}<span>{target.lossy ? '%' : t.app.losslessFixed}</span></output></div><input id="quality" className="quality-slider" type="range" min="1" max="100" value={options.quality} disabled={!target.lossy} onChange={(event) => setOptions({ ...options, quality: Number(event.target.value) })} style={{ '--range': `${options.quality}%` } as React.CSSProperties} /><div className="range-labels"><span>{t.app.smallerSize}</span><span>{t.app.higherQuality}</span></div></div>}

            <div className="setting-section"><div className="field-title"><label htmlFor="max-width">{t.app.resizeTitle}</label><span className="subtle"><Maximize2 size={11} />{t.app.keepAspect}</span></div><div className="dimension-inputs"><div><input id="max-width" aria-label={t.app.maxWidth} type="number" min="1" max="16384" step="1" placeholder={t.app.origWidth} value={options.maxWidth ?? ''} onChange={(event) => setOptions({ ...options, maxWidth: event.target.value ? Number(event.target.value) : undefined })} /><span>W</span></div><X size={12} /><div><input aria-label={t.app.maxHeight} type="number" min="1" max="16384" step="1" placeholder={t.app.origHeight} value={options.maxHeight ?? ''} onChange={(event) => setOptions({ ...options, maxHeight: event.target.value ? Number(event.target.value) : undefined })} /><span>H</span></div></div><p className="field-help">{t.app.resizeHelp}</p></div>

            <div className="setting-section extra-settings">{options.format !== 'HEIC' && options.format !== 'SVG' && <label className="checkbox-row"><input type="checkbox" checked={options.stripMetadata} onChange={(event) => setOptions({ ...options, stripMetadata: event.target.checked })} /><span><strong>{t.app.stripMetadata}</strong><small>{t.app.stripMetadataSub}</small></span><ShieldCheck size={16} /></label>}{(options.format === 'JPEG' || options.format === 'BMP' || options.format === 'HEIC' || options.format === 'SVG') && <label className="background-setting">{t.app.bgFill}<input type="color" value={options.background} onChange={(event) => setOptions({ ...options, background: event.target.value })} /></label>}{options.format === 'SVG' && <p className="field-help">{t.app.svgBgHelp}</p>}</div>
          </fieldset>
          <div className="convert-actions"><button className="primary convert-button" disabled={!ready || !items.length || busy || zipping || locked} onClick={() => void run(resumable ? 'resume' : 'all')}>{busy ? <><LoaderCircle size={17} className="spin" />{t.app.convertingProgress.replace('{0}', String(processed)).replace('{1}', String(processingTotal))}</> : <><Zap size={17} />{resumable ? t.app.resume : done.length ? t.app.reconvert : t.app.convertAll}<span>{items.length ? t.app.itemsCount.replace('{0}', String(items.length)) : <ArrowRight size={17} />}</span></>}</button>{busy && <div className="toolbar task-run-controls"><button disabled={stopping} onClick={() => stop('pause')}><Pause size={14} />{t.app.pause}</button><button disabled={control.current.mode === 'cancel'} onClick={() => stop('cancel')}><Square size={14} />{t.app.cancelRemaining}</button></div>}<p>{busy ? stopping ? t.app.stoppingHint : t.app.parallelHint.replace('{0}', String(parallelism)) : resumable ? t.app.resumeHint : ready ? t.app.targetFormatHint.replace('{0}', target.label) : engineError ? t.app.engineError : t.app.enginePreparing}</p>{engineError && <div className="engine-error" role="alert">{engineError}<button onClick={() => setEngineVersion((version) => version + 1)}><RefreshCw size={12} />{t.app.reloadEngine}</button></div>}</div>
        </aside>
      </section>

      {message && <div className="notice" role="alert"><CircleHelp size={16} /><span>{message}</span><button aria-label="关闭提示" onClick={() => setMessage('')}><X size={15} /></button></div>}
      {!!done.length && <section className="download-bar"><span className="complete-icon"><CheckCheck size={21} /></span><div><strong>{t.app.doneBanner.replace('{0}', String(done.length))}</strong><p>{size(originalTotal)} <ArrowRight size={12} /> {size(outputTotal)} <span>{outputTotal < originalTotal ? t.app.savedPercent.replace('{0}', ((1 - outputTotal / originalTotal) * 100).toFixed(1)) : t.app.largerWarning}</span></p></div><button className="primary" disabled={busy || zipping || locked} onClick={downloadAll}>{zipping ? <LoaderCircle className="spin" size={16} /> : <ArrowDownToLine size={16} />}{t.app.downloadZip}</button></section>}

      <div className="tool-note"><ShieldCheck size={16} /><p>{t.app.staticOnlyTip}</p><button onClick={() => setModal('formats')}>{t.app.viewFormatSupport}<ArrowUpRight size={13} /></button></div>
      <footer><span>PixelForge</span><span className={`engine-status ${ready ? 'online' : ''}`}><span />{ready ? t.app.engineOnline.replace('{0}', String(writable.length)) : engineError ? t.app.engineNeedsReload : t.app.enginePreparing}</span></footer>
    </main>

    {modal && <section id="reference" className="reference-panel" aria-label={modal === 'formats' ? t.app.formatSupportTitle : t.app.userGuideTitle}><div className="dialog-content"><div className="dialog-heading"><h2>{modal === 'formats' ? t.app.formatSupportTitle : t.app.userGuideTitle}</h2><button className="icon-button" aria-label="收起说明" onClick={() => setModal(null)}><X size={20} /></button></div>{modal === 'formats' ? <><p className="dialog-description">{t.app.formatsIntro}</p><div className="format-table"><div className="format-table-heading"><span>{t.app.formatHeaderCol}</span><span>{t.app.importCol}</span><span>{t.app.exportCol}</span></div>{formats.map((format) => { const ability = capabilities.find((item) => item.id === format.id); return <div key={format.id}><span><strong>{format.label}</strong><small>{format.description}</small></span><span className={ability?.read ? 'supported' : ''}>{ready ? ability?.read ? t.app.supported : t.app.notSupported : t.app.detecting}</span><span className={ability?.write ? 'supported' : ''}>{ready ? ability?.write ? t.app.supported : t.app.notSupported : t.app.detecting}</span></div>; })}</div><p className="field-help">{t.app.formatsFooterHelp}</p></> : <div className="guide"><article><span>01</span><div><h3>{t.app.guideSteps.step1Title}</h3><p>{t.app.guideSteps.step1Desc}</p></div></article><article><span>02</span><div><h3>{t.app.guideSteps.step2Title}</h3><p>{t.app.guideSteps.step2Desc}</p></div></article><article><span>03</span><div><h3>{t.app.guideSteps.step3Title}</h3><p>{t.app.guideSteps.step3Desc}</p></div></article><div className="guide-note"><LockKeyhole size={19} /><p>{temporaryReason ? t.app.guideSessionNotice : t.app.guidePersistentNotice}</p></div></div>}</div></section>}
    {dragging && !busy && <div className="drag-overlay"><Upload size={42} /><strong>{t.app.dragOverlayTitle}</strong><span>{t.app.dragOverlaySub}</span></div>}
  </div>;
}
