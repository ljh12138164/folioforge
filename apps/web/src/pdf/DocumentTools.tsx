export type OcrOptions = { language: string; format: string; dpi: number; force: boolean };
export type CompressionOptions = { method: string; dpi: number; quality: number; consent: boolean };

export function DocumentTools({ mode, ocr, compression, busy, onOcr, onCompression }: {
  mode: string; ocr: OcrOptions; compression: CompressionOptions; busy: boolean;
  onOcr: (options: OcrOptions) => void; onCompression: (options: CompressionOptions) => void;
}) {
  if (mode === 'ocr') return <fieldset className="pdf-setting-section pdf-edit-tools" disabled={busy}>
    <legend>扫描件文字识别</legend>
    <label className="pdf-edit-field">识别语言<select value={ocr.language} onChange={e => onOcr({ ...ocr, language: e.target.value })}><option value="chi_sim+eng">简体中文 + English</option><option value="eng">English</option><option value="chi_sim">简体中文</option></select></label>
    <label className="pdf-edit-field">OCR 输出<select value={ocr.format} onChange={e => onOcr({ ...ocr, format: e.target.value })}><option value="txt">文字 TXT</option><option value="pdf">可搜索 PDF</option></select></label>
    <label className="pdf-edit-field">识别清晰度<select value={ocr.dpi} onChange={e => onOcr({ ...ocr, dpi: Number(e.target.value) })}><option value="150">150 DPI · 较省内存</option><option value="200">200 DPI · 更精细</option></select></label>
    <label className="pdf-radio pdf-document-consent"><input type="checkbox" checked={ocr.force} onChange={e => onOcr({ ...ocr, force: e.target.checked })} /><span>重新识别已有文字的页面</span></label>
    <p className="pdf-field-hint">默认沿用已有文字，避免重复文字层。每批最多 20 页，手机建议 1–3 页；单页限 3000px / 400 万像素，超出时会降低实际 DPI。</p>
    <p className="pdf-field-hint">中英文模型随应用缓存，无需上传。识别结果可能出错，表格、竖排、小字与倾斜扫描需人工核对。</p>
    {ocr.format === 'pdf' && <p className="pdf-field-hint">需要识别的页面会重建为图片加可搜索文字，保留可见尺寸；原矢量、链接、注释和标签不保留。已有文字页默认原样复制。</p>}
  </fieldset>;
  if (mode !== 'compress') return null;
  return <fieldset className="pdf-setting-section pdf-edit-tools" disabled={busy}>
    <legend>压缩设置</legend>
    <label className="pdf-edit-field">压缩方式<select value={compression.method} onChange={e => onCompression({ ...compression, method: e.target.value, consent: false })}><option value="optimize">重存优化 · 保留页面内容</option><option value="scan">扫描件降采样 · 有损</option></select></label>
    {compression.method === 'scan' ? <>
      <label className="pdf-edit-field">输出清晰度<select value={compression.dpi} onChange={e => onCompression({ ...compression, dpi: Number(e.target.value) })}><option value="96">96 DPI · 屏幕阅读</option><option value="150">150 DPI · 日常分享</option><option value="200">200 DPI · 较清晰</option></select></label>
      <label className="pdf-edit-field">JPEG 画质 · {Math.round(compression.quality * 100)}%<input type="range" min="40" max="95" value={Math.round(compression.quality * 100)} onChange={e => onCompression({ ...compression, quality: Number(e.target.value) / 100 })} /></label>
      <p className="pdf-field-hint">整页转为 JPG 图片，适合图片扫描件。原有可选文字（含 OCR）、矢量、链接、注释和标签会丢失；小字、印章和二维码可能变模糊。限 3000px / 400 万像素。</p>
      <label className="pdf-radio pdf-document-consent"><input type="checkbox" checked={compression.consent} onChange={e => onCompression({ ...compression, consent: e.target.checked })} /><span>我了解内容损失，生成图片页 PDF</span></label>
    </> : <p className="pdf-field-hint">重新组织 PDF 对象存储，不降低图片分辨率。已优化的文档可能无法继续缩小；页面重组仍沿用工作台的静态 PDF 支持范围。</p>}
    <p className="pdf-field-hint">对比当前导出范围的 PDF 字节数，结果更大时保留原范围文件。处理完成后可预览结果首页，再下载检查。</p>
  </fieldset>;
}
