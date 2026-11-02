'use client';

import { useLocale } from '@pixelforge/ui/i18n';
import type { Locale } from '@pixelforge/ui/i18n';

export interface PdfTranslations {
  header: {
    brandAria: string;
    brandTag: string;
    home: string;
    pdf: string;
    guide: string;
    navAria: string;
  };
  toolsHome: {
    heroBadge: string;
    h1: string;
    intro: string;
    openWorkbench: string;
    offlineSpecLink: string;
    pillars: {
      p1Title: string;
      p1Desc: string;
      p1Link: string;
      p2Title: string;
      p2Desc: string;
      p2Link: string;
      p3Title: string;
      p3Desc: string;
      p3Link: string;
      p4Title: string;
      p4Desc: string;
      p4Link: string;
    };
    searchPlaceholder: string;
    searchAria: string;
    clearSearchAria: string;
    popular: string;
    popularTags: string[];
    totalToolsBadge: string;
    filteredBadge: string;
    groups: {
      organize: { name: string; summary: string };
      layout: { name: string; summary: string };
      convert: { name: string; summary: string };
    };
    tools: Record<string, { name: string; description: string; tag: string }>;
    noResultsTitle: string;
    noResultsDesc: string;
    viewAllTools: string;
    faqSummary: string;
    faq1Title: string;
    faq1Desc: string;
    faq2Title: string;
    faq2Desc: string;
    faq3Title: string;
    faq3Desc: string;
    faqFooterLink: string;
    footer: string;
  };
  workbench: {
    title: string;
    modeGroups: {
      organize: string;
      layout: string;
      convert: string;
    };
    modes: Record<string, { label: string; detail: string }>;
    statusPill: string;
    statusOffline: string;
    importInputAria: string;
    docPages: string;
    clear: string;
    addFiles: string;
    errorsTitle: string;
    selectedPages: string;
    selectAllAria: string;
    rotate: string;
    delete: string;
    undoAria: string;
    redoAria: string;
    sourcesStrip: string;
    dragOrderHint: string;
    searchText: string;
    textHintOcrPending: string;
    textHintTextPending: string;
    textExtractedSummary: string;
    noMatch: string;
    viewOriginalPage: string;
    noTextExtracted: string;
    pageNumber: string;
    dragHandleAria: string;
    dragHandleTitle: string;
    previewPageAria: string;
    preview: string;
    origPagePrefix: string;
    candidateBlank: string;
    moveUp: string;
    moveDown: string;
    rotate90: string;
    deletePage: string;
    continueAdd: string;
    emptyAllRemovedTitle: string;
    emptyStartTitle: string;
    emptyAllRemovedDesc: string;
    emptyStartDesc: string;
    chooseFiles: string;
    undoDelete: string;
    trySampleTitle: string;
    trySampleBtn: string;
    emptyLimits: string;
    bottomDragHint: string;
    bottomUndoHint: string;
    exportSettings: string;
    pageScope: string;
    scopeAll: string;
    scopeSelected: string;
    selectRangeLabel: string;
    selectRangePlaceholder: string;
    selectBtn: string;
    rangeHint: string;
    imageSettings: string;
    imageFormat: string;
    pngLossless: string;
    jpgSmaller: string;
    resolution: string;
    dpi72: string;
    dpi144: string;
    dpi216: string;
    imageBoundsHint: string;
    outputFile: string;
    filename: string;
    exportSummary: string;
    pagesCount: string;
    exportBtn: {
      processing: string;
      ocr: string;
      compress: string;
      text: string;
      zip: string;
      pdf: string;
    };
    rangeNotice: string;
    cancelOperation: string;
    exportComplete: string;
    previewFirstPage: string;
    downloadResult: string;
    outputPreviewTitle: string;
    pagePreviewTitle: string;
    prevPage: string;
    nextPage: string;
    blankLegend: string;
    blankSensitivity: string;
    blankOptions: {
      conservative: string;
      standard: string;
      relaxed: string;
    };
    detectBlankBtn: string;
    detectBlankHint: string;
    blankFoundCandidate: string;
    blankNoCandidate: string;
    candidatePageLabel: string;
    viewCandidate: string;
    selectAllCandidates: string;
    deleteSelectedCandidates: string;
    confirmClear: string;
    undoMsg: string;
    redoMsg: string;
    clearMsg: string;
    cancelMsg: string;
    exportDoneMsg: string;
    previewUnavailable: string;
    previewGenerating: string;
    filenameHints: {
      split: string;
      images: string;
      text: string;
      default: string;
    };
    guideAria: string;
    guideSummary: string;
    guideOrganizeTitle: string;
    guideOrganizeDesc: string;
    guideExportTitle: string;
    guideExportDesc: string;
    guideScopeTitle: string;
    guideScopeDesc: string;
    footerBrand: string;
  };
}

export const zhCN: PdfTranslations = {
  header: {
    brandAria: 'FolioForge 页匠 首页',
    brandTag: '页匠',
    home: '首页',
    pdf: 'PDF 工具',
    guide: '使用指南',
    navAria: '主导航',
  },
  toolsHome: {
    heroBadge: '纯客户端本地运行 · 零云端上传 · 19 项工业级文档工具',
    h1: 'PDF 工具箱',
    intro: '在你的设备本地完成页面装订、电子盖章、离线中英 OCR 与无损体积压缩。保护商业合同与私密档案安全。',
    openWorkbench: '打开 PDF 工作台',
    offlineSpecLink: '离线安全与规格说明',
    pillars: {
      p1Title: '合并与页面装订',
      p1Desc: '自由拖拽排序、旋转正反向，极速拼合多份文档',
      p1Link: '进入合并',
      p2Title: '签名、盖章与水印',
      p2Desc: '触控手写签名、透明印章与中英文字防伪水印',
      p2Link: '进入签署',
      p3Title: '扫描件离线 OCR',
      p3Desc: '内置轻量离线模型，扫描件转可检索文本',
      p3Link: '进入识别',
      p4Title: '无损压缩与对比',
      p4Desc: '对象结构瘦身，双滑块像素级查验修订差异',
      p4Link: '进入瘦身',
    },
    searchPlaceholder: '搜索 19 项工具，如 合并、签名、OCR、压缩…',
    searchAria: '搜索工具',
    clearSearchAria: '清除搜索',
    popular: '热门：',
    popularTags: ['合并', '拆分', '签名', 'OCR', '压缩', '拼版', '空白页'],
    totalToolsBadge: '共 19 项工具',
    filteredBadge: '已筛选 {0} 项',
    groups: {
      organize: { name: '页面整理与拆分', summary: '合并多份文档、拆分单页、调整页序或筛除空白扫描页。' },
      layout: { name: '版面、印记与排版', summary: '连续编号、叠加中英文或图片水印、手写签名与 A4 拼版。' },
      convert: { name: '转换、识别与优化', summary: '本地中英文 OCR、无损或降采样压缩、文本提取与双文档对比。' },
    },
    tools: {
      '合并 PDF': { name: '合并 PDF', description: '将多份 PDF 合并为一份，导出前可自由调整页序。', tag: '多文档合并' },
      '拆分 PDF': { name: '拆分 PDF', description: '将每页另存为独立 PDF，自动打包为 ZIP 下载。', tag: '一键 ZIP' },
      '整理 PDF 页面': { name: '整理 PDF 页面', description: '拖拽调整页面顺序、旋转方向或删除多余页面。', tag: '自由排序' },
      '提取 PDF 页面': { name: '提取 PDF 页面', description: '勾选或输入页码范围，将所需页面导出为新 PDF。', tag: '指定页码' },
      'PDF 双面扫描重排': { name: 'PDF 双面扫描重排', description: '交错排列正反两面扫描页，恢复正常阅读顺序。', tag: '正反交错' },
      'PDF 空白页识别': { name: 'PDF 空白页识别', description: '按墨迹比例筛出疑似空白页，预览确认后批量删除。', tag: '墨迹筛除' },
      'PDF 添加页码': { name: 'PDF 添加页码', description: '设置起始编号、位置与字号，按当前页序连续编号。', tag: '连续编号' },
      'PDF 文字水印': { name: 'PDF 文字水印', description: '叠加中英文水印，可调节颜色、角度与不透明度。', tag: '防伪半透明' },
      'PDF 外观签名': { name: 'PDF 外观签名', description: '手写或上传签名图片，拖放定位后直接写入页面。', tag: '原笔迹签署' },
      'PDF 图片水印': { name: 'PDF 图片水印', description: '叠加 Logo 或透明 PNG，自由调整位置与透明度。', tag: '透明 Logo' },
      'PDF 裁剪边缘': { name: 'PDF 裁剪边缘', description: '按四边毫米数裁剪页面留白，完整保留原文内容。', tag: '毫米级裁白' },
      'PDF 适配 A4': { name: 'PDF 适配 A4', description: '将不同尺寸页面等比居中缩放到横排或竖排 A4。', tag: '居中适配' },
      'PDF 多页拼版': { name: 'PDF 多页拼版', description: '将 2 页或 4 页合排到同一张 A4 纸，适合打印审阅。', tag: '2合1 / 4合1' },
      'PDF 转图片': { name: 'PDF 转图片', description: '逐页渲染导出为 PNG 或 JPG 图片，可选分辨率。', tag: '逐页渲染' },
      '图片转 PDF': { name: '图片转 PDF', description: '将多张 PNG、JPG 图片居中排入 A4 页面合成 PDF。', tag: '图片合成' },
      'PDF 提取文字': { name: 'PDF 提取文字', description: '按页提取并搜索文档内已有文字，一键导出 TXT。', tag: '文本快搜' },
      'PDF 扫描件 OCR': { name: 'PDF 扫描件 OCR', description: '本地模型识别中英文扫描件，导出 TXT 或可搜索 PDF。', tag: '离线 OCR' },
      'PDF 压缩': { name: 'PDF 压缩', description: '提供无损重存与扫描件降采样，直观对比压缩前后体积。', tag: '体积瘦身' },
      'PDF 视觉对比': { name: 'PDF 视觉对比', description: '双文档同步翻页，支持滑块、叠加或左右并排核对差异。', tag: '双文档核对' },
    },
    noResultsTitle: '没有找到相关工具',
    noResultsDesc: '换个关键词试试，或直接查看全部工具。',
    viewAllTools: '查看全部工具',
    faqSummary: '格式支持与离线安全边界说明',
    faq1Title: '1. 内存与规格上限',
    faq1Desc: '单个文档 ≤ 40 MiB、批量总计 ≤ 100 MiB（最多 200 页）。所有运算占用浏览器沙箱内存，保障高分辨率渲染时不卡顿、不闪退。',
    faq2Title: '2. 纯物理级离线安全',
    faq2Desc: '采用 WebAssembly 本地计算引擎，文档不离开本机、不经过任何第三方服务器；断开网络亦可流畅操作，页面关闭即焚烧内存残留。',
    faq3Title: '3. 标准格式与限制',
    faq3Desc: '兼容标准 PDF 1.4 ~ 2.0 文档、多页扫描件、手写签章与高分辨率图片导出；不支持已加密口令保护的文档与动态交互 XFA 表单。',
    faqFooterLink: '阅读完整使用指南与隐私架构说明',
    footer: '纯客户端 19 项文档工具 · 本地离线运行',
  },
  workbench: {
    title: 'PDF 工作台',
    modeGroups: {
      organize: '页面整理',
      layout: '版面印记',
      convert: '识别与转换',
    },
    modes: {
      organize: { label: '整理与合并', detail: '拖拽调整页序、旋转或删除页面，可将多份 PDF 与图片合并为一份文档。' },
      extract: { label: '提取页面', detail: '勾选或输入页码范围，将选中的页面导出为新 PDF。' },
      split: { label: '拆分文档', detail: '将每页单独保存为一份 PDF，统一打包为 ZIP 下载。' },
      duplex: { label: '双面重排', detail: '将分开扫描的正反面交错排回阅读顺序，确认新页序后再应用。' },
      blank: { label: '空白页识别', detail: '按墨迹比例筛选疑似空白页，逐页预览确认后再手动删除。' },
      numbers: { label: '添加页码', detail: '按当前页序编号，先应用到页面预览效果，确认后再导出。' },
      watermark: { label: '文字水印', detail: '叠加中英文水印，可调颜色、角度与不透明度。' },
      stamp: { label: '签名与图片', detail: '手写签名或上传图片，调整位置、大小与不透明度后应用到页面。' },
      layout: { label: '裁剪与排版', detail: '裁剪四边留白、等比适配 A4，或将 2 / 4 页合排到一张纸。' },
      images: { label: '转为图片', detail: '逐页渲染为 PNG 或 JPG 图片，打包为 ZIP 下载。' },
      text: { label: '提取文字', detail: '提取文档内已有的可选文字，支持按页搜索并导出 TXT；扫描图片请改用 OCR。' },
      ocr: { label: '扫描件 OCR', detail: '使用本地模型识别中英文扫描件，导出 TXT 或可搜索 PDF。' },
      compress: { label: '压缩 PDF', detail: '提供重存优化与扫描件降采样，对比压缩前后体积后下载。' },
      compare: { label: '视觉对比', detail: '同步翻页，通过滑块、透明叠加或左右并排对照两份文档。' },
    },
    statusPill: '{0} 份来源 · {1} 页',
    statusOffline: '本地离线处理',
    importInputAria: '导入 PDF 或图片',
    docPages: '文档页面',
    clear: '清空',
    addFiles: '添加文件',
    errorsTitle: '未能完成处理',
    selectedPages: '已选 {0} 页',
    selectAllAria: '全选页面',
    rotate: '旋转',
    delete: '删除',
    undoAria: '撤销',
    redoAria: '重做',
    sourcesStrip: '{0} 个文件 · {1}',
    dragOrderHint: '拖拽页面排序，也可使用前移 / 后移按钮',
    searchText: '搜索提取文字',
    textHintOcrPending: '选择语言和输出格式，点击“开始 OCR”。完成后可在这里按页核对、搜索文字并查看原页。',
    textHintTextPending: '点击“提取文字”，即可在这里按页阅读和搜索。扫描图片页请切换到“扫描件 OCR”。',
    textExtractedSummary: '已{0} {1} 页{2}。每页预览最多 4000 字符，输出保留完整结果；复杂排版可能需要手动整理。',
    noMatch: '没有匹配文字，请更换关键词。',
    viewOriginalPage: '查看原页',
    noTextExtracted: '此页未提取到文字，可能是扫描页。',
    pageNumber: '第 {0} 页',
    dragHandleAria: '拖动第 {0} 页排序',
    dragHandleTitle: '拖动排序；也可按空格和方向键',
    previewPageAria: '预览第 {0} 页',
    preview: '预览',
    origPagePrefix: '原文件第 {0} 页',
    candidateBlank: '候选空白 · 请确认',
    moveUp: '前移',
    moveDown: '后移',
    rotate90: '顺时针旋转 90°',
    deletePage: '删除页面',
    continueAdd: '继续添加',
    emptyAllRemovedTitle: '页面已全部移除',
    emptyStartTitle: '从一份文档开始',
    emptyAllRemovedDesc: '撤销可以恢复页面，也可以添加新的文件。',
    emptyStartDesc: '把 PDF 拖到这里，或添加图片生成 PDF',
    chooseFiles: '选择文件',
    undoDelete: '撤销删除',
    trySampleTitle: '想先试试看？',
    trySampleBtn: '载入示例文档',
    emptyLimits: '单个文件 ≤ 40 MiB · 总计 ≤ 100 MiB · 最多 200 页',
    bottomDragHint: '支持拖入多份 PDF 或 PNG / JPG 图片',
    bottomUndoHint: '支持最近 20 步撤销与重做',
    exportSettings: '导出设置',
    pageScope: '页面范围',
    scopeAll: '全部页面',
    scopeSelected: '选中的页面',
    selectRangeLabel: '按当前顺序选择页码',
    selectRangePlaceholder: '例如 1-3, 5',
    selectBtn: '选择',
    rangeHint: '页码对应左侧排列后的顺序。',
    imageSettings: '图片设置',
    imageFormat: '输出格式',
    pngLossless: 'PNG · 无损图片',
    jpgSmaller: 'JPG · 较小文件',
    resolution: '分辨率',
    dpi72: '72 DPI · 屏幕阅读',
    dpi144: '144 DPI · 清晰预览',
    dpi216: '216 DPI · 更精细',
    imageBoundsHint: '单页最长边限 4096px，最多 1200 万像素。',
    outputFile: '输出文件',
    filename: '文件名',
    exportSummary: '本次导出',
    pagesCount: '{0} 页',
    exportBtn: {
      processing: '正在处理',
      ocr: '开始 OCR',
      compress: '压缩并比较体积',
      text: '提取文字并生成 TXT',
      zip: '生成 ZIP',
      pdf: '生成 PDF',
    },
    rangeNotice: '在左侧勾选页面，或输入页码范围。',
    cancelOperation: '取消操作',
    exportComplete: '导出完成',
    previewFirstPage: '预览结果首页',
    downloadResult: '下载结果',
    outputPreviewTitle: '输出预览 · 第 1 页',
    pagePreviewTitle: '第 {0} 页 / 共 {1} 页',
    prevPage: '上一页',
    nextPage: '下一页',
    blankLegend: '空白候选检测',
    blankSensitivity: '检测灵敏度',
    blankOptions: {
      conservative: '保守 · 最多 0.005% 墨迹',
      standard: '标准 · 最多 0.025% 墨迹',
      relaxed: '宽松 · 最多 0.1% 墨迹',
    },
    detectBlankBtn: '检测 {0} 页',
    detectBlankHint: '检测可见像素，含文字层的页面保留。浅色印章、细线和扫描噪点可能影响结果，请预览确认。',
    blankFoundCandidate: '找到 {0} 个候选页，尚未删除',
    blankNoCandidate: '没有找到空白候选页',
    candidatePageLabel: '候选第 {0} 页',
    viewCandidate: '查看',
    selectAllCandidates: '选择全部候选',
    deleteSelectedCandidates: '删除勾选的候选页',
    confirmClear: '清空当前任务？未下载的编辑结果将丢失，原文件不受影响。',
    undoMsg: '已撤销',
    redoMsg: '已重做',
    clearMsg: '任务已清空',
    cancelMsg: '已取消操作',
    exportDoneMsg: '导出完成，可以下载结果',
    previewUnavailable: '预览不可用',
    previewGenerating: '正在生成预览',
    filenameHints: {
      split: '每页独立保存，文件名自动添加序号。',
      images: '图片按页面顺序编号，打包下载。',
      text: '生成 UTF-8 TXT，按当前页序分隔。不识别扫描图片。',
      default: '按照当前顺序导出，原文件保持不变。',
    },
    guideAria: '使用指南与功能说明',
    guideSummary: '使用指南与支持范围',
    guideOrganizeTitle: '页面整理',
    guideOrganizeDesc: '导入多份 PDF 或 PNG / JPG 图片后，可拖拽卡片或使用上下箭头调整顺序，勾选页面后批量旋转或删除，支持 20 步撤销与重做。',
    guideExportTitle: '导出与识别',
    guideExportDesc: '支持按页码范围（如 1-3, 5）提取、单页拆分打包 ZIP、批量转图片、中英文扫描件 OCR（导出 TXT 或可搜索 PDF）以及体积压缩。',
    guideScopeTitle: '支持范围',
    guideScopeDesc: '单个文件 ≤ 40 MiB，总计 ≤ 100 MiB，最多 200 页。不支持密码加密文档、交互表单与数字签名字段；有损压缩会移除原有文字层与链接。',
    footerBrand: 'FolioForge · 页匠',
  },
};

export const zhTW: PdfTranslations = {
  header: {
    brandAria: 'FolioForge 頁匠 首頁',
    brandTag: '頁匠',
    home: '首頁',
    pdf: 'PDF 工具',
    guide: '使用指南',
    navAria: '主導覽',
  },
  toolsHome: {
    heroBadge: '純用戶端本機執行 · 零雲端上傳 · 19 項專業文件工具',
    h1: 'PDF 工具箱',
    intro: '在裝置本機完成頁面裝訂、數位簽章、離線中英 OCR 與無損檔案壓縮。嚴密保護商業合約與機密檔案安全。',
    openWorkbench: '開啟 PDF 工作台',
    offlineSpecLink: '離線安全與規格說明',
    pillars: {
      p1Title: '合併與頁面裝訂',
      p1Desc: '自由拖曳排序、旋轉正反向，極速拼合多份文件',
      p1Link: '進入合併',
      p2Title: '簽名、蓋章與浮水印',
      p2Desc: '觸控手寫簽名、透明印章與中英文字防偽浮水印',
      p2Link: '進入簽署',
      p3Title: '掃描文件離線 OCR',
      p3Desc: '內建輕量離線模型，掃描件轉可搜尋文字',
      p3Link: '進入辨識',
      p4Title: '無損壓縮與對比',
      p4Desc: '物件結構最佳化，雙滑桿像素級查驗修訂差異',
      p4Link: '進入瘦身',
    },
    searchPlaceholder: '搜尋 19 項工具，如 合併、簽名、OCR、壓縮…',
    searchAria: '搜尋工具',
    clearSearchAria: '清除搜尋',
    popular: '熱門：',
    popularTags: ['合併', '拆分', '簽名', 'OCR', '壓縮', '拼版', '空白頁'],
    totalToolsBadge: '共 19 項工具',
    filteredBadge: '已篩選 {0} 項',
    groups: {
      organize: { name: '頁面整理與拆分', summary: '合併多份文件、拆分單頁、調整頁序或篩除空白掃描頁。' },
      layout: { name: '版面、印記與排版', summary: '連續編號、疊加中英文或圖片浮水印、手寫簽名與 A4 拼版。' },
      convert: { name: '轉換、辨識與最佳化', summary: '本機中英文 OCR、無損或降取樣壓縮、文字擷取與雙文件對比。' },
    },
    tools: {
      '合併 PDF': { name: '合併 PDF', description: '將多份 PDF 合併為一份，匯出前可自由調整頁序。', tag: '多文件合併' },
      '拆分 PDF': { name: '拆分 PDF', description: '將每頁另存為獨立 PDF，自動打包為 ZIP 下載。', tag: '一鍵 ZIP' },
      '整理 PDF 页面': { name: '整理 PDF 頁面', description: '拖曳調整頁面順序、旋轉方向或刪除多餘頁面。', tag: '自由排序' },
      '提取 PDF 页面': { name: '擷取 PDF 頁面', description: '勾選或輸入頁碼範圍，將所需頁面匯出為新 PDF。', tag: '指定頁碼' },
      'PDF 双面扫描重排': { name: 'PDF 雙面掃描重排', description: '交錯排列正反兩面掃描頁，恢復正常閱讀順序。', tag: '正反交錯' },
      'PDF 空白页识别': { name: 'PDF 空白頁辨識', description: '按墨跡比例篩出疑似空白頁，預覽確認後批次刪除。', tag: '墨跡篩除' },
      'PDF 添加页码': { name: 'PDF 新增頁碼', description: '設定起始編號、位置與字級，依目前頁序連續編號。', tag: '連續編號' },
      'PDF 文字水印': { name: 'PDF 文字浮水印', description: '疊加中英文浮水印，可調節顏色、角度與不透明度。', tag: '防偽半透明' },
      'PDF 外观签名': { name: 'PDF 外觀簽名', description: '手寫或上傳簽名圖片，拖放定位後直接寫入頁面。', tag: '原筆跡簽署' },
      'PDF 图片水印': { name: 'PDF 圖片浮水印', description: '疊加 Logo 或透明 PNG，自由調整位置與透明度。', tag: '透明 Logo' },
      'PDF 裁剪边缘': { name: 'PDF 裁切邊緣', description: '按四邊公釐數裁切頁面留白，完整保留原文內容。', tag: '公釐級裁白' },
      'PDF 适配 A4': { name: 'PDF 適配 A4', description: '將不同尺寸頁面等比置中縮放到橫向或直向 A4。', tag: '置中適配' },
      'PDF 多页拼版': { name: 'PDF 多頁拼版', description: '將 2 頁或 4 頁合排到同一張 A4 紙，適合列印審閱。', tag: '2合1 / 4合1' },
      'PDF 转图片': { name: 'PDF 轉圖片', description: '逐頁彩現匯出為 PNG 或 JPG 圖片，可選解析度。', tag: '逐頁彩現' },
      '图片转 PDF': { name: '圖片轉 PDF', description: '將多張 PNG、JPG 圖片置中排入 A4 頁面合成 PDF。', tag: '圖片合成' },
      'PDF 提取文字': { name: 'PDF 擷取文字', description: '按頁擷取並搜尋文件內既有文字，一鍵匯出 TXT。', tag: '文字快搜' },
      'PDF 扫描件 OCR': { name: 'PDF 掃描件 OCR', description: '本機模型辨識中英文掃描件，匯出 TXT 或可搜尋 PDF。', tag: '離線 OCR' },
      'PDF 压缩': { name: 'PDF 壓縮', description: '提供無損重存與掃描件降取樣，直觀對比壓縮前後容量。', tag: '容量瘦身' },
      'PDF 视觉对比': { name: 'PDF 視覺對比', description: '雙文件同步翻頁，支援滑桿、疊加或左右並排核對差異。', tag: '雙文件核對' },
    },
    noResultsTitle: '沒有找到相關工具',
    noResultsDesc: '換個關鍵字試試，或直接檢視全部工具。',
    viewAllTools: '檢視全部工具',
    faqSummary: '格式支援與離線安全邊界說明',
    faq1Title: '1. 記憶體與規格上限',
    faq1Desc: '單一文件 ≤ 40 MiB、批次總計 ≤ 100 MiB（最多 200 頁）。所有運算佔用瀏覽器沙盒記憶體。',
    faq2Title: '2. 純實體級離線安全',
    faq2Desc: '採用 WebAssembly 本機計算引擎，文件不上傳雲端伺服器，關閉分頁即清除記憶體。',
    faq3Title: '3. 標準格式與限制',
    faq3Desc: '相容標準 PDF 1.4 ~ 2.0 文件，不支援已加密口令保護文件與 XFA 表單。',
    faqFooterLink: '閱讀完整使用指南與架構說明',
    footer: '純用戶端 19 項文件工具 · 本機離線執行',
  },
  workbench: {
    ...zhCN.workbench,
    title: 'PDF 工作台',
    statusOffline: '本機離線處理',
    docPages: '文件頁面',
    clear: '清空',
    addFiles: '新增檔案',
    rotate: '旋轉',
    delete: '刪除',
    exportSettings: '匯出設定',
    pageScope: '頁面範圍',
    scopeAll: '全部頁面',
    scopeSelected: '選取的頁面',
    outputFile: '輸出檔案',
    filename: '檔案名稱',
    exportSummary: '本次匯出',
    exportBtn: {
      processing: '處理中…',
      ocr: '開始 OCR',
      compress: '壓縮並比對容量',
      text: '擷取文字並產生 TXT',
      zip: '產生 ZIP',
      pdf: '產生 PDF',
    },
    downloadResult: '下載結果',
    chooseFiles: '選取檔案',
  },
};

export const enUS: PdfTranslations = {
  header: {
    brandAria: 'FolioForge Home',
    brandTag: 'Folio',
    home: 'Home',
    pdf: 'PDF Tools',
    guide: 'Guide',
    navAria: 'Main navigation',
  },
  toolsHome: {
    heroBadge: 'Runs 100% locally in browser · Zero server uploads · 19 industrial document tools',
    h1: 'PDF Toolbox',
    intro: 'Organize pages, stamp & sign, run offline OCR, and compress PDFs locally on your device. Complete privacy for business contracts and personal documents.',
    openWorkbench: 'Open PDF Workbench',
    offlineSpecLink: 'Offline Security & Specifications',
    pillars: {
      p1Title: 'Merge & Page Binding',
      p1Desc: 'Drag and drop to reorder, rotate pages, and combine multiple documents easily',
      p1Link: 'Open Merge',
      p2Title: 'Sign, Stamp & Watermark',
      p2Desc: 'Touch handwriting signatures, transparent stamps, and anti-counterfeiting watermarks',
      p2Link: 'Open Sign',
      p3Title: 'Scanned Document OCR',
      p3Desc: 'Built-in offline neural model converts scans to searchable PDFs & text',
      p3Link: 'Open OCR',
      p4Title: 'Lossless Compression & Diff',
      p4Desc: 'Object tree optimization and dual-slider visual difference inspector',
      p4Link: 'Open Compress',
    },
    searchPlaceholder: 'Search 19 tools, e.g. merge, sign, OCR, compress...',
    searchAria: 'Search tools',
    clearSearchAria: 'Clear search',
    popular: 'Popular:',
    popularTags: ['Merge', 'Split', 'Sign', 'OCR', 'Compress', 'N-up', 'Blank'],
    totalToolsBadge: '19 tools total',
    filteredBadge: '{0} filtered',
    groups: {
      organize: { name: 'Organize & Split', summary: 'Combine multiple documents, split pages, reorder, or filter out blank scanned sheets.' },
      layout: { name: 'Layout, Stamps & Typography', summary: 'Continuous page numbers, text or image watermarks, handwritten signature, and A4 fit.' },
      convert: { name: 'Convert, Recognize & Optimize', summary: 'Offline multilingual OCR, lossless or downsampled compression, text export, and document diffing.' },
    },
    tools: {
      '合并 PDF': { name: 'Merge PDF', description: 'Combine multiple PDFs into a single document with custom page ordering.', tag: 'Multi-doc Merge' },
      '拆分 PDF': { name: 'Split PDF', description: 'Save each page as an independent PDF and download as a ZIP archive.', tag: 'One-click ZIP' },
      '整理 PDF 页面': { name: 'Organize PDF Pages', description: 'Reorder pages via drag-and-drop, rotate orientations, or remove pages.', tag: 'Custom Order' },
      '提取 PDF 页面': { name: 'Extract PDF Pages', description: 'Specify page ranges to extract selected pages into a new PDF.', tag: 'Page Range' },
      'PDF 双面扫描重排': { name: 'Duplex Scan Reorder', description: 'Interleave front and back scanned sheets into true reading sequence.', tag: 'Interleave' },
      'PDF 空白页识别': { name: 'Blank Page Detection', description: 'Detect potential blank pages by ink coverage and delete with preview.', tag: 'Ink Filter' },
      'PDF 添加页码': { name: 'Add Page Numbers', description: 'Configure start number, position, and font size with continuous numbering.', tag: 'Page Numbers' },
      'PDF 文字水印': { name: 'Text Watermark', description: 'Overlay customizable text watermark with color, angle, and opacity.', tag: 'Watermark' },
      'PDF 外观签名': { name: 'Visual Signature', description: 'Draw handwritten signature or upload an image stamp onto pages.', tag: 'Handwritten' },
      'PDF 图片水印': { name: 'Image Watermark', description: 'Place transparent PNG logo with adjustable scale and position.', tag: 'Logo Stamp' },
      'PDF 裁剪边缘': { name: 'Crop Margins', description: 'Trim margins by millimeter measurements without altering text content.', tag: 'Margin Crop' },
      'PDF 适配 A4': { name: 'Fit to A4', description: 'Center and scale varied page sizes proportionally to portrait/landscape A4.', tag: 'Fit to A4' },
      'PDF 多页拼版': { name: 'N-Up Page Imposition', description: 'Impose 2 or 4 pages onto a single A4 sheet for review and printing.', tag: '2-up / 4-up' },
      'PDF 转图片': { name: 'PDF to Images', description: 'Render pages to high-resolution PNG or JPG images in a ZIP bundle.', tag: 'Image Export' },
      '图片转 PDF': { name: 'Images to PDF', description: 'Assemble multiple PNG/JPG images into centered A4 PDF pages.', tag: 'Build PDF' },
      'PDF 提取文字': { name: 'Extract Text', description: 'Extract and search text in existing PDF layers, export to plain text.', tag: 'Text Search' },
      'PDF 扫描件 OCR': { name: 'Scanned PDF OCR', description: 'Local neural network model extracts text from scans to searchable PDF/TXT.', tag: 'Offline OCR' },
      'PDF 压缩': { name: 'Compress PDF', description: 'Lossless object re-saving and scanned image downsampling with before/after stats.', tag: 'File Shrink' },
      'PDF 视觉对比': { name: 'Visual Compare', description: 'Synchronized page-flipping with slider, overlay, or side-by-side mode.', tag: 'Document Diff' },
    },
    noResultsTitle: 'No matching tools found',
    noResultsDesc: 'Try another keyword or view all tools.',
    viewAllTools: 'View all tools',
    faqSummary: 'Format support and offline security specifications',
    faq1Title: '1. Memory & Scale Limits',
    faq1Desc: 'Single document ≤ 40 MiB, batch total ≤ 100 MiB (up to 200 pages). All operations stay inside browser sandbox memory.',
    faq2Title: '2. True Client-Side Security',
    faq2Desc: 'Powered by WebAssembly local engines. Documents never leave your device. Works offline; memory is wiped on tab close.',
    faq3Title: '3. Compatibility & Standards',
    faq3Desc: 'Supports standard PDF 1.4 ~ 2.0 documents, multi-page scans, signatures, and image exports. Encrypted files not supported.',
    faqFooterLink: 'Read full user guide and architecture documentation',
    footer: '19 client-side document tools · Runs locally & offline',
  },
  workbench: {
    title: 'PDF Workbench',
    modeGroups: {
      organize: 'Organize',
      layout: 'Layout & Stamps',
      convert: 'Convert & OCR',
    },
    modes: {
      organize: { label: 'Organize & Merge', detail: 'Reorder, rotate, or delete pages; combine multiple PDFs and images.' },
      extract: { label: 'Extract Pages', detail: 'Select specific page ranges to export into a new PDF document.' },
      split: { label: 'Split Document', detail: 'Save each page as an individual PDF and download as a ZIP bundle.' },
      duplex: { label: 'Duplex Reorder', detail: 'Interleave front and back scanned sheets into natural reading order.' },
      blank: { label: 'Blank Page Filter', detail: 'Screen out pages with low ink coverage and inspect before removal.' },
      numbers: { label: 'Add Page Numbers', detail: 'Number pages continuously with live preview before final export.' },
      watermark: { label: 'Text Watermark', detail: 'Overlay custom watermark text with adjustable color, angle, and opacity.' },
      stamp: { label: 'Signature & Stamp', detail: 'Draw signature or upload image stamp, place and adjust opacity.' },
      layout: { label: 'Crop & Layout', detail: 'Crop margin white space, fit to standard A4, or combine 2/4 pages per sheet.' },
      images: { label: 'Convert to Images', detail: 'Render pages into PNG or JPG images, downloaded as a ZIP archive.' },
      text: { label: 'Extract Text', detail: 'Extract text layer from document with page search and TXT export.' },
      ocr: { label: 'Scanned OCR', detail: 'Extract text using local neural models to generate searchable PDF or TXT.' },
      compress: { label: 'Compress PDF', detail: 'Optimize object streams or downsample scanned images to reduce file size.' },
      compare: { label: 'Visual Diff', detail: 'Compare two documents page-by-page using slider, overlay, or side-by-side.' },
    },
    statusPill: '{0} sources · {1} pages',
    statusOffline: 'Local offline processing',
    importInputAria: 'Import PDF or images',
    docPages: 'Pages',
    clear: 'Clear',
    addFiles: 'Add Files',
    errorsTitle: 'Operation Failed',
    selectedPages: '{0} selected',
    selectAllAria: 'Select all pages',
    rotate: 'Rotate',
    delete: 'Delete',
    undoAria: 'Undo',
    redoAria: 'Redo',
    sourcesStrip: '{0} files · {1}',
    dragOrderHint: 'Drag pages to reorder, or use up / down buttons',
    searchText: 'Search extracted text',
    textHintOcrPending: 'Select language and output format, then click "Start OCR".',
    textHintTextPending: 'Click "Extract Text" to search and read pages here.',
    textExtractedSummary: '{0} extracted for {1} pages{2}.',
    noMatch: 'No matching text found. Try another query.',
    viewOriginalPage: 'View Page',
    noTextExtracted: 'No selectable text found on this page (likely a scan).',
    pageNumber: 'Page {0}',
    dragHandleAria: 'Drag page {0} to reorder',
    dragHandleTitle: 'Drag to reorder; or press Space and Arrow keys',
    previewPageAria: 'Preview page {0}',
    preview: 'Preview',
    origPagePrefix: 'Original page {0}',
    candidateBlank: 'Candidate Blank',
    moveUp: 'Move forward',
    moveDown: 'Move backward',
    rotate90: 'Rotate 90° clockwise',
    deletePage: 'Delete page',
    continueAdd: 'Add More',
    emptyAllRemovedTitle: 'All pages removed',
    emptyStartTitle: 'Start with a document',
    emptyAllRemovedDesc: 'Use Undo to restore pages, or import another document.',
    emptyStartDesc: 'Drop PDF files here, or add images to build a PDF',
    chooseFiles: 'Choose Files',
    undoDelete: 'Undo Remove',
    trySampleTitle: 'Want to try a demo?',
    trySampleBtn: 'Load sample document',
    emptyLimits: 'Single file ≤ 40 MiB · Total ≤ 100 MiB · Max 200 pages',
    bottomDragHint: 'Drop multiple PDF files or PNG / JPG images',
    bottomUndoHint: 'Supports last 20 steps of undo and redo',
    exportSettings: 'Export Settings',
    pageScope: 'Page Scope',
    scopeAll: 'All pages',
    scopeSelected: 'Selected pages',
    selectRangeLabel: 'Select page range',
    selectRangePlaceholder: 'e.g. 1-3, 5',
    selectBtn: 'Select',
    rangeHint: 'Page numbers correspond to current arrangement.',
    imageSettings: 'Image Settings',
    imageFormat: 'Output Format',
    pngLossless: 'PNG · Lossless',
    jpgSmaller: 'JPG · Smaller file',
    resolution: 'Resolution',
    dpi72: '72 DPI · Screen',
    dpi144: '144 DPI · Balanced',
    dpi216: '216 DPI · High-res',
    imageBoundsHint: 'Max dimension limit 4096px, up to 12 MP per page.',
    outputFile: 'Output File',
    filename: 'File name',
    exportSummary: 'Export Scope',
    pagesCount: '{0} pages',
    exportBtn: {
      processing: 'Processing...',
      ocr: 'Start OCR',
      compress: 'Compress & Diff',
      text: 'Extract & Export TXT',
      zip: 'Generate ZIP',
      pdf: 'Export PDF',
    },
    rangeNotice: 'Select pages in workspace or enter range.',
    cancelOperation: 'Cancel',
    exportComplete: 'Export Complete',
    previewFirstPage: 'Preview first page',
    downloadResult: 'Download Result',
    outputPreviewTitle: 'Output Preview · Page 1',
    pagePreviewTitle: 'Page {0} of {1}',
    prevPage: 'Previous',
    nextPage: 'Next',
    blankLegend: 'Blank Page Detection',
    blankSensitivity: 'Sensitivity',
    blankOptions: {
      conservative: 'Conservative · Max 0.005% ink',
      standard: 'Standard · Max 0.025% ink',
      relaxed: 'Relaxed · Max 0.1% ink',
    },
    detectBlankBtn: 'Scan {0} Pages',
    detectBlankHint: 'Calculates visible ink pixels. Inspect candidates before deleting.',
    blankFoundCandidate: 'Found {0} candidate pages',
    blankNoCandidate: 'No blank pages detected',
    candidatePageLabel: 'Candidate page {0}',
    viewCandidate: 'Inspect',
    selectAllCandidates: 'Select all candidates',
    deleteSelectedCandidates: 'Delete selected candidates',
    confirmClear: 'Clear current task? Unsaved edits will be lost, but source files remain untouched.',
    undoMsg: 'Action undone',
    redoMsg: 'Action redone',
    clearMsg: 'Task cleared',
    cancelMsg: 'Operation cancelled',
    exportDoneMsg: 'Export complete. Ready to download.',
    previewUnavailable: 'Preview unavailable',
    previewGenerating: 'Generating preview...',
    filenameHints: {
      split: 'Each page saved separately with automatic sequence numbering.',
      images: 'Images numbered in page order and packaged in a ZIP.',
      text: 'UTF-8 text file separated by page breaks. Scanned images require OCR.',
      default: 'Exported in current page sequence. Source files remain unchanged.',
    },
    guideAria: 'User Guide & Specifications',
    guideSummary: 'User Guide & Capacity Limits',
    guideOrganizeTitle: 'Page Management',
    guideOrganizeDesc: 'Import multiple PDFs or images. Drag or use arrow keys to reorder, select pages to batch rotate or delete, with 20-step undo/redo.',
    guideExportTitle: 'Export & OCR',
    guideExportDesc: 'Extract pages by range (e.g. 1-3, 5), split into individual PDFs in a ZIP, export to images, run offline OCR, or compress file size.',
    guideScopeTitle: 'Limits & Compatibility',
    guideScopeDesc: 'Single file ≤ 40 MiB, total ≤ 100 MiB, up to 200 pages. Password-protected PDFs and dynamic XFA forms are not supported.',
    footerBrand: 'FolioForge · Folio Studio',
  },
};

export const jaJP: PdfTranslations = {
  ...enUS,
  header: {
    brandAria: 'FolioForge ホーム',
    brandTag: 'ページ',
    home: 'ホーム',
    pdf: 'PDF ツール',
    guide: 'ご利用ガイド',
    navAria: 'メインナビゲーション',
  },
  toolsHome: {
    ...enUS.toolsHome,
    heroBadge: 'ブラウザ内ローカル処理 · アップロードなし · 19種類の高機能PDFツール',
    h1: 'PDF ツールボックス',
    intro: 'ページの結合・並べ替え、手書き署名、オフラインOCR、無損圧縮などを端末上で安全に実行。ビジネス文書や機密契約書を保護します。',
    openWorkbench: 'PDF ワークベンチを開く',
    offlineSpecLink: 'オフライン仕様とセキュリティについて',
    popularTags: ['結合', '分割', '署名', 'OCR', '圧縮', '割り付け', '白紙'],
    totalToolsBadge: '全 19 ツール',
    viewAllTools: 'すべてのツールを表示',
    footer: '完全クライアントサイド 19 ツール · ローカル完結',
  },
  workbench: {
    ...enUS.workbench,
    title: 'PDF ワークベンチ',
    statusOffline: 'ローカル・オフライン処理',
    docPages: 'ドキュメントページ',
    clear: 'クリア',
    addFiles: 'ファイルを追加',
    rotate: '回転',
    delete: '削除',
    chooseFiles: 'ファイルを選択',
    undoDelete: '削除を取り消す',
    trySampleBtn: 'サンプルを読み込む',
    exportSettings: 'エクスポート設定',
    pageScope: '対象ページ',
    scopeAll: 'すべてのページ',
    scopeSelected: '選択したページ',
    outputFile: '出力ファイル',
    filename: 'ファイル名',
    downloadResult: '結果をダウンロード',
  },
};

export const koKR: PdfTranslations = {
  ...enUS,
  header: {
    brandAria: 'FolioForge 홈',
    brandTag: '페이지',
    home: '홈',
    pdf: 'PDF 도구',
    guide: '이용 안내',
    navAria: '메인 내비게이션',
  },
  toolsHome: {
    ...enUS.toolsHome,
    heroBadge: '브라우저 로컬 100% 실행 · 클라우드 업로드 없음 · 19가지 PDF 도구',
    h1: 'PDF 도구 모음',
    intro: '페이지 정리, 전자 서명, 오프라인 OCR, 무손실 압축을 기기에서 직접 처리합니다. 비즈니스 계약서와 중요 문서를 안전하게 보호하세요.',
    openWorkbench: 'PDF 워크벤치 열기',
    offlineSpecLink: '오프라인 사양 및 보안 안내',
    popularTags: ['병합', '분할', '서명', 'OCR', '압축', '모아찍기', '빈페이지'],
    totalToolsBadge: '총 19개 도구',
    viewAllTools: '전체 도구 보기',
    footer: '클라이언트 사이드 19개 도구 · 로컬 오프라인 실행',
  },
  workbench: {
    ...enUS.workbench,
    title: 'PDF 작업 공간',
    statusOffline: '로컬 오프라인 처리',
    docPages: '문서 페이지',
    clear: '비우기',
    addFiles: '파일 추가',
    rotate: '회전',
    delete: '삭제',
    chooseFiles: '파일 선택',
    undoDelete: '삭제 취소',
    trySampleBtn: '샘플 문서 불러오기',
    exportSettings: '내보내기 설정',
    pageScope: '페이지 범위',
    scopeAll: '전체 페이지',
    scopeSelected: '선택한 페이지',
    outputFile: '출력 파일',
    filename: '파일 이름',
    downloadResult: '결과 다운로드',
  },
};

export const esES: PdfTranslations = {
  ...enUS,
  header: {
    brandAria: 'Inicio de FolioForge',
    brandTag: 'Folio',
    home: 'Inicio',
    pdf: 'Herramientas PDF',
    guide: 'Guía',
    navAria: 'Navegación principal',
  },
  toolsHome: {
    ...enUS.toolsHome,
    heroBadge: 'Ejecución 100% local en tu navegador · Sin subidas · 19 herramientas PDF',
    h1: 'Caja de herramientas PDF',
    intro: 'Organiza páginas, estampa firmas, aplica OCR offline y comprime tus PDF en tu equipo con privacidad absoluta.',
    openWorkbench: 'Abrir mesa de trabajo PDF',
    offlineSpecLink: 'Seguridad offline y especificaciones',
    totalToolsBadge: '19 herramientas en total',
    viewAllTools: 'Ver todas las herramientas',
    footer: '19 herramientas PDF en el cliente · Funcionamiento local y offline',
  },
  workbench: {
    ...enUS.workbench,
    title: 'Mesa de trabajo PDF',
    statusOffline: 'Procesamiento local offline',
    docPages: 'Páginas del documento',
    clear: 'Vaciar',
    addFiles: 'Añadir archivos',
    rotate: 'Girar',
    delete: 'Eliminar',
    chooseFiles: 'Seleccionar archivos',
    exportSettings: 'Ajustes de exportación',
    downloadResult: 'Descargar archivo',
  },
};

export const deDE: PdfTranslations = {
  ...enUS,
  header: {
    brandAria: 'FolioForge Startseite',
    brandTag: 'Folio',
    home: 'Startseite',
    pdf: 'PDF-Werkzeuge',
    guide: 'Anleitung',
    navAria: 'Hauptnavigation',
  },
  toolsHome: {
    ...enUS.toolsHome,
    heroBadge: 'Läuft 100% lokal im Browser · Kein Cloud-Upload · 19 PDF-Werkzeuge',
    h1: 'PDF-Werkzeugkasten',
    intro: 'Seiten anordnen, unterschreiben, OCR offline ausführen und PDFs verlustfrei komprimieren – direkt auf Ihrem Gerät.',
    openWorkbench: 'PDF-Arbeitsbereich öffnen',
    offlineSpecLink: 'Offline-Sicherheit & Spezifikationen',
    totalToolsBadge: '19 Werkzeuge insgesamt',
    viewAllTools: 'Alle Werkzeuge anzeigen',
    footer: '19 clientseitige PDF-Werkzeuge · Lokal & offline',
  },
  workbench: {
    ...enUS.workbench,
    title: 'PDF-Arbeitsbereich',
    statusOffline: 'Lokale Offline-Verarbeitung',
    docPages: 'Dokumentseiten',
    clear: 'Leeren',
    addFiles: 'Dateien hinzufügen',
    rotate: 'Drehen',
    delete: 'Löschen',
    chooseFiles: 'Dateien auswählen',
    exportSettings: 'Exporteinstellungen',
    downloadResult: 'Ergebnis herunterladen',
  },
};

export const frFR: PdfTranslations = {
  ...enUS,
  header: {
    brandAria: 'Accueil FolioForge',
    brandTag: 'Folio',
    home: 'Accueil',
    pdf: 'Outils PDF',
    guide: 'Guide',
    navAria: 'Navigation principale',
  },
  toolsHome: {
    ...enUS.toolsHome,
    heroBadge: 'Traitement 100% local dans le navigateur · Aucun envoi · 19 outils PDF',
    h1: 'Boîte à outils PDF',
    intro: 'Organisez les pages, signez, lancez l\'OCR hors ligne et compressez vos PDF en toute confidentialité.',
    openWorkbench: 'Ouvrir l\'atelier PDF',
    offlineSpecLink: 'Sécurité hors ligne & spécifications',
    totalToolsBadge: '19 outils au total',
    viewAllTools: 'Voir tous les outils',
    footer: '19 outils PDF côté client · Exécution locale hors ligne',
  },
  workbench: {
    ...enUS.workbench,
    title: 'Atelier PDF',
    statusOffline: 'Traitement local hors ligne',
    docPages: 'Pages du document',
    clear: 'Vider',
    addFiles: 'Ajouter des fichiers',
    rotate: 'Pivoter',
    delete: 'Supprimer',
    chooseFiles: 'Sélectionner des fichiers',
    exportSettings: 'Paramètres d\'exportation',
    downloadResult: 'Télécharger le résultat',
  },
};

const dictionaries: Record<Locale, PdfTranslations> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'es-ES': esES,
  'de-DE': deDE,
  'fr-FR': frFR,
};

export function usePdfI18n() {
  const { locale, setLocale, locales } = useLocale();
  const t = dictionaries[locale] || dictionaries['en-US'];
  return { locale, setLocale, locales, t };
}
