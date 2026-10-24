'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpDown, Columns2, Crop, FileImage, FileSearch, FileStack, FileText, ImageDown, ImagePlus, Images, Layers, LayoutGrid, ListOrdered, LockKeyhole, Maximize2, Minimize2, Move, PenTool, ScanText, Scissors, Search, ShieldCheck, SlidersHorizontal, Stamp, Upload, X } from 'lucide-react';
import { SiteHeader } from '../SiteHeader';

const tools = [
  { name: '合并 PDF', category: 'PDF', description: '将多份 PDF 合并为一份，导出前可调整页序。', icon: Layers, url: '/pdf/?tool=organize', terms: '合并 merge' },
  { name: '拆分 PDF', category: 'PDF', description: '将每页另存为独立 PDF，打包为 ZIP 下载。', icon: Scissors, url: '/pdf/?tool=split', terms: '拆分 split zip' },
  { name: '整理 PDF 页面', category: 'PDF', description: '调整页面顺序、旋转方向或删除多余页面。', icon: Move, url: '/pdf/?tool=organize', terms: '排序 rotate 旋转 删除' },
  { name: '提取 PDF 页面', category: 'PDF', description: '勾选或按页码选出需要的页面，生成新 PDF。', icon: FileStack, url: '/pdf/?tool=extract', terms: '提取 extract 页码' },
  { name: 'PDF 转图片', category: 'PDF', description: '逐页导出为 PNG 或 JPG 图片，可选分辨率。', icon: ImageDown, url: '/pdf/?tool=images', terms: 'png jpg jpeg 格式 导出' },
  { name: '图片转 PDF', category: 'PDF', description: '将 PNG、JPG 图片居中排入 A4 页面，生成 PDF。', icon: FileImage, url: '/pdf/?tool=organize', terms: 'png jpg jpeg 照片 扫描' },
  { name: 'PDF 添加页码', category: 'PDF', description: '设置起始编号、位置和字号，按当前页序连续编号。', icon: ListOrdered, url: '/pdf/?tool=numbers', terms: 'number 编号 页数' },
  { name: 'PDF 文字水印', category: 'PDF', description: '叠加中英文水印，可调颜色、角度与不透明度。', icon: Stamp, url: '/pdf/?tool=watermark', terms: 'watermark 盖印 中文' },
  { name: 'PDF 裁剪边缘', category: 'PDF', description: '按四边毫米数裁剪页面可见区域，保留原文内容。', icon: Crop, url: '/pdf/?tool=layout', terms: 'crop 裁边 白边' },
  { name: 'PDF 适配 A4', category: 'PDF', description: '将页面等比缩放到横向或纵向 A4 纸张。', icon: Maximize2, url: '/pdf/?tool=layout&layout=fit', terms: '打印 尺寸 纸张 缩放' },
  { name: 'PDF 多页拼版', category: 'PDF', description: '将 2 页或 4 页合排到同一张 A4 页面。', icon: LayoutGrid, url: '/pdf/?tool=layout&layout=nup', terms: 'nup 拼版 2合1 4合1 打印' },
  { name: 'PDF 提取文字', category: 'PDF', description: '按页提取并搜索文档内已有文字，导出 TXT。', icon: FileText, url: '/pdf/?tool=text', terms: '文本 text txt 搜索' },
  { name: 'PDF 双面扫描重排', category: 'PDF', description: '交错排列正反扫描页，恢复正常阅读顺序。', icon: ArrowUpDown, url: '/pdf/?tool=duplex', terms: 'duplex 双面 扫描 交错 奇偶 正反' },
  { name: 'PDF 空白页识别', category: 'PDF', description: '检测疑似空白页，预览确认后再批量删除。', icon: FileSearch, url: '/pdf/?tool=blank', terms: '空白 blank 扫描 删除' },
  { name: 'PDF 外观签名', category: 'PDF', description: '手写或上传签名图片，拖放定位后写入页面。', icon: PenTool, url: '/pdf/?tool=stamp', terms: '手写 签名 sign 盖章 印章' },
  { name: 'PDF 图片水印', category: 'PDF', description: '叠加 Logo 或透明 PNG，调整位置、大小与不透明度。', icon: ImagePlus, url: '/pdf/?tool=stamp&stamp=watermark', terms: '图片 logo png watermark 水印' },
  { name: 'PDF 视觉对比', category: 'PDF', description: '同步翻页，通过滑块、叠加或并排方式对照两份文档。', icon: Columns2, url: '/pdf/?tool=compare', terms: 'compare 对比 比较 差异 版本' },
  { name: 'PDF 扫描件 OCR', category: 'PDF', description: '本地识别扫描件中的中英文，生成 TXT 或可搜索 PDF。', icon: ScanText, url: '/pdf/?tool=ocr', terms: 'ocr 扫描 文字 识别 中文 英文 搜索' },
  { name: 'PDF 压缩', category: 'PDF', description: '支持重存优化与扫描件降采样，对比压缩前后体积。', icon: Minimize2, url: '/pdf/?tool=compress', terms: '压缩 compress 大小 缩小 瘦身' },
  { name: '图片格式转换', category: '图片', description: '批量转换 JPG、PNG、WebP、AVIF 等 14 种格式。', icon: Images, url: '/convert/', terms: '图片 格式 webp avif heic jpeg jxl' },
  { name: '图片画质与尺寸', category: '图片', description: '调整编码质量与最大宽高，批量缩小图片体积。', icon: SlidersHorizontal, url: '/convert/', terms: '压缩 缩放 体积 图片大小' },
];

export function ToolsHome() {
  const [category, setCategory] = useState('全部工具');
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();
  const filtered = tools.filter(tool => (category === '全部工具' || tool.category === category) && `${tool.name} ${tool.description} ${tool.terms}`.toLocaleLowerCase().includes(keyword));
  return <div className="app-shell tools-home">
    <SiteHeader active="home" onHelp={() => document.getElementById('tools-guide')?.scrollIntoView({ behavior: 'smooth' })} />
    <main>
      <section className="tools-intro"><div><h1>文件处理，<span>就在本机。</span></h1><p>合并、拆分、OCR 识别 PDF，或批量转换 14 种图片格式。<br />所有操作均在当前设备完成，文件不上传服务器。</p><div className="tools-intro-actions"><a className="primary" href="/pdf/">打开 PDF 工作台<ArrowRight size={16} /></a><a className="secondary" href="/convert/"><Images size={16} />图片转换工作台</a></div></div><div className="tools-principle"><ShieldCheck size={22} strokeWidth={1.6} /><strong>文件不出本机</strong><p>文档与图片均在浏览器本地处理。<br />无需注册账号，也不会把文件发往远端服务器。</p><span><LockKeyhole size={12} />PDF 资源缓存完成后可离线使用</span></div></section>
      <section className="tools-directory" aria-labelledby="tools-heading">
        <div className="tools-directory-heading"><h2 id="tools-heading">选一个工具，开始处理</h2><label className="tools-search"><Search size={16} /><input type="search" aria-label="搜索工具" placeholder="搜索工具，如合并、旋转、PNG" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}</label></div>
        <div className="tools-filter" role="group" aria-label="工具分类">{['全部工具', 'PDF', '图片'].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<span>{item === '全部工具' ? tools.length : tools.filter(t => t.category === item).length}</span></button>)}</div>
        <div className="tools-list" aria-live="polite">{filtered.map(tool => <a className="tools-entry" key={tool.name} href={tool.url}><span className="tools-entry-icon" aria-hidden="true"><tool.icon size={20} strokeWidth={1.7} /></span><div><h3>{tool.name}</h3><p>{tool.description}</p></div><ArrowRight size={16} className="tools-entry-arrow" /></a>)}</div>
        {!filtered.length && <div className="tools-no-results"><Search size={25} /><h3>没有找到相关工具</h3><p>换个关键词，或查看全部工具。</p><button onClick={() => { setQuery(''); setCategory('全部工具'); }}>查看全部工具<ArrowRight size={14} /></button></div>}
      </section>
      <section className="tools-guide" id="tools-guide"><h2>使用流程</h2><div><article><Upload size={19} /><h3>导入本地文件</h3><p>选择对应工具后拖入文档或图片，也可以先载入内置示例体验。</p></article><article><Move size={19} /><h3>预览与调整</h3><p>在左侧预览页面、调整顺序或对比效果，在右侧设置导出参数。</p></article><article><FileText size={19} /><h3>下载处理结果</h3><p>处理结果另存为新文件，原文件保持不变。</p></article></div></section>
      <details className="tools-faq"><summary>关于离线使用与文件支持</summary><p>首次联网打开 /pdf/ 并完成资源缓存后，包含中英文 OCR 模型在内的 PDF 工具均可断网使用。应用缓存只存程序资源，不保存你的文件；清除浏览器网站数据后需重新联网缓存。网页版图片工具同样在本地运行，但尚未提供完整离线缓存；桌面版内置全部离线资源。</p><p>PDF 工具支持静态文档、扫描件 OCR 与体积压缩，不支持加密 PDF、交互表单及直接编辑正文。OCR 识别结果建议人工核对；扫描件降采样压缩会移除原有文字层与链接。图片支持格式及大小限制可在图片工作台查看。</p><a href="/images/">查看图片工具介绍与格式支持<ArrowRight size={14} /></a></details>
      <footer><span>FolioForge 页匠 · 本地文档与图片工坊</span><span>本地运行 · 无需上传文件</span></footer>
    </main>
  </div>;
}
