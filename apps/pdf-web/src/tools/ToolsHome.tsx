'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpDown, Columns2, Crop, FileImage, FileSearch, FileStack, FileText, ImageDown, ImagePlus, Layers, LayoutGrid, ListOrdered, Maximize2, Minimize2, Move, PenTool, ScanText, Scissors, Search, Stamp, X } from 'lucide-react';
import { SiteHeader } from '../SiteHeader';

const groups = [
  { name: '页面整理与拆分', summary: '合并多份文档、拆分单页、调整页序或筛除空白扫描页。' },
  { name: '版面、印记与排版', summary: '连续编号、叠加中英文或图片水印、手写签名与 A4 拼版。' },
  { name: '转换、识别与优化', summary: '本地中英文 OCR、无损或降采样压缩、文本提取与双文档对比。' },
] as const;

const tools = [
  { name: '合并 PDF', group: '页面整理与拆分', description: '将多份 PDF 合并为一份，导出前可自由调整页序。', icon: Layers, url: '/pdf/?tool=organize', terms: '合并 merge' },
  { name: '拆分 PDF', group: '页面整理与拆分', description: '将每页另存为独立 PDF，自动打包为 ZIP 下载。', icon: Scissors, url: '/pdf/?tool=split', terms: '拆分 split zip' },
  { name: '整理 PDF 页面', group: '页面整理与拆分', description: '拖拽调整页面顺序、旋转方向或删除多余页面。', icon: Move, url: '/pdf/?tool=organize', terms: '排序 rotate 旋转 删除' },
  { name: '提取 PDF 页面', group: '页面整理与拆分', description: '勾选或输入页码范围，将所需页面导出为新 PDF。', icon: FileStack, url: '/pdf/?tool=extract', terms: '提取 extract 页码' },
  { name: 'PDF 双面扫描重排', group: '页面整理与拆分', description: '交错排列正反两面扫描页，恢复正常阅读顺序。', icon: ArrowUpDown, url: '/pdf/?tool=duplex', terms: 'duplex 双面 扫描 交错 奇偶 正反' },
  { name: 'PDF 空白页识别', group: '页面整理与拆分', description: '按墨迹比例筛出疑似空白页，预览确认后批量删除。', icon: FileSearch, url: '/pdf/?tool=blank', terms: '空白 blank 扫描 删除' },

  { name: 'PDF 添加页码', group: '版面、印记与排版', description: '设置起始编号、位置与字号，按当前页序连续编号。', icon: ListOrdered, url: '/pdf/?tool=numbers', terms: 'number 编号 页数' },
  { name: 'PDF 文字水印', group: '版面、印记与排版', description: '叠加中英文水印，可调节颜色、角度与不透明度。', icon: Stamp, url: '/pdf/?tool=watermark', terms: 'watermark 盖印 中文' },
  { name: 'PDF 外观签名', group: '版面、印记与排版', description: '手写或上传签名图片，拖放定位后直接写入页面。', icon: PenTool, url: '/pdf/?tool=stamp', terms: '手写 签名 sign 盖章 印章' },
  { name: 'PDF 图片水印', group: '版面、印记与排版', description: '叠加 Logo 或透明 PNG，自由调整位置与透明度。', icon: ImagePlus, url: '/pdf/?tool=stamp&stamp=watermark', terms: '图片 logo png watermark 水印' },
  { name: 'PDF 裁剪边缘', group: '版面、印记与排版', description: '按四边毫米数裁剪页面留白，完整保留原文内容。', icon: Crop, url: '/pdf/?tool=layout', terms: 'crop 裁边 白边' },
  { name: 'PDF 适配 A4', group: '版面、印记与排版', description: '将不同尺寸页面等比居中缩放到横排或竖排 A4。', icon: Maximize2, url: '/pdf/?tool=layout&layout=fit', terms: '打印 尺寸 纸张 缩放' },
  { name: 'PDF 多页拼版', group: '版面、印记与排版', description: '将 2 页或 4 页合排到同一张 A4 纸，适合打印审阅。', icon: LayoutGrid, url: '/pdf/?tool=layout&layout=nup', terms: 'nup 拼版 2合1 4合1 打印' },

  { name: 'PDF 转图片', group: '转换、识别与优化', description: '逐页渲染导出为 PNG 或 JPG 图片，可选分辨率。', icon: ImageDown, url: '/pdf/?tool=images', terms: 'png jpg jpeg 格式 导出' },
  { name: '图片转 PDF', group: '转换、识别与优化', description: '将多张 PNG、JPG 图片居中排入 A4 页面合成 PDF。', icon: FileImage, url: '/pdf/?tool=organize', terms: 'png jpg jpeg 照片 扫描' },
  { name: 'PDF 提取文字', group: '转换、识别与优化', description: '按页提取并搜索文档内已有文字，一键导出 TXT。', icon: FileText, url: '/pdf/?tool=text', terms: '文本 text txt 搜索' },
  { name: 'PDF 扫描件 OCR', group: '转换、识别与优化', description: '本地模型识别中英文扫描件，导出 TXT 或可搜索 PDF。', icon: ScanText, url: '/pdf/?tool=ocr', terms: 'ocr 扫描 文字 识别 中文 英文 搜索' },
  { name: 'PDF 压缩', group: '转换、识别与优化', description: '提供无损重存与扫描件降采样，直观对比压缩前后体积。', icon: Minimize2, url: '/pdf/?tool=compress', terms: '压缩 compress 大小 缩小 瘦身' },
  { name: 'PDF 视觉对比', group: '转换、识别与优化', description: '双文档同步翻页，支持滑块、叠加或左右并排核对差异。', icon: Columns2, url: '/pdf/?tool=compare', terms: 'compare 对比 比较 差异 版本' },

] as const;

export function ToolsHome() {
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();
  const filtered = tools.filter(tool => `${tool.name} ${tool.description} ${tool.terms}`.toLocaleLowerCase().includes(keyword));
  const showGrouped = !keyword;

  const renderCard = (tool: (typeof tools)[number]) => (
    <a className="tools-entry" key={tool.name} href={tool.url}>
      <span className="tools-entry-icon" aria-hidden="true"><tool.icon size={19} strokeWidth={1.75} /></span>
      <div>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </div>
      <ArrowRight size={15} className="tools-entry-arrow" aria-hidden="true" />
    </a>
  );

  return <div className="app-shell tools-home">
    <SiteHeader active="home" onHelp={() => document.getElementById('tools-guide')?.scrollIntoView({ behavior: 'smooth' })} />
    <main>
      <section className="tools-intro">
        <div className="tools-intro-copy">
          <h1>PDF 工具箱</h1>
          <p>在本机整理 PDF 页面、添加签名水印、识别中英文扫描件并压缩文档，文件不上传服务器。</p>
        </div>
        <div className="tools-intro-actions">
          <a className="primary" href="/pdf/">打开 PDF 工作台<ArrowRight size={16} /></a>
        </div>
      </section>

      <section className="tools-directory" aria-label="工具目录">
        <div className="tools-controls">
          <label className="tools-search">
            <Search size={15} />
            <input type="search" aria-label="搜索工具" placeholder="搜索工具，如 合并、OCR、压缩…" value={query} onChange={event => setQuery(event.target.value)} />
            {query && <button type="button" aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}
          </label>
        </div>

        <div aria-live="polite">
          {showGrouped ? (
            <div className="tools-groups">
              {groups.map(group => {
                const items = tools.filter(t => t.group === group.name);
                return (
                  <section className="tools-group" key={group.name}>
                    <div className="tools-group-header">
                      <div className="tools-group-title">
                        <h2>{group.name}</h2>
                        <span>{items.length} 项</span>
                      </div>
                      <p>{group.summary}</p>
                    </div>
                    <div className="tools-list">{items.map(renderCard)}</div>
                  </section>
                );
              })}
            </div>
          ) : (
            filtered.length > 0 && <div className="tools-list">{filtered.map(renderCard)}</div>
          )}

          {!filtered.length && (
            <div className="tools-no-results">
              <Search size={24} />
              <h3>没有找到相关工具</h3>
              <p>换个关键词试试，或直接查看全部工具。</p>
              <button type="button" onClick={() => { setQuery(''); }}>查看全部工具<ArrowRight size={14} /></button>
            </div>
          )}
        </div>
      </section>

      <details className="tools-faq" id="tools-guide">
        <summary>格式支持与离线边界说明</summary>
        <p>PDF 工作台支持单个文件 ≤ 40 MiB、总计 ≤ 100 MiB（最多 200 页），包含中英文扫描件 OCR、无损对象重存与有损降采样压缩；首次加载完成后支持断网离线使用。不支持密码加密文档或交互表单。</p>
        <a href="/guide/">阅读完整使用指南与隐私说明<ArrowRight size={14} /></a>
      </details>
      <footer><span>FolioForge · 页匠</span><span>19 项 PDF 工具</span></footer>
    </main>
  </div>;
}
