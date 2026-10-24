import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeftRight, Expand, Minimize2, Minus, Plus, Scan } from 'lucide-react';
import type { TaskOutput } from './task-store';

type Result = TaskOutput & { url: string; before: string; after: string };
const size = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function ImageComparison({ source, file, result, working }: { source: string; file: File; result: Result; working: boolean }) {
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ pointer: number; element: HTMLElement; mode: 'pan' | 'split'; x: number; y: number; panX: number; panY: number } | null>(null);
  const [frame, setFrame] = useState({ width: 1, height: 1 });
  const [natural, setNatural] = useState({ width: result.originalWidth, height: result.originalHeight });
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [pan, setPan] = useState({ x: 0, y: 0 }), [split, setSplit] = useState(50);
  const [before, setBefore] = useState(source), [after, setAfter] = useState(result.url);
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
  const difference = file.size ? (1 - result.size / file.size) * 100 : 0;
  const compatibilityPreview = () => { setBefore(result.before); setAfter(result.after); setFallback(true); };

  return <section ref={root} className="image-comparison" aria-label="图片转换前后对照">
    <div className="image-compare-toolbar">
      <strong><ArrowLeftRight size={15} />原图与结果对照</strong>
      <div className="image-zoom-controls" role="group" aria-label="对照缩放">
        <button aria-label="缩小对照" disabled={scale <= .05} onClick={() => change(scale / 1.5)}><Minus size={15} /></button>
        <output aria-label="对照缩放比例">{Math.round(scale * 100)}%</output>
        <button aria-label="放大对照" disabled={scale >= 8} onClick={() => change(scale * 1.5)}><Plus size={15} /></button>
        <button aria-pressed={zoom === 1} onClick={() => change(1)}>100%</button>
        <button aria-pressed={zoom === 'fit'} onClick={() => change('fit')}><Scan size={14} />适应</button>
        {canFullscreen && <button aria-label={fullscreen ? '退出全屏对照' : '全屏对照'} onClick={() => {
          void (fullscreen ? document.exitFullscreen() : root.current!.requestFullscreen()).catch(() => setError('全屏不可用，可继续在工作台中缩放对照。'));
        }}>{fullscreen ? <Minimize2 size={15} /> : <Expand size={15} />}</button>}
      </div>
    </div>
    <div ref={stage} className={`image-compare-stage checkerboard${dragging ? ' is-dragging' : ''}`} onPointerDown={event => start(event, 'pan')} {...handlers}>
      <div className="image-compare-layer" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <img src={before} alt="转换前的原图" draggable={false} style={imageStyle} onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => {
          if (before === result.before) setError('原图预览不可用，请尝试重新转换。');
          else compatibilityPreview();
        }} />
      </div>
      <div className="image-compare-layer" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <img src={after} alt="实际转换结果" draggable={false} style={imageStyle} onError={() => {
          if (after === result.after) setError('结果预览不可用，仍可下载转换后的文件。');
          else compatibilityPreview();
        }} />
      </div>
      <span className="image-side-label image-side-before">原图</span><span className="image-side-label image-side-after">{result.format} 结果</span>
      <div className="image-compare-handle" role="slider" tabIndex={0} aria-label="拖动以对比转换前后图片" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(split)} aria-valuetext={`原图 ${Math.round(split)}%，结果 ${Math.round(100 - split)}%`} style={{ left: `${split}%` }} onPointerDown={event => start(event, 'split')} {...handlers} onKeyDown={event => {
        const value = event.key === 'Home' ? 0 : event.key === 'End' ? 100 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? split - (event.shiftKey ? 10 : 1) : ['ArrowRight', 'ArrowUp'].includes(event.key) ? split + (event.shiftKey ? 10 : 1) : undefined;
        if (value !== undefined) { event.preventDefault(); setSplit(Math.max(0, Math.min(100, value))); }
      }}><span><ArrowLeftRight size={17} /></span></div>
    </div>
    <div className="image-compare-sizes">
      <div><span>原图</span><strong>{size(file.size)}</strong><small>{result.originalWidth} × {result.originalHeight}</small></div>
      <span className={`image-size-change${difference < 0 ? ' larger' : ''}`}>{difference >= 0 ? `减少 ${difference.toFixed(1)}%` : `增大 ${Math.abs(difference).toFixed(1)}%`}</span>
      <div><span>{result.format}</span><strong>{size(result.size)}</strong><small>{result.width} × {result.height}</small></div>
    </div>
    <p className="image-compare-hint">拖动分界线对照，拖动画面平移；Ctrl / ⌘ + 滚轮缩放。{fallback ? '当前格式使用引擎缩略预览，100% 按预览像素显示，不代表原图像素细节。' : '100% 按原图像素显示，缩小后的结果对齐放大。'}修改设置后重新转换可更新结果。</p>
    {working && <p className="image-compare-hint" role="status">正在重新转换，当前显示上次结果…</p>}
    {error && <p className="image-compare-error" role="alert">{error}</p>}
  </section>;
}
