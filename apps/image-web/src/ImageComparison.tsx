'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDownToLine, ArrowLeftRight, Expand, LoaderCircle, Minimize2, Minus, Plus, Scan } from 'lucide-react';
import type { TaskOutput } from './task-store';
import { useImageI18n } from './i18n';

type Result = TaskOutput & { url: string; before: string; after: string };
const size = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function ImageComparison({ source, file, result, targetFormat, working, previewError }: { source: string; file: File; result?: Result; targetFormat: string; working: boolean; previewError?: string }) {
  const { t } = useImageI18n();
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ pointer: number; element: HTMLElement; mode: 'pan' | 'split'; x: number; y: number; panX: number; panY: number } | null>(null);
  const [frame, setFrame] = useState({ width: 1, height: 1 });
  const [natural, setNatural] = useState({ width: result?.originalWidth ?? 1, height: result?.originalHeight ?? 1 });
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [pan, setPan] = useState({ x: 0, y: 0 }), [split, setSplit] = useState(50);
  const [before, setBefore] = useState(source), [after, setAfter] = useState(result?.url);
  const [fallback, setFallback] = useState(false), [error, setError] = useState('');
  const [fullscreen, setFullscreen] = useState(false), [canFullscreen, setCanFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const scale = zoom === 'fit' ? Math.min(1, frame.width / natural.width, frame.height / natural.height) : zoom;
  const width = natural.width * scale, height = natural.height * scale;
  const bound = (x: number, y: number, at = scale) => ({ x: clamp(x, Math.max(0, (natural.width * at - frame.width) / 2)), y: clamp(y, Math.max(0, (natural.height * at - frame.height) / 2)) });
  const position = bound(pan.x, pan.y);
  const imageStyle = { width, height, left: `calc(50% + ${position.x}px)`, top: `calc(50% + ${position.y}px)` };
  const change = (next: number | 'fit', point = { x: 0, y: 0 }) => {
    if (next === 'fit') { setZoom('fit'); setPan({ x: 0, y: 0 }); return; }
    next = Math.max(.05, Math.min(8, next));
    setPan(bound(point.x - (point.x - position.x) * next / scale, point.y - (point.y - position.y) * next / scale, next));
    setZoom(next);
  };
  function end() {
    const active = gesture.current;
    gesture.current = null;
    if (active?.element.hasPointerCapture(active.pointer)) active.element.releasePointerCapture(active.pointer);
    setDragging(false);
  }
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setFrame({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage.current!);
    const full = () => setFullscreen(document.fullscreenElement === root.current);
    setCanFullscreen(document.fullscreenEnabled);
    document.addEventListener('fullscreenchange', full);
    window.addEventListener('blur', end);
    return () => { observer.disconnect(); document.removeEventListener('fullscreenchange', full); window.removeEventListener('blur', end); };
  }, []);
  useEffect(() => {
    const element = stage.current!;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const box = element.getBoundingClientRect();
      change(scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2), { x: event.clientX - box.left - box.width / 2, y: event.clientY - box.top - box.height / 2 });
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  });
  const splitAt = (x: number) => {
    const box = stage.current!.getBoundingClientRect();
    setSplit(Math.max(0, Math.min(100, (x - box.left) / box.width * 100)));
  };
  const start = (event: ReactPointerEvent<HTMLElement>, mode: 'pan' | 'split') => {
    event.stopPropagation();
    if (gesture.current || event.button !== 0) return;
    gesture.current = { pointer: event.pointerId, element: event.currentTarget, mode, x: event.clientX, y: event.clientY, panX: position.x, panY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    if (mode === 'split') splitAt(event.clientX);
  };
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const active = gesture.current;
    if (!active || active.pointer !== event.pointerId) return;
    if (active.mode === 'split') splitAt(event.clientX);
    else setPan(bound(active.panX + event.clientX - active.x, active.panY + event.clientY - active.y));
  };
  const finish = (event: ReactPointerEvent<HTMLElement>) => { if (gesture.current?.pointer === event.pointerId) end(); };
  const handlers = { onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish };
  const difference = result && file.size ? (1 - result.size / file.size) * 100 : 0;
  const originalFormat = file.name.split('.').pop()?.toUpperCase() ?? '原图';
  const compatibilityPreview = () => {
    if (!result) return;
    setBefore(result.before); setAfter(result.after); setFallback(true);
  };

  return <section ref={root} className="image-comparison" aria-label={t.compare.title}>
    <div className="image-compare-toolbar">
      <strong><ArrowLeftRight size={15} />{t.compare.title}</strong>
      <div className="image-zoom-controls" role="group" aria-label={t.compare.zoomGroup}>
        <button aria-label={t.compare.zoomOut} disabled={scale <= .05} onClick={() => change(scale / 1.5)}><Minus size={15} /></button>
        <output aria-label={t.compare.zoomRatio}>{Math.round(scale * 100)}%</output>
        <button aria-label={t.compare.zoomIn} disabled={scale >= 8} onClick={() => change(scale * 1.5)}><Plus size={15} /></button>
        <button aria-pressed={zoom === 1} onClick={() => change(1)}>100%</button>
        <button aria-pressed={zoom === 'fit'} onClick={() => change('fit')}><Scan size={14} />{t.compare.fit}</button>
        {canFullscreen && <button aria-label={fullscreen ? t.compare.exitFullscreen : t.compare.enterFullscreen} onClick={() => {
          void (fullscreen ? document.exitFullscreen() : root.current!.requestFullscreen()).catch(() => setError(t.compare.fullscreenUnavailable));
        }}>{fullscreen ? <Minimize2 size={15} /> : <Expand size={15} />}</button>}
      </div>
    </div>
    <div ref={stage} className={`image-compare-stage checkerboard${dragging ? ' is-dragging' : ''}`} onPointerDown={event => start(event, 'pan')} {...handlers}>
      <div className="image-compare-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <img src={before} alt={t.compare.originalAlt} draggable={false} style={imageStyle} onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => {
          if (before === result?.before) setError(t.compare.previewUnavailable);
          else compatibilityPreview();
        }} />
      </div>
      <div className="image-compare-layer" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        {result && <img src={after} alt={t.compare.resultAlt} draggable={false} style={imageStyle} onError={() => {
          if (after === result.after) setError(t.compare.resultUnavailable);
          else compatibilityPreview();
        }} />}
      </div>
      {!result && <div className="image-compare-pending" style={{ width: `${100 - split}%` }} role="status">{working && <LoaderCircle size={20} className="spin" />}<span>{previewError ? t.compare.previewIncomplete : t.compare.generatingPreview}</span></div>}
      <span className="image-side-label image-side-before">{t.compare.originalTag}{originalFormat}</span><span className="image-side-label image-side-after">{result?.format ?? targetFormat}{t.compare.convertedTag}</span>
      <div className="image-compare-handle" role="slider" tabIndex={0} aria-label={t.compare.dragSliderAria} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} aria-valuetext={t.compare.originalValText.replace('{0}', String(Math.round(split))).replace('{1}', String(Math.round(100 - split)))} style={{ left: `${split}%` }} onPointerDown={event => start(event, 'split')} {...handlers} onKeyDown={event => {
        const value = event.key === 'Home' ? 0 : event.key === 'End' ? 100 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? split - (event.shiftKey ? 10 : 1) : ['ArrowRight', 'ArrowUp'].includes(event.key) ? split + (event.shiftKey ? 10 : 1) : undefined;
        if (value !== undefined) { event.preventDefault(); setSplit(Math.max(0, Math.min(100, value))); }
      }}><span><ArrowLeftRight size={17} /></span></div>
    </div>
    <div className="image-compare-sizes">
      <div><span>{t.compare.originalTag}{originalFormat}</span><strong>{size(file.size)}</strong><small>{natural.width > 1 ? `${result?.originalWidth ?? natural.width} × ${result?.originalHeight ?? natural.height}` : t.compare.readingDimensions}</small></div>
      {result ? <span className={`image-size-change${difference < 0 ? ' larger' : ''}`}>{difference >= 0 ? t.compare.sizeReduced.replace('{0}', difference.toFixed(1)) : t.compare.sizeIncreased.replace('{0}', Math.abs(difference).toFixed(1))}</span> : <span>{previewError ? t.compare.previewFailed : t.compare.encoding}</span>}
      <div><span>{t.compare.convertedFormat}{result?.format ?? targetFormat}</span><strong>{result ? size(result.size) : '—'}</strong><small>{result ? `${result.width} × ${result.height}` : t.compare.waitingResult}</small></div>
    </div>
    {result && <div className="image-compare-download"><span>{t.compare.currentImage}{file.name}</span><a href={result.url} download={result.name}><ArrowDownToLine size={14} />{t.compare.downloadFormat}{result.format}</a></div>}
    <p className="image-compare-hint">{t.compare.hintBase.replace('{0}', fallback ? t.compare.hintFallback : t.compare.hintPixel)}</p>
    {(previewError || error) && <p className="image-compare-error" role="alert">{previewError || error}</p>}
  </section>;
}
