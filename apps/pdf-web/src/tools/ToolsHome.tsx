'use client';

import { useState } from 'react';
import { ArrowRight, ArrowUpDown, ChevronDown, Columns2, Crop, FileImage, FileSearch, FileStack, FileText, ImageDown, ImagePlus, Layers, LayoutGrid, ListOrdered, Maximize2, Minimize2, Move, PenTool, ScanText, Scissors, Search, ShieldCheck, Sparkles, Stamp, X } from 'lucide-react';
import { SiteHeader } from '../SiteHeader';
import { usePdfI18n } from '../i18n';

const baseGroups = [
  { id: 'organize', name: '页面整理与拆分' },
  { id: 'layout', name: '版面、印记与排版' },
  { id: 'convert', name: '转换、识别与优化' },
] as const;

const tools = [
  { id: 'merge', name: '合并 PDF', group: '页面整理与拆分', groupId: 'organize', description: '将多份 PDF 合并为一份，导出前可自由调整页序。', icon: Layers, url: '/pdf/?tool=organize', terms: '合并 merge', tag: '多文档合并' },
  { id: 'split', name: '拆分 PDF', group: '页面整理与拆分', groupId: 'organize', description: '将每页另存为独立 PDF，自动打包为 ZIP 下载。', icon: Scissors, url: '/pdf/?tool=split', terms: '拆分 split zip', tag: '一键 ZIP' },
  { id: 'reorder', name: '整理 PDF 页面', group: '页面整理与拆分', groupId: 'organize', description: '拖拽调整页面顺序、旋转方向或删除多余页面。', icon: Move, url: '/pdf/?tool=organize', terms: '排序 rotate 旋转 删除', tag: '自由排序' },
  { id: 'extract', name: '提取 PDF 页面', group: '页面整理与拆分', groupId: 'organize', description: '勾选或输入页码范围，将所需页面导出为新 PDF。', icon: FileStack, url: '/pdf/?tool=extract', terms: '提取 extract 页码', tag: '指定页码' },
  { id: 'duplex', name: 'PDF 双面扫描重排', group: '页面整理与拆分', groupId: 'organize', description: '交错排列正反两面扫描页，恢复正常阅读顺序。', icon: ArrowUpDown, url: '/pdf/?tool=duplex', terms: 'duplex 双面 扫描 交错 奇偶 正反', tag: '正反交错' },
  { id: 'blank', name: 'PDF 空白页识别', group: '页面整理与拆分', groupId: 'organize', description: '按墨迹比例筛出疑似空白页，预览确认后批量删除。', icon: FileSearch, url: '/pdf/?tool=blank', terms: '空白 blank 扫描 删除', tag: '墨迹筛除' },

  { id: 'numbers', name: 'PDF 添加页码', group: '版面、印记与排版', groupId: 'layout', description: '设置起始编号、位置与字号，按当前页序连续编号。', icon: ListOrdered, url: '/pdf/?tool=numbers', terms: 'number 编号 页数', tag: '连续编号' },
  { id: 'watermark', name: 'PDF 文字水印', group: '版面、印记与排版', groupId: 'layout', description: '叠加中英文水印，可调节颜色、角度与不透明度。', icon: Stamp, url: '/pdf/?tool=watermark', terms: 'watermark 盖印 中文', tag: '防伪半透明' },
  { id: 'stamp', name: 'PDF 外观签名', group: '版面、印记与排版', groupId: 'layout', description: '手写或上传签名图片，拖放定位后直接写入页面。', icon: PenTool, url: '/pdf/?tool=stamp', terms: '手写 签名 sign 盖章 印章', tag: '原笔迹签署' },
  { id: 'stamp-watermark', name: 'PDF 图片水印', group: '版面、印记与排版', groupId: 'layout', description: '叠加 Logo 或透明 PNG，自由调整位置与透明度。', icon: ImagePlus, url: '/pdf/?tool=stamp&stamp=watermark', terms: '图片 logo png watermark 水印', tag: '透明 Logo' },
  { id: 'crop', name: 'PDF 裁剪边缘', group: '版面、印记与排版', groupId: 'layout', description: '按四边毫米数裁剪页面留白，完整保留原文内容。', icon: Crop, url: '/pdf/?tool=layout', terms: 'crop 裁边 白边', tag: '毫米级裁白' },
  { id: 'fit-a4', name: 'PDF 适配 A4', group: '版面、印记与排版', groupId: 'layout', description: '将不同尺寸页面等比居中缩放到横排或竖排 A4。', icon: Maximize2, url: '/pdf/?tool=layout&layout=fit', terms: '打印 尺寸 纸张 缩放', tag: '居中适配' },
  { id: 'nup', name: 'PDF 多页拼版', group: '版面、印记与排版', groupId: 'layout', description: '将 2 页或 4 页合排到同一张 A4 纸，适合打印审阅。', icon: LayoutGrid, url: '/pdf/?tool=layout&layout=nup', terms: 'nup 拼版 2合1 4合1 打印', tag: '2合1 / 4合1' },

  { id: 'pdf-to-img', name: 'PDF 转图片', group: '转换、识别与优化', groupId: 'convert', description: '逐页渲染导出为 PNG 或 JPG 图片，可选分辨率。', icon: ImageDown, url: '/pdf/?tool=images', terms: 'png jpg jpeg 格式 导出', tag: '逐页渲染' },
  { id: 'img-to-pdf', name: '图片转 PDF', group: '转换、识别与优化', groupId: 'convert', description: '将多张 PNG、JPG 图片居中排入 A4 页面合成 PDF。', icon: FileImage, url: '/pdf/?tool=organize', terms: 'png jpg jpeg 照片 扫描', tag: '图片合成' },
  { id: 'extract-text', name: 'PDF 提取文字', group: '转换、识别与优化', groupId: 'convert', description: '按页提取并搜索文档内已有文字，一键导出 TXT。', icon: FileText, url: '/pdf/?tool=text', terms: '文本 text txt 搜索', tag: '文本快搜' },
  { id: 'ocr', name: 'PDF 扫描件 OCR', group: '转换、识别与优化', groupId: 'convert', description: '本地模型识别中英文扫描件，导出 TXT 或可搜索 PDF。', icon: ScanText, url: '/pdf/?tool=ocr', terms: 'ocr 扫描 文字 识别 中文 英文 搜索', tag: '离线 OCR' },
  { id: 'compress', name: 'PDF 压缩', group: '转换、识别与优化', groupId: 'convert', description: '提供无损重存与扫描件降采样，直观对比压缩前后体积。', icon: Minimize2, url: '/pdf/?tool=compress', terms: '压缩 compress 大小 缩小 瘦身', tag: '体积瘦身' },
  { id: 'compare', name: 'PDF 视觉对比', group: '转换、识别与优化', groupId: 'convert', description: '双文档同步翻页，支持滑块、叠加或左右并排核对差异。', icon: Columns2, url: '/pdf/?tool=compare', terms: 'compare 对比 比较 差异 版本', tag: '双文档核对' },
] as const;

export function ToolsHome() {
  const { t } = usePdfI18n();
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();

  const getToolInfo = (tool: (typeof tools)[number]) => {
    const loc = t.toolsHome.tools[tool.name];
    return {
      ...tool,
      name: loc?.name ?? tool.name,
      description: loc?.description ?? tool.description,
      tag: loc?.tag ?? tool.tag,
    };
  };

  const localizedTools = tools.map(getToolInfo);
  const filtered = localizedTools.filter(tool => `${tool.name} ${tool.description} ${tool.terms}`.toLocaleLowerCase().includes(keyword));
  const showGrouped = !keyword;

  const groups = [
    { ...t.toolsHome.groups.organize, groupId: 'organize' },
    { ...t.toolsHome.groups.layout, groupId: 'layout' },
    { ...t.toolsHome.groups.convert, groupId: 'convert' },
  ];

  const handleTagClick = (tag: string) => {
    if (query === tag) {
      setQuery('');
    } else {
      setQuery(tag);
    }
  };

  const renderCard = (tool: ReturnType<typeof getToolInfo>) => (
    <a className="tools-entry" key={tool.id} href={tool.url}>
      <span className="tools-entry-icon" aria-hidden="true"><tool.icon size={19} strokeWidth={1.75} /></span>
      <div>
        <div className="tools-entry-head">
          <h3>{tool.name}</h3>
          <span className="tools-entry-tag">{tool.tag}</span>
        </div>
        <p>{tool.description}</p>
      </div>
      <ArrowRight size={15} className="tools-entry-arrow" aria-hidden="true" />
    </a>
  );

  return <div className="app-shell tools-home">
    <SiteHeader active="home" onHelp={() => document.getElementById('tools-guide')?.scrollIntoView({ behavior: 'smooth' })} />
    <main>
      <section className="tools-intro">
        <div className="tools-hero-badge">
          <ShieldCheck size={14} className="tools-hero-badge-icon" />
          <span>{t.toolsHome.heroBadge}</span>
        </div>
        <div className="tools-intro-copy">
          <h1>{t.toolsHome.h1}</h1>
          <p>{t.toolsHome.intro}</p>
        </div>
        <div className="tools-intro-actions">
          <a className="primary" href="/pdf/">{t.toolsHome.openWorkbench}<ArrowRight size={16} /></a>
          <a className="secondary" href="#tools-guide">{t.toolsHome.offlineSpecLink}</a>
        </div>

        <div className="tools-pillars" aria-label="高频工作流">
          <a className="tools-pillar" href="/pdf/?tool=organize">
            <span className="tools-pillar-icon"><Layers size={20} strokeWidth={1.75} /></span>
            <div className="tools-pillar-body">
              <strong>{t.toolsHome.pillars.p1Title}</strong>
              <p>{t.toolsHome.pillars.p1Desc}</p>
            </div>
            <span className="tools-pillar-link">{t.toolsHome.pillars.p1Link}<ArrowRight size={13} /></span>
          </a>
          <a className="tools-pillar" href="/pdf/?tool=stamp">
            <span className="tools-pillar-icon"><PenTool size={20} strokeWidth={1.75} /></span>
            <div className="tools-pillar-body">
              <strong>{t.toolsHome.pillars.p2Title}</strong>
              <p>{t.toolsHome.pillars.p2Desc}</p>
            </div>
            <span className="tools-pillar-link">{t.toolsHome.pillars.p2Link}<ArrowRight size={13} /></span>
          </a>
          <a className="tools-pillar" href="/pdf/?tool=ocr">
            <span className="tools-pillar-icon"><ScanText size={20} strokeWidth={1.75} /></span>
            <div className="tools-pillar-body">
              <strong>{t.toolsHome.pillars.p3Title}</strong>
              <p>{t.toolsHome.pillars.p3Desc}</p>
            </div>
            <span className="tools-pillar-link">{t.toolsHome.pillars.p3Link}<ArrowRight size={13} /></span>
          </a>
          <a className="tools-pillar" href="/pdf/?tool=compress">
            <span className="tools-pillar-icon"><Minimize2 size={20} strokeWidth={1.75} /></span>
            <div className="tools-pillar-body">
              <strong>{t.toolsHome.pillars.p4Title}</strong>
              <p>{t.toolsHome.pillars.p4Desc}</p>
            </div>
            <span className="tools-pillar-link">{t.toolsHome.pillars.p4Link}<ArrowRight size={13} /></span>
          </a>
        </div>
      </section>

      <section className="tools-directory" aria-label="工具目录">
        <div className="tools-controls">
          <div className="tools-search-wrapper">
            <label className="tools-search">
              <Search size={15} />
              <input type="search" aria-label={t.toolsHome.searchAria} placeholder={t.toolsHome.searchPlaceholder} value={query} onChange={event => setQuery(event.target.value)} />
              {query && <button type="button" aria-label={t.toolsHome.clearSearchAria} onClick={() => setQuery('')}><X size={14} /></button>}
            </label>
            <div className="tools-search-tags" aria-label="热门搜索标签">
              <span className="tools-tags-label"><Sparkles size={12} />{t.toolsHome.popular}</span>
              {t.toolsHome.popularTags.map(tag => (
                <button
                  type="button"
                  key={tag}
                  className={`tools-tag-chip ${query === tag ? 'active' : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="tools-status-badge">
            <span>{t.toolsHome.totalToolsBadge}</span>
            {keyword && <strong>{t.toolsHome.filteredBadge.replace('{0}', String(filtered.length))}</strong>}
          </div>
        </div>

        <div aria-live="polite">
          {showGrouped ? (
            <div className="tools-groups">
              {groups.map(group => {
                const items = localizedTools.filter(item => item.groupId === group.groupId);
                return (
                  <section className="tools-group" key={group.groupId}>
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
              <h3>{t.toolsHome.noResultsTitle}</h3>
              <p>{t.toolsHome.noResultsDesc}</p>
              <button type="button" onClick={() => { setQuery(''); }}>{t.toolsHome.viewAllTools}<ArrowRight size={14} /></button>
            </div>
          )}
        </div>
      </section>

      <details className="tools-faq" id="tools-guide">
        <summary>
          <div className="tools-faq-summary-title">
            <ShieldCheck size={18} className="text-primary" />
            <span>{t.toolsHome.faqSummary}</span>
          </div>
          <ChevronDown size={16} className="tools-faq-chevron" />
        </summary>
        <div className="tools-faq-content">
          <div className="tools-faq-grid">
            <div className="tools-faq-item">
              <strong>{t.toolsHome.faq1Title}</strong>
              <p>{t.toolsHome.faq1Desc}</p>
            </div>
            <div className="tools-faq-item">
              <strong>{t.toolsHome.faq2Title}</strong>
              <p>{t.toolsHome.faq2Desc}</p>
            </div>
            <div className="tools-faq-item">
              <strong>{t.toolsHome.faq3Title}</strong>
              <p>{t.toolsHome.faq3Desc}</p>
            </div>
          </div>
          <div className="tools-faq-footer">
            <a href="/guide/">{t.toolsHome.faqFooterLink}<ArrowRight size={14} /></a>
          </div>
        </div>
      </details>
      <footer><span>FolioForge · 页匠</span><span>{t.toolsHome.footer}</span></footer>
    </main>
  </div>;
}
