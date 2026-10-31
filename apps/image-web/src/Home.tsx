'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Check, Cpu, Disc, File as FileIcon, FileImage, Grid2X2, ImagePlus, Images, Info, Layers3, LoaderCircle, Lock, Mountain, MoveHorizontal, PanelsTopLeft, Play, Sparkles, Wand2, Zap } from 'lucide-react';
import { createEngine, formats } from '@pixelforge/image-engine';
import type { FormatId } from '@pixelforge/image-engine';
import { SiteHeader } from './SiteHeader';
import { useImageI18n } from './i18n';

const formatIcons: Partial<Record<FormatId, typeof FileImage>> = {
  GIF: Images, TIFF: Layers3, BMP: Grid2X2, ICO: Disc, JXL: FileImage, QOI: Box, TGA: FileIcon, PSD: PanelsTopLeft, JP2: ImagePlus, EXR: Mountain, SVG: Wand2, HEIC: Sparkles,
};

const defaultFormatTags: Partial<Record<FormatId, string>> = {
  SVG: '矢量描摹',
  HEIC: '苹果实拍',
  GIF: '动图序列',
  TIFF: '出版印刷',
  BMP: '点阵位图',
  ICO: '网站图标',
  JXL: '下一代 JPEG',
  QOI: '极速编解码',
  TGA: '纹理通道',
  PSD: '合成图层',
  JP2: '小波压缩',
  EXR: '工业 HDR',
};

export function Home({ active = 'home' }: { active?: 'home' | 'images' }) {
  const { t } = useImageI18n();
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

  const getQualityHint = (val: number) => {
    if (val >= 90) return t.home.qualityHints.fidelity;
    if (val >= 80) return t.home.qualityHints.balanced;
    if (val >= 60) return t.home.qualityHints.standard;
    return t.home.qualityHints.compact;
  };

  return <div className="home-page">
    <SiteHeader active={active} />
    <main className="home-main">
      <section className="home-intro">
        <div className="home-hero-badge">
          <Zap size={14} className="home-hero-badge-icon" />
          <span>{t.home.heroBadge}</span>
        </div>
        <h1>{t.home.title}</h1>
        <p>{t.home.subtitle}</p>
        <div className="home-actions">
          <button className="primary" type="submit" form="home-settings" disabled={busy}>
            <Images size={18} />{t.home.startConvert}<ArrowRight size={16} />
          </button>
          <button className="secondary" disabled={busy} onClick={previewSample}>
            {busy ? <LoaderCircle size={17} className="spin" /> : <Play size={17} />}
            {busy ? t.home.convertingSample : result ? t.home.reconvertSample : t.home.trySample}
          </button>
        </div>
        <div className="home-hero-strip" aria-label="核心特点">
          <div className="home-strip-item">
            <Cpu size={15} />
            <span>{t.home.stripParallel}</span>
          </div>
          <div className="home-strip-item">
            <Lock size={15} />
            <span>{t.home.stripPrivacy}</span>
          </div>
          <div className="home-strip-item">
            <Wand2 size={15} />
            <span>{t.home.stripVector}</span>
          </div>
        </div>
      </section>

      <section className="home-demo" aria-label="图片转换示例">
        <div className="home-picture">
          <img src={result?.before ?? '/sample-landscape.png'} alt={t.home.samplePicAlt} width={1080} height={360} fetchPriority="high" />
          {result && <img src={result.after} alt={t.home.sampleResultAlt} style={{ clipPath: `inset(0 0 0 ${split}%)` }} />}
          <span className="compare-label label-before">{result ? t.home.compareOriginal : t.home.sampleOriginal}</span>
          <span className="compare-label label-after">{result ? `${t.home.compareResultPrefix}${result.label}` : t.home.clickTrySample}</span>
          <div className="compare-divider" style={{ left: `${split}%` }}>
            <span><MoveHorizontal size={16} /></span>
          </div>
          <input aria-label={t.home.dragCompare} type="range" min="0" max="100" value={split} onChange={(event) => setSplit(Number(event.target.value))} />
          {busy && <div className="home-demo-loading" role="status"><LoaderCircle size={18} className="spin" />{t.home.callingWasm}</div>}
        </div>
        <form id="home-settings" className="home-settings" action="/convert/" method="get">
          <fieldset disabled={busy}>
            <legend className="sr-only">{t.app.settingsTitle}</legend>
            <span className="home-settings-title">{t.home.targetFormat}</span>
            <div className="home-format-options">
              {outputFormats.slice(0, 4).map((item) => (
                <label key={item.id} className={format === item.id ? 'chosen' : ''}>
                  <input type="radio" name="format" value={item.id} checked={format === item.id} onChange={() => setFormat(item.id)} />
                  {item.label}
                  {format === item.id && <Check size={13} />}
                </label>
              ))}
            </div>
          </fieldset>
          {target.lossy && (
            <label className="home-quality">
              <span>{t.home.quality}</span>
              <input name="quality" aria-label="示例图片画质" type="range" min="1" max="100" value={quality} disabled={busy} onChange={(event) => setQuality(Number(event.target.value))} />
              <output>{quality}</output>
              <span className="home-quality-badge">{getQualityHint(quality)}</span>
            </label>
          )}
          <label className="home-size">
            <span>{t.home.sizeLimit}</span>
            <select name="maxWidth" value={width} onChange={(event) => setWidth(event.target.value)} disabled={busy}>
              <option value="">{t.home.keepSize}</option>
              <option value="1920">{t.home.maxWidth1920}</option>
              <option value="1280">{t.home.maxWidth1280}</option>
              <option value="640">{t.home.maxWidth640}</option>
            </select>
          </label>
          <button type="submit" className="secondary" disabled={busy}>{t.home.enterWorkbench}<ArrowRight size={15} /></button>
        </form>
      </section>
      {error && <p role="alert" className="home-error">{error}</p>}
      <div className="home-demo-note">
        <Info size={14} className="shrink-0" />
        <p>{t.home.sampleTip}</p>
      </div>

      <section className="home-formats" id="formats">
        <div className="home-section-header">
          <h2>{t.home.otherFormats}</h2>
          <span className="home-section-count">{t.home.allFormatsCount}</span>
        </div>
        <div className="home-format-list">
          {outputFormats.slice(4).map((item) => {
            const Icon = formatIcons[item.id] ?? FileImage;
            const tag = t.formatTags[item.id] ?? defaultFormatTags[item.id];
            return (
              <a key={item.id} href={`/convert/?format=${item.id}`}>
                <Icon size={21} strokeWidth={1.5} />
                <span className="home-format-name">{item.label}</span>
                {tag && <small className="home-format-tag">{tag}</small>}
              </a>
            );
          })}
        </div>
        <p className="home-format-tip"><Info size={15} />{t.home.formatTip}</p>
      </section>

      <section className="home-guide" id="guide">
        <div className="home-guide-header">
          <h2>{t.home.batchGuideTitle}</h2>
          <p className="home-guide-subtitle">{t.home.batchGuideSubtitle}</p>
        </div>
        <div className="home-guide-cards">
          <div className="home-guide-card">
            <strong>{t.home.cards.zeroUploadTitle}</strong>
            <p>{t.home.cards.zeroUploadDesc}</p>
          </div>
          <div className="home-guide-card">
            <strong>{t.home.cards.standardBinaryTitle}</strong>
            <p>{t.home.cards.standardBinaryDesc}</p>
          </div>
          <div className="home-guide-card">
            <strong>{t.home.cards.persistenceTitle}</strong>
            <p>{t.home.cards.persistenceDesc}</p>
          </div>
          <div className="home-guide-action">
            <a href="/convert/">{t.home.openWorkbench}<ArrowRight size={16} /></a>
          </div>
        </div>
      </section>
      <footer><span>PixelForge</span><span>{t.home.footerSupported}</span></footer>
    </main>
  </div>;
}
