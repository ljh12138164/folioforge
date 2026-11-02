'use client';

import { useLocale } from '@pixelforge/ui/i18n';
import type { Locale } from '@pixelforge/ui/i18n';

export interface ImageTranslations {
  header: {
    brandAria: string;
    brandTag: string;
    home: string;
    convert: string;
    formats: string;
    guide: string;
    navAria: string;
  };
  home: {
    heroBadge: string;
    title: string;
    subtitle: string;
    startConvert: string;
    trySample: string;
    reconvertSample: string;
    convertingSample: string;
    stripParallel: string;
    stripPrivacy: string;
    stripVector: string;
    samplePicAlt: string;
    sampleResultAlt: string;
    compareOriginal: string;
    sampleOriginal: string;
    compareResultPrefix: string;
    clickTrySample: string;
    dragCompare: string;
    callingWasm: string;
    targetFormat: string;
    quality: string;
    qualityHints: {
      fidelity: string;
      balanced: string;
      standard: string;
      compact: string;
    };
    sizeLimit: string;
    keepSize: string;
    maxWidth1920: string;
    maxWidth1280: string;
    maxWidth640: string;
    enterWorkbench: string;
    sampleTip: string;
    otherFormats: string;
    allFormatsCount: string;
    formatTip: string;
    batchGuideTitle: string;
    batchGuideSubtitle: string;
    cards: {
      zeroUploadTitle: string;
      zeroUploadDesc: string;
      standardBinaryTitle: string;
      standardBinaryDesc: string;
      persistenceTitle: string;
      persistenceDesc: string;
    };
    openWorkbench: string;
    footerSupported: string;
  };
  formatTags: Record<string, string>;
  app: {
    workbenchTitle: string;
    workbenchSummary: string;
    pillTemp: string;
    pillQueue: string;
    pillOffline: string;
    tempNoticeTitle: string;
    tempNoticeDesc: string;
    saving: string;
    updating: string;
    reconvertAll: string;
    retryFailed: string;
    yourImages: string;
    clear: string;
    addImages: string;
    dropTitle: string;
    dropSubtitle: string;
    chooseImages: string;
    supportedFormatsHint: string;
    maxSizePerFile: string;
    noImagesHint: string;
    trySampleAction: string;
    continueAdd: string;
    bottomLimit: string;
    bottomClipboard: string;
    statusNames: {
      waiting: string;
      working: string;
      paused: string;
      interrupted: string;
      done: string;
      error: string;
      cancelled: string;
    };
    settingsTitle: string;
    targetFormatLabel: string;
    moreFormats: string;
    lessFormats: string;
    icoNote: string;
    heicNote: string;
    svgPresetLabel: string;
    svgPresets: {
      poster: string;
      bw: string;
      photo: string;
    };
    svgPresetHelp: string;
    imageQuality: string;
    losslessFixed: string;
    smallerSize: string;
    higherQuality: string;
    resizeTitle: string;
    keepAspect: string;
    maxWidth: string;
    maxHeight: string;
    origWidth: string;
    origHeight: string;
    resizeHelp: string;
    stripMetadata: string;
    stripMetadataSub: string;
    bgFill: string;
    svgBgHelp: string;
    convertAll: string;
    reconvert: string;
    resume: string;
    convertingProgress: string;
    itemsCount: string;
    pause: string;
    cancelRemaining: string;
    stoppingHint: string;
    parallelHint: string;
    resumeHint: string;
    targetFormatHint: string;
    engineError: string;
    enginePreparing: string;
    reloadEngine: string;
    doneBanner: string;
    savedPercent: string;
    largerWarning: string;
    downloadZip: string;
    staticOnlyTip: string;
    viewFormatSupport: string;
    engineOnline: string;
    engineNeedsReload: string;
    formatSupportTitle: string;
    userGuideTitle: string;
    formatsIntro: string;
    formatHeaderCol: string;
    importCol: string;
    exportCol: string;
    supported: string;
    notSupported: string;
    detecting: string;
    formatsFooterHelp: string;
    guideSteps: {
      step1Title: string;
      step1Desc: string;
      step2Title: string;
      step2Desc: string;
      step3Title: string;
      step3Desc: string;
    };
    guideSessionNotice: string;
    guidePersistentNotice: string;
    dragOverlayTitle: string;
    dragOverlaySub: string;
  };
  compare: {
    title: string;
    zoomGroup: string;
    zoomOut: string;
    zoomIn: string;
    zoomRatio: string;
    fit: string;
    enterFullscreen: string;
    exitFullscreen: string;
    originalAlt: string;
    resultAlt: string;
    previewIncomplete: string;
    generatingPreview: string;
    originalTag: string;
    convertedTag: string;
    dragSliderAria: string;
    originalValText: string;
    readingDimensions: string;
    sizeReduced: string;
    sizeIncreased: string;
    previewFailed: string;
    encoding: string;
    convertedFormat: string;
    waitingResult: string;
    currentImage: string;
    downloadFormat: string;
    hintFallback: string;
    hintPixel: string;
    hintBase: string;
    previewUnavailable: string;
    resultUnavailable: string;
    fullscreenUnavailable: string;
  };
  guidePage: {
    breadcrumbHome: string;
    breadcrumbGuide: string;
    title: string;
    intro: string;
    updatedAt: string;
    sec1Title: string;
    sec1Step1: string;
    sec1Step2: string;
    sec1Step3: string;
    sec1Formats: string;
    samplePageLink: string;
    caption: string;
    colType: string;
    colLimits: string;
    rowHeic: string;
    rowSvg: string;
    rowPsd: string;
    rowSize: string;
    sec2Title: string;
    sec2P1: string;
    sec2P2: string;
    sec3Title: string;
    sec3P1: string;
    sec3P2: string;
    backHome: string;
    openWorkbench: string;
  };
}

export const zhCN: ImageTranslations = {
  header: {
    brandAria: 'PixelForge 首页',
    brandTag: '图工',
    home: '首页',
    convert: '图片转换',
    formats: '格式支持',
    guide: '使用指南',
    navAria: '主导航',
  },
  home: {
    heroBadge: '多线程 WebAssembly 并发引擎 · 100% 本地内存运行 · 16 种格式全向互转',
    title: '图片格式转换',
    subtitle: '在你的浏览器本地批量高速转换 WebP、AVIF、JPG、PNG、SVG 等 16 种格式。实时像素级滑块对比画质，智能矢量描摹与无损重存，兼顾极致压缩与视觉保真。',
    startConvert: '开始转换',
    trySample: '试用示例',
    reconvertSample: '重新转换示例',
    convertingSample: '正在转换示例',
    stripParallel: '多核并行并发',
    stripPrivacy: '物理级私密零上传',
    stripVector: '智能矢量描摹与无损优化',
    samplePicAlt: '山林与湖泊的示例图片',
    sampleResultAlt: '示例图片的实际转换结果',
    compareOriginal: '原图 · PNG 2.83 MB',
    sampleOriginal: '示例图片 · 2172 × 724',
    compareResultPrefix: '转换结果 · ',
    clickTrySample: '点击「试用示例」查看实时效果',
    dragCompare: '拖动以对比示例转换效果',
    callingWasm: '正在调用 WASM 引擎转换示例…',
    targetFormat: '目标格式',
    quality: '画质',
    qualityHints: {
      fidelity: '极致保真',
      balanced: '高平衡推荐',
      standard: '标准压缩',
      compact: '极限体积',
    },
    sizeLimit: '尺寸限制',
    keepSize: '保持原始尺寸',
    maxWidth1920: '最长宽度 1920px (超清)',
    maxWidth1280: '最长宽度 1280px (高清)',
    maxWidth640: '最长宽度 640px (缩略图)',
    enterWorkbench: '用此参数进入工作台',
    sampleTip: '示例图片仅供体验转换效果。修改格式、画质或尺寸后，点击「重新转换示例」即可查看变化。',
    otherFormats: '还支持这些格式',
    allFormatsCount: '共 16 种格式全向互转',
    formatTip: 'HEIC、SVG 支持导入与导出，HEIF 可导入。SVG 导出为矢量描摹；PSD 只保留合成图。',
    batchGuideTitle: '批量处理说明',
    batchGuideSubtitle: '纯客户端架构 · 保护商业资产保密性',
    cards: {
      zeroUploadTitle: '全链路客户端执行 (Zero Upload)',
      zeroUploadDesc: '在转换工作台中可一次添加多张图片，统一设置目标格式、编码质量和最大宽高。转换完成后可单张下载，也可打包为 ZIP。',
      standardBinaryTitle: '真实标准二进制编解码',
      standardBinaryDesc: '采用官方标准构建的 WebAssembly 引擎输出标准文件流，绝非简易修改文件后缀名，保证在各种专业图形设计软件与浏览器中正常解码显示。',
      persistenceTitle: '会话持久化与离线支持',
      persistenceDesc: '单张图片上限为 40 MB、4800 万像素。图片任务和转换结果会自动保存在此设备，刷新或重开页面可继续；清空任务会删除本地副本。',
    },
    openWorkbench: '进入转换工作台',
    footerSupported: '支持 16 种图片格式',
  },
  formatTags: {
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
  },
  app: {
    workbenchTitle: '图片转换工作台',
    workbenchSummary: '批量导入图片，统一设置目标格式、编码质量与最大尺寸。',
    pillTemp: '临时工作区 · 关闭前请下载',
    pillQueue: '队列 {0} 张 · 已完成 {1} 张',
    pillOffline: '本机编码 · 文件不上传',
    tempNoticeTitle: '此窗口为临时工作区，关闭前请下载结果',
    tempNoticeDesc: '当前窗口的图片和结果不会自动保存，刷新或关闭后将丢失。',
    saving: '正在保存…',
    updating: '正在更新…',
    reconvertAll: '按当前设置重新转换全部',
    retryFailed: '重试失败项',
    yourImages: '你的图片',
    clear: '清空',
    addImages: '添加图片',
    dropTitle: '把图片拖到这里',
    dropSubtitle: '或者从设备中选择，一次可以添加多张',
    chooseImages: '选择图片',
    supportedFormatsHint: '支持 JPG、PNG、WebP、AVIF、HEIC 等格式',
    maxSizePerFile: '单张最大 40 MB',
    noImagesHint: '手边没有图片？',
    trySampleAction: '试试这张示例',
    continueAdd: '继续添加，或直接拖入更多图片',
    bottomLimit: '单张最大 40 MB · 4800 万像素',
    bottomClipboard: '支持粘贴剪贴板图片',
    statusNames: {
      waiting: '等待转换',
      working: '转换中',
      paused: '已暂停',
      interrupted: '已中断',
      done: '已完成',
      error: '未完成',
      cancelled: '已取消',
    },
    settingsTitle: '转换设置',
    targetFormatLabel: '目标格式',
    moreFormats: '更多格式',
    lessFormats: '收起',
    icoNote: ' · 最长边 256px',
    heicNote: ' · 8 位静态图，始终移除元数据；大图编码较慢',
    svgPresetLabel: '矢量描摹模式',
    svgPresets: {
      poster: '彩色图标',
      bw: '黑白线稿',
      photo: '照片描摹',
    },
    svgPresetHelp: '生成可缩放的路径；照片为近似描摹，文字转为轮廓。最多 400 万像素。',
    imageQuality: '图片质量',
    losslessFixed: '无损 / 固定编码',
    smallerSize: '更小体积',
    higherQuality: '更高画质',
    resizeTitle: '调整尺寸',
    keepAspect: '保持比例',
    maxWidth: '最大宽度',
    maxHeight: '最大高度',
    origWidth: '原始宽度',
    origHeight: '原始高度',
    resizeHelp: '留空保持原尺寸，只缩小、不放大',
    stripMetadata: '移除元数据',
    stripMetadataSub: '也会移除 ICC 色彩配置',
    bgFill: '透明区域填充颜色',
    svgBgHelp: '透明与半透明区域先合成到此背景色。',
    convertAll: '转换全部图片',
    reconvert: '重新转换',
    resume: '继续未完成任务',
    convertingProgress: '正在转换 {0} / {1}',
    itemsCount: '{0} 张',
    pause: '暂停',
    cancelRemaining: '取消剩余任务',
    stoppingHint: '正在停止领取新任务；暂停会等待已开始的图片完成',
    parallelHint: '最多同时处理 {0} 张；大图单独处理',
    resumeHint: '继续时使用原任务设置，保留已完成结果',
    targetFormatHint: '目标格式：{0}',
    engineError: '引擎加载失败',
    enginePreparing: '正在准备转换引擎…',
    reloadEngine: '重新加载引擎',
    doneBanner: '{0} 张图片已转换',
    savedPercent: '节省 {0}%',
    largerWarning: '此设置下输出体积更大',
    downloadZip: '下载 ZIP',
    staticOnlyTip: '仅处理静态图片。HEIC 支持导入与导出，HEIF 可导入；PSD 只保留合成图。',
    viewFormatSupport: '查看格式支持',
    engineOnline: '引擎就绪 · {0} 种导出格式',
    engineNeedsReload: '引擎需要重新加载',
    formatSupportTitle: '格式支持',
    userGuideTitle: '使用指南',
    formatsIntro: '导入与导出能力分别检测。SVG 导入由浏览器栅格化，导出由本地 WASM 描摹为路径。仅转换静态图像；PSD 只读取合成图。',
    formatHeaderCol: '格式 / 用途',
    importCol: '导入',
    exportCol: '导出',
    supported: '支持',
    notSupported: '不支持',
    detecting: '检测中',
    formatsFooterHelp: '图片工作台不支持 PDF 和相机 RAW。SVG 描摹最多 400 万像素，透明区域合成到所选背景色，不保留原 SVG 的文字与图层结构。EXR 等高动态范围格式的色深与色彩保真不在本版支持范围内。',
    guideSteps: {
      step1Title: '导入图片',
      step1Desc: '选择文件、拖入文件或直接粘贴剪贴板图片。单张图片不超过 40 MB、4800 万像素。',
      step2Title: '设置格式与参数',
      step2Desc: '选择目标格式与编码质量；宽高用于限制最大边界，始终等比缩小。ICO 最长边为 256px；JPG、BMP 与 HEIC 的透明区域会填充所选背景色。',
      step3Title: '对比预览并下载',
      step3Desc: '导入或修改参数后自动生成当前图片的转换预览，可拖动分割线对比画质，查看实际文件体积并直接下载。批量转换后可打包为 ZIP。',
    },
    guideSessionNotice: '此窗口为临时工作区，图片与结果不会自动保存。请在刷新或关闭窗口前下载所需结果；清空仅移除此窗口的图片。',
    guidePersistentNotice: '图片与转换结果会自动保存在此设备，刷新或重开页面可继续。清空任务会删除本地副本，清除网站数据也会删除任务。',
    dragOverlayTitle: '松开即可添加图片',
    dragOverlaySub: '支持同时拖入多张图片',
  },
  compare: {
    title: '原图与结果对照',
    zoomGroup: '对照缩放',
    zoomOut: '缩小对照',
    zoomIn: '放大对照',
    zoomRatio: '对照缩放比例',
    fit: '适应',
    enterFullscreen: '全屏对照',
    exitFullscreen: '退出全屏对照',
    originalAlt: '转换前的原图',
    resultAlt: '实际转换结果',
    previewIncomplete: '预览未完成',
    generatingPreview: '正在生成转换预览…',
    originalTag: '原图 · ',
    convertedTag: ' · 转换后',
    dragSliderAria: '拖动以对比转换前后图片',
    originalValText: '原图 {0}%，结果 {1}%',
    readingDimensions: '读取尺寸中',
    sizeReduced: '减少 {0}%',
    sizeIncreased: '增大 {0}%',
    previewFailed: '预览失败',
    encoding: '编码中',
    convertedFormat: '转换后 · ',
    waitingResult: '等待实际编码结果',
    currentImage: '当前图片 · ',
    downloadFormat: '下载 ',
    hintFallback: '当前格式使用引擎缩略预览，100% 按预览像素显示，不代表原图像素细节。',
    hintPixel: '100% 按原图像素显示，缩小后的结果对齐放大。',
    hintBase: '拖动分界线对照，拖动画面平移；Ctrl / ⌘ + 滚轮缩放。{0}修改设置后自动更新当前图片预览。',
    previewUnavailable: '原图预览不可用，请尝试重新转换。',
    resultUnavailable: '结果预览不可用，仍可下载转换后的文件。',
    fullscreenUnavailable: '全屏不可用，可继续在工作台中缩放对照。',
  },
  guidePage: {
    breadcrumbHome: '首页',
    breadcrumbGuide: '使用指南',
    title: '图片转换使用指南',
    intro: 'PixelForge 在浏览器本地转换图片格式，批量调整画质与尺寸。文件内容无需上传服务器。',
    updatedAt: '更新于',
    sec1Title: '怎样转换 HEIC、WebP 和其他图片格式？',
    sec1Step1: '进入图片转换工作台，选择、拖入或粘贴图片。',
    sec1Step2: '选择目标格式；有损编码可以调整画质。宽、高表示最大边界，始终保持比例，只缩小、不放大。只填一边时另一边自动按比例计算。',
    sec1Step3: '查看原图和实际转换结果的滑块对照、分辨率与文件体积，再单张下载；批量转换完成后可下载 ZIP。',
    sec1Formats: '支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、HEIC、QOI、TGA、PSD、JPEG 2000、EXR、SVG 共 16 种导出格式。',
    samplePageLink: '图片示例页可直接试用转换与参数设置。',
    caption: '图片格式与处理边界',
    colType: '类型',
    colLimits: '支持方式与限制',
    rowHeic: 'HEIC 支持导入与导出，HEIF 仅导入；HEIC 导出会合成透明背景。',
    rowSvg: '导入时转为位图；导出时将图像描摹为矢量路径，最多 400 万像素。',
    rowPsd: 'PSD 只保留合成图；仅处理静态图像，不保留动画帧；不保证 EXR 等格式的 HDR 色深与色彩保真。',
    rowSize: '单张最多 40 MB、4800 万像素；ICO 最长边 256px。转换后体积可能增大，以实际结果为准。',
    sec2Title: 'SVG 描摹和调整尺寸怎么配合？',
    sec2P1: 'SVG 导出会先按设定尺寸缩小输入图像，再用 Rust / WebAssembly 描摹出路径。比如 2172 × 724 的图片，最大宽度填 640 时，先缩为约 640 × 213，再生成 SVG。尺寸越小，参与描摹的细节越少；生成的路径可以继续放大，但不会恢复缩小前已经丢失的细节。',
    sec2P2: '彩色图标、黑白线稿和照片描摹对应不同的描摹方式。图标与线稿通常更适合矢量化；照片会得到近似色块和轮廓。透明与半透明区域会先合成到所选背景色，不保留原 SVG 的可编辑文字、图层或滤镜结构。',
    sec3Title: '本地处理、离线与隐私',
    sec3P1: '图片引擎加载后在本机执行；首次加载或缺少资源时仍需要网络。图片任务、参数与转换结果保存在当前浏览器，刷新或重开可继续；清除网站数据会移除这些副本，存储不可用时使用临时工作区。',
    sec3P2: '文件内容与处理结果不发送到业务服务器。网站配置访问统计后，仅统计页面访问、来源及浏览器信息，排除 URL 查询参数与片段，不发送文件名或文件内容。本地预览与桌面端不启用统计。',
    backHome: '返回首页',
    openWorkbench: '打开图片转换工作台',
  },
};

export const zhTW: ImageTranslations = {
  header: {
    brandAria: 'PixelForge 首頁',
    brandTag: '圖工',
    home: '首頁',
    convert: '圖片轉檔',
    formats: '格式支援',
    guide: '使用指南',
    navAria: '主導覽',
  },
  home: {
    heroBadge: '多執行緒 WebAssembly 並行引擎 · 100% 本機記憶體執行 · 16 種格式自由互轉',
    title: '圖片格式轉換',
    subtitle: '在瀏覽器本機批次高速轉換 WebP、AVIF、JPG、PNG、SVG 等 16 種格式。即時像素級滑桿對比畫質，智慧向量描摹與無損重存，兼顧極致壓縮與視覺保真。',
    startConvert: '開始轉檔',
    trySample: '體驗範例',
    reconvertSample: '重新轉換範例',
    convertingSample: '正在轉換範例',
    stripParallel: '多核心平行處理',
    stripPrivacy: '本機隱私零上傳',
    stripVector: '智慧向量描摹與最佳化',
    samplePicAlt: '山林與湖泊的範例圖片',
    sampleResultAlt: '範例圖片的實際轉換結果',
    compareOriginal: '原圖 · PNG 2.83 MB',
    sampleOriginal: '範例圖片 · 2172 × 724',
    compareResultPrefix: '轉換結果 · ',
    clickTrySample: '點擊「體驗範例」檢視即時效果',
    dragCompare: '拖動以對比範例轉換效果',
    callingWasm: '正在呼叫 WASM 引擎轉換範例…',
    targetFormat: '目標格式',
    quality: '畫質',
    qualityHints: {
      fidelity: '極致保真',
      balanced: '高平衡推薦',
      standard: '標準壓縮',
      compact: '極限檔案大小',
    },
    sizeLimit: '尺寸限制',
    keepSize: '保持原始尺寸',
    maxWidth1920: '最長寬度 1920px (超清)',
    maxWidth1280: '最長寬度 1280px (高清)',
    maxWidth640: '最長寬度 640px (縮圖)',
    enterWorkbench: '以此參數進入工作台',
    sampleTip: '範例圖片僅供體驗轉換效果。修改格式、畫質或尺寸後，點擊「重新轉換範例」即可查看變化。',
    otherFormats: '還支援這些格式',
    allFormatsCount: '共 16 種格式全向互轉',
    formatTip: 'HEIC、SVG 支援匯入與匯出，HEIF 可匯入。SVG 匯出為向量描摹；PSD 僅保留合成圖。',
    batchGuideTitle: '批次處理說明',
    batchGuideSubtitle: '純用戶端架構 · 保護商業資產機密性',
    cards: {
      zeroUploadTitle: '全流程用戶端執行 (Zero Upload)',
      zeroUploadDesc: '在轉檔工作台中可一次新增多張圖片，統一設定目標格式、編碼品質與最大寬高。轉換完成後可單張下載，也可打包為 ZIP。',
      standardBinaryTitle: '標準二進位編解碼',
      standardBinaryDesc: '採用官方標準建置的 WebAssembly 引擎輸出標準檔案流，絕非簡單修改副檔名，確保在專業設計軟體與瀏覽器中正常解碼。',
      persistenceTitle: '作業階段保存與離線支援',
      persistenceDesc: '單張圖片上限為 40 MB、4800 萬像素。圖片任務與轉換結果會自動儲存在本機裝置，重新整理或重開頁面可繼續。',
    },
    openWorkbench: '進入轉檔工作台',
    footerSupported: '支援 16 種圖片格式',
  },
  formatTags: {
    SVG: '向量描摹',
    HEIC: '蘋果實拍',
    GIF: '動態影像',
    TIFF: '出版印刷',
    BMP: '點陣位圖',
    ICO: '網站圖示',
    JXL: '新一代 JPEG',
    QOI: '極速編解碼',
    TGA: '紋理色版',
    PSD: '合成圖層',
    JP2: '小波壓縮',
    EXR: '工業 HDR',
  },
  app: {
    workbenchTitle: '圖片轉檔工作台',
    workbenchSummary: '批次匯入圖片，統一設定目標格式、編碼品質與最大尺寸。',
    pillTemp: '暫存工作區 · 關閉前請下載',
    pillQueue: '佇列 {0} 張 · 已完成 {1} 張',
    pillOffline: '本機編碼 · 檔案不上傳',
    tempNoticeTitle: '此視窗為暫存工作區，關閉前請下載結果',
    tempNoticeDesc: '目前視窗的圖片與結果不會自動保存，重新整理或關閉後將遺失。',
    saving: '正在儲存…',
    updating: '正在更新…',
    reconvertAll: '依目前設定重新轉換全部',
    retryFailed: '重試失敗項目',
    yourImages: '你的圖片',
    clear: '清空',
    addImages: '新增圖片',
    dropTitle: '把圖片拖曳到這裡',
    dropSubtitle: '或從裝置中選取，一次可新增多張',
    chooseImages: '選取圖片',
    supportedFormatsHint: '支援 JPG、PNG、WebP、AVIF、HEIC 等格式',
    maxSizePerFile: '單張上限 40 MB',
    noImagesHint: '手邊沒有圖片？',
    trySampleAction: '試試這張範例',
    continueAdd: '繼續新增，或直接拖入更多圖片',
    bottomLimit: '單張上限 40 MB · 4800 萬像素',
    bottomClipboard: '支援貼上剪貼簿圖片',
    statusNames: {
      waiting: '等待轉換',
      working: '轉換中',
      paused: '已暫停',
      interrupted: '已中斷',
      done: '已完成',
      error: '未完成',
      cancelled: '已取消',
    },
    settingsTitle: '轉檔設定',
    targetFormatLabel: '目標格式',
    moreFormats: '更多格式',
    lessFormats: '收起',
    icoNote: ' · 最長邊 256px',
    heicNote: ' · 8 位元靜態圖，一律移除中繼資料；大圖編碼較慢',
    svgPresetLabel: '向量描摹模式',
    svgPresets: {
      poster: '彩色圖示',
      bw: '黑白線稿',
      photo: '相片描摹',
    },
    svgPresetHelp: '產生可縮放的路徑；相片為近似描摹，文字轉為外框。最多 400 萬像素。',
    imageQuality: '圖片品質',
    losslessFixed: '無損 / 固定編碼',
    smallerSize: '較小容量',
    higherQuality: '較高畫質',
    resizeTitle: '調整尺寸',
    keepAspect: '等比縮放',
    maxWidth: '最大寬度',
    maxHeight: '最大高度',
    origWidth: '原始寬度',
    origHeight: '原始高度',
    resizeHelp: '留空保持原尺寸，僅縮小、不放大',
    stripMetadata: '移除中繼資料',
    stripMetadataSub: '同時移除 ICC 色彩描述',
    bgFill: '透明區域填補色彩',
    svgBgHelp: '透明與半透明區域會先合成至此背景色。',
    convertAll: '轉換全部圖片',
    reconvert: '重新轉換',
    resume: '接續未完成任務',
    convertingProgress: '正在轉換 {0} / {1}',
    itemsCount: '{0} 張',
    pause: '暫停',
    cancelRemaining: '取消剩餘任務',
    stoppingHint: '正在停止領取新任務；暫停會等待已開始的圖片完成',
    parallelHint: '最多同時處理 {0} 張；大圖獨立處理',
    resumeHint: '繼續時使用原任務設定，保留已完成結果',
    targetFormatHint: '目標格式：{0}',
    engineError: '引擎載入失敗',
    enginePreparing: '正在準備轉檔引擎…',
    reloadEngine: '重新載入引擎',
    doneBanner: '{0} 張圖片已完成轉換',
    savedPercent: '節省 {0}%',
    largerWarning: '在此設定下輸出容量可能增加',
    downloadZip: '下載 ZIP',
    staticOnlyTip: '僅處理靜態圖片。HEIC 支援匯入與匯出，HEIF 可匯入；PSD 僅保留合成圖。',
    viewFormatSupport: '檢視格式支援',
    engineOnline: '引擎就緒 · {0} 種匯出格式',
    engineNeedsReload: '引擎需要重新載入',
    formatSupportTitle: '格式支援',
    userGuideTitle: '使用指南',
    formatsIntro: '匯入與匯出能力分別檢測。SVG 匯入由瀏覽器點陣化，匯出由本機 WASM 描摹為路徑。僅轉換靜態影像；PSD 僅讀取合成圖。',
    formatHeaderCol: '格式 / 用途',
    importCol: '匯入',
    exportCol: '匯出',
    supported: '支援',
    notSupported: '不支援',
    detecting: '檢測中',
    formatsFooterHelp: '圖片工作台不支援 PDF 與相機 RAW。SVG 描摹最多 400 萬像素，透明區域合成至所選背景色，不保留原 SVG 的文字與圖層結構。',
    guideSteps: {
      step1Title: '匯入圖片',
      step1Desc: '選取檔案、拖曳檔案或直接貼上剪貼簿圖片。單張不超過 40 MB、4800 萬像素。',
      step2Title: '設定格式與參數',
      step2Desc: '選擇目標格式與編碼品質；寬高用於限制最大邊界，一律等比縮小。',
      step3Title: '對比預覽並下載',
      step3Desc: '匯入或修改參數後自動產生即時預覽，可拖曳分割線對比畫質，批次完成後打包為 ZIP。',
    },
    guideSessionNotice: '此視窗為暫存工作區，圖片與結果不會自動保存。請在關閉前下載所需結果。',
    guidePersistentNotice: '圖片與轉換結果會自動儲存在此裝置，重新整理或重開頁面可繼續。',
    dragOverlayTitle: '放開即可新增圖片',
    dragOverlaySub: '支援同時拖入多張圖片',
  },
  compare: {
    title: '原圖與結果對比',
    zoomGroup: '對比縮放',
    zoomOut: '縮小對比',
    zoomIn: '放大對比',
    zoomRatio: '縮放比例',
    fit: '符合視窗',
    enterFullscreen: '全螢幕對比',
    exitFullscreen: '結束全螢幕',
    originalAlt: '轉換前的原圖',
    resultAlt: '實際轉換結果',
    previewIncomplete: '預覽未完成',
    generatingPreview: '正在產生轉換預覽…',
    originalTag: '原圖 · ',
    convertedTag: ' · 轉換後',
    dragSliderAria: '拖曳以對比轉換前後圖片',
    originalValText: '原圖 {0}%，結果 {1}%',
    readingDimensions: '讀取尺寸中',
    sizeReduced: '減少 {0}%',
    sizeIncreased: '增加 {0}%',
    previewFailed: '預覽失敗',
    encoding: '編碼中',
    convertedFormat: '轉換後 · ',
    waitingResult: '等待實際編碼結果',
    currentImage: '目前圖片 · ',
    downloadFormat: '下載 ',
    hintFallback: '目前格式使用引擎縮圖預覽，100% 依預覽像素顯示。',
    hintPixel: '100% 依原圖像素顯示，縮小後的結果對齊放大。',
    hintBase: '拖曳分割線對比，拖曳畫面平移；Ctrl / ⌘ + 滾輪縮放。{0}修改設定後自動更新預覽。',
    previewUnavailable: '原圖預覽不可用，請嘗試重新轉換。',
    resultUnavailable: '結果預覽不可用，仍可下載轉換後的檔案。',
    fullscreenUnavailable: '全螢幕不可用，可繼續在工作台中縮放對比。',
  },
  guidePage: {
    breadcrumbHome: '首頁',
    breadcrumbGuide: '使用指南',
    title: '圖片轉檔使用指南',
    intro: 'PixelForge 在瀏覽器本機轉換圖片格式，批次調整畫質與尺寸。檔案內容絕不上傳伺服器。',
    updatedAt: '更新於',
    sec1Title: '如何轉換 HEIC、WebP 與其他圖片格式？',
    sec1Step1: '進入圖片轉檔工作台，選取、拖曳或貼上圖片。',
    sec1Step2: '選擇目標格式；破壞性壓縮可調整畫質。寬高為最大邊界，保持等比縮小。',
    sec1Step3: '檢視原圖與實際轉換結果的滑桿對比、解析度與檔案大小，再單張或打包 ZIP 下載。',
    sec1Formats: '支援 JPEG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、HEIC、QOI、TGA、PSD、JPEG 2000、EXR、SVG 共 16 種格式。',
    samplePageLink: '圖片範例頁面可直接試用轉檔與參數設定。',
    caption: '圖片格式與處理邊界',
    colType: '類型',
    colLimits: '支援方式與限制',
    rowHeic: 'HEIC 支援匯入與匯出，HEIF 僅支援匯入；HEIC 匯出會合成透明背景。',
    rowSvg: '匯入時轉為點陣圖；匯出時將影像描摹為向量路徑，上限 400 萬像素。',
    rowPsd: 'PSD 僅保留合成圖；僅處理靜態影像，不保留動畫影格。',
    rowSize: '單張最多 40 MB、4800 萬像素；ICO 最長邊 256px。',
    sec2Title: 'SVG 描摹與尺寸調整如何搭配？',
    sec2P1: 'SVG 匯出會先依指定尺寸縮小輸入影像，再以 Rust / WebAssembly 描摹路徑。',
    sec2P2: '彩色圖示、黑白線稿與相片描摹對應不同的描摹演算法。',
    sec3Title: '本機處理、離線與隱私保護',
    sec3P1: '圖片引擎載入後完全在本機執行。任務與結果自動儲存於瀏覽器，清除網站資料會移除這些副本。',
    sec3P2: '檔案內容與處理結果不發送至業務伺服器。統計資訊僅統計造訪與瀏覽器資訊，排除查詢參數與檔案內容。',
    backHome: '返回首頁',
    openWorkbench: '打開圖片轉檔工作台',
  },
};

export const enUS: ImageTranslations = {
  header: {
    brandAria: 'PixelForge Home',
    brandTag: 'Image',
    home: 'Home',
    convert: 'Convert',
    formats: 'Formats',
    guide: 'Guide',
    navAria: 'Main navigation',
  },
  home: {
    heroBadge: 'Multi-threaded WebAssembly engine · 100% in-browser memory · 16 formats supported',
    title: 'Image Format Converter',
    subtitle: 'Batch convert between WebP, AVIF, JPG, PNG, SVG and 16 formats locally in your browser. Real-time split comparison, smart vector tracing, and lossless optimization with zero server uploads.',
    startConvert: 'Start Converting',
    trySample: 'Try Sample',
    reconvertSample: 'Reconvert Sample',
    convertingSample: 'Converting Sample...',
    stripParallel: 'Multi-core Concurrency',
    stripPrivacy: 'Private Zero-Upload',
    stripVector: 'Vector Tracing & Lossless',
    samplePicAlt: 'Sample landscape with forest and lake',
    sampleResultAlt: 'Converted result of sample image',
    compareOriginal: 'Original · PNG 2.83 MB',
    sampleOriginal: 'Sample · 2172 × 724',
    compareResultPrefix: 'Result · ',
    clickTrySample: 'Click "Try Sample" for live preview',
    dragCompare: 'Drag slider to compare conversion',
    callingWasm: 'Calling WASM engine...',
    targetFormat: 'Target Format',
    quality: 'Quality',
    qualityHints: {
      fidelity: 'Max Fidelity',
      balanced: 'Recommended',
      standard: 'Standard',
      compact: 'Smallest File',
    },
    sizeLimit: 'Resize Limit',
    keepSize: 'Original dimensions',
    maxWidth1920: 'Max Width 1920px (Full HD)',
    maxWidth1280: 'Max Width 1280px (HD)',
    maxWidth640: 'Max Width 640px (Thumbnail)',
    enterWorkbench: 'Open Workbench with Settings',
    sampleTip: 'Sample image is for quick testing. Adjust format, quality, or dimensions, then click "Reconvert Sample" to review.',
    otherFormats: 'Supported Formats',
    allFormatsCount: 'Convert between 16 image formats',
    formatTip: 'HEIC and SVG support import and export; HEIF is import-only. SVG exports as vector paths; PSD reads flattened layer only.',
    batchGuideTitle: 'Batch Processing',
    batchGuideSubtitle: 'Client-side processing · Absolute privacy',
    cards: {
      zeroUploadTitle: 'Zero-Upload Execution',
      zeroUploadDesc: 'Add multiple images at once in the workbench. Configure output format, quality, and size constraints, then download individually or as a single ZIP archive.',
      standardBinaryTitle: 'Compliant Binary Output',
      standardBinaryDesc: 'Built with official WebAssembly image libraries to produce standard file streams, never superficial file extension changes.',
      persistenceTitle: 'Session Persistence',
      persistenceDesc: 'Supports files up to 40 MB and 48 megapixels. Tasks and results are preserved locally across browser tabs and reloads.',
    },
    openWorkbench: 'Open Image Workbench',
    footerSupported: '16 image formats supported',
  },
  formatTags: {
    SVG: 'Vector tracing',
    HEIC: 'Apple photo',
    GIF: 'Animation sequence',
    TIFF: 'Print publication',
    BMP: 'Bitmap',
    ICO: 'Favicon',
    JXL: 'Next-gen JPEG',
    QOI: 'Fast encoding',
    TGA: 'Texture channel',
    PSD: 'Flattened image',
    JP2: 'Wavelet compression',
    EXR: 'Industrial HDR',
  },
  app: {
    workbenchTitle: 'Image Converter Workbench',
    workbenchSummary: 'Batch import images to configure target format, quality, and maximum dimensions.',
    pillTemp: 'Temporary session · Download before closing',
    pillQueue: '{0} queued · {1} completed',
    pillOffline: 'Local encoding · No server upload',
    tempNoticeTitle: 'Temporary session: download files before closing',
    tempNoticeDesc: 'Images and results in this window are stored in memory and will not persist after reload.',
    saving: 'Saving...',
    updating: 'Updating...',
    reconvertAll: 'Reconvert all with current settings',
    retryFailed: 'Retry failed items',
    yourImages: 'Your Images',
    clear: 'Clear',
    addImages: 'Add Images',
    dropTitle: 'Drop images here',
    dropSubtitle: 'or browse from your device, multiple files supported',
    chooseImages: 'Choose Images',
    supportedFormatsHint: 'Supports JPG, PNG, WebP, AVIF, HEIC and more',
    maxSizePerFile: 'Max 40 MB per file',
    noImagesHint: 'No images ready?',
    trySampleAction: 'Try this sample',
    continueAdd: 'Add more or drop additional files',
    bottomLimit: 'Max 40 MB · 48 Megapixels per file',
    bottomClipboard: 'Paste from clipboard supported',
    statusNames: {
      waiting: 'Waiting',
      working: 'Converting',
      paused: 'Paused',
      interrupted: 'Interrupted',
      done: 'Done',
      error: 'Failed',
      cancelled: 'Cancelled',
    },
    settingsTitle: 'Conversion Settings',
    targetFormatLabel: 'Target Format',
    moreFormats: 'More formats',
    lessFormats: 'Less formats',
    icoNote: ' · Max edge 256px',
    heicNote: ' · 8-bit static image, strips metadata; large files take longer',
    svgPresetLabel: 'Vector Tracing Mode',
    svgPresets: {
      poster: 'Color Icons',
      bw: 'B&W Line Art',
      photo: 'Photo Tracing',
    },
    svgPresetHelp: 'Generates scalable vector paths. Photos are approximated into color regions; text is converted to curves. Max 4 MP.',
    imageQuality: 'Quality',
    losslessFixed: 'Lossless / Fixed',
    smallerSize: 'Smaller file',
    higherQuality: 'Higher quality',
    resizeTitle: 'Resize',
    keepAspect: 'Keep aspect ratio',
    maxWidth: 'Max width',
    maxHeight: 'Max height',
    origWidth: 'Original width',
    origHeight: 'Original height',
    resizeHelp: 'Leave blank to preserve original size. Downscales only.',
    stripMetadata: 'Strip Metadata',
    stripMetadataSub: 'Also strips ICC color profiles',
    bgFill: 'Background for transparency',
    svgBgHelp: 'Transparent areas composite over this background color.',
    convertAll: 'Convert All Images',
    reconvert: 'Reconvert',
    resume: 'Resume pending tasks',
    convertingProgress: 'Converting {0} of {1}',
    itemsCount: '{0} items',
    pause: 'Pause',
    cancelRemaining: 'Cancel remaining',
    stoppingHint: 'Stopping new tasks; awaiting current image completion',
    parallelHint: 'Processes up to {0} images concurrently; heavy files processed solo',
    resumeHint: 'Resumes with original task settings, preserving finished results',
    targetFormatHint: 'Target format: {0}',
    engineError: 'Engine failed to load',
    enginePreparing: 'Preparing engine...',
    reloadEngine: 'Reload Engine',
    doneBanner: '{0} images converted',
    savedPercent: 'Saved {0}%',
    largerWarning: 'Output size is larger with current settings',
    downloadZip: 'Download ZIP',
    staticOnlyTip: 'Processes static images only. HEIC/SVG support import & export; PSD reads flattened composite.',
    viewFormatSupport: 'View format support',
    engineOnline: 'Engine ready · {0} export formats',
    engineNeedsReload: 'Engine needs reload',
    formatSupportTitle: 'Format Support',
    userGuideTitle: 'User Guide',
    formatsIntro: 'Import and export capabilities are verified independently. SVG import is rasterized in-browser; export uses local WASM vector tracing.',
    formatHeaderCol: 'Format / Usage',
    importCol: 'Import',
    exportCol: 'Export',
    supported: 'Supported',
    notSupported: 'Not Supported',
    detecting: 'Detecting...',
    formatsFooterHelp: 'PDF and camera RAW files are not supported. SVG tracing limit is 4 MP; transparent areas merge into background color.',
    guideSteps: {
      step1Title: 'Import Images',
      step1Desc: 'Choose files, drag and drop, or paste directly from clipboard. Limit 40 MB and 48 MP per image.',
      step2Title: 'Configure Format & Settings',
      step2Desc: 'Select target format and quality. Dimensions define maximum bounding box and scale proportionally down.',
      step3Title: 'Compare & Download',
      step3Desc: 'Drag the split handle to inspect quality and file size. Download individually or batch-download as ZIP.',
    },
    guideSessionNotice: 'Temporary session: images and results will not be saved after closing or refreshing this tab.',
    guidePersistentNotice: 'Images and conversion outputs are saved locally on this machine so you can resume anytime.',
    dragOverlayTitle: 'Drop images to add',
    dragOverlaySub: 'Multiple files supported',
  },
  compare: {
    title: 'Before & After Comparison',
    zoomGroup: 'Comparison Zoom',
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    zoomRatio: 'Zoom Level',
    fit: 'Fit',
    enterFullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    originalAlt: 'Original image before conversion',
    resultAlt: 'Actual converted result',
    previewIncomplete: 'Preview pending',
    generatingPreview: 'Generating preview...',
    originalTag: 'Original · ',
    convertedTag: ' · Converted',
    dragSliderAria: 'Drag to compare before and after image',
    originalValText: 'Original {0}%, Converted {1}%',
    readingDimensions: 'Reading dimensions...',
    sizeReduced: 'Reduced {0}%',
    sizeIncreased: 'Increased {0}%',
    previewFailed: 'Preview failed',
    encoding: 'Encoding...',
    convertedFormat: 'Converted · ',
    waitingResult: 'Waiting for encoded output',
    currentImage: 'Active file · ',
    downloadFormat: 'Download ',
    hintFallback: 'Showing thumbnail preview generated by conversion engine.',
    hintPixel: '1:1 pixel rendering relative to original image.',
    hintBase: 'Drag slider to compare, pan image by dragging. Ctrl / ⌘ + scroll to zoom. {0}Updates automatically when settings change.',
    previewUnavailable: 'Original preview unavailable, please retry conversion.',
    resultUnavailable: 'Result preview unavailable, file can still be downloaded.',
    fullscreenUnavailable: 'Fullscreen unavailable, you can still zoom in workbench.',
  },
  guidePage: {
    breadcrumbHome: 'Home',
    breadcrumbGuide: 'Guide',
    title: 'Image Conversion Guide',
    intro: 'PixelForge converts image formats and adjusts quality/dimensions right in your browser. Files never touch a remote server.',
    updatedAt: 'Updated on',
    sec1Title: 'How to convert HEIC, WebP, and other formats?',
    sec1Step1: 'Open the conversion workbench, select, drag, or paste your images.',
    sec1Step2: 'Select target format and adjust lossy quality. Width and height constrain maximum bounds proportionally.',
    sec1Step3: 'Inspect before/after quality with the comparison slider, then download individually or as a ZIP archive.',
    sec1Formats: 'Supports 16 export formats: JPEG, PNG, WebP, AVIF, GIF, TIFF, BMP, ICO, JPEG XL, HEIC, QOI, TGA, PSD, JPEG 2000, EXR, and SVG.',
    samplePageLink: 'Try live settings on the image sample page.',
    caption: 'Image formats and operating boundaries',
    colType: 'Category',
    colLimits: 'Support details & constraints',
    rowHeic: 'HEIC supports import and export; HEIF is import-only. Transparent background is composited on export.',
    rowSvg: 'SVG rasterizes on import; exports as vector paths with a maximum 4 MP limit.',
    rowPsd: 'PSD reads flattened composite image only; animation frames and HDR fidelity are not preserved.',
    rowSize: 'Max 40 MB and 48 MP per file; ICO max edge 256px. Output file size may vary based on format characteristics.',
    sec2Title: 'How do SVG vector tracing and resizing work together?',
    sec2P1: 'Exporting to SVG scales the image down to chosen bounds first, then vectorizes using Rust / WebAssembly.',
    sec2P2: 'Color Icons, B&W Line Art, and Photo Tracing offer distinct tracing algorithms tailored to graphic types.',
    sec3Title: 'Local Execution, Offline Use & Privacy',
    sec3P1: 'The conversion engine runs entirely on your device. Tasks and parameters are saved in local browser storage.',
    sec3P2: 'No file contents or images are ever transmitted to external servers.',
    backHome: 'Back to Home',
    openWorkbench: 'Open Image Workbench',
  },
};

export const jaJP: ImageTranslations = {
  header: {
    brandAria: 'PixelForge ホーム',
    brandTag: '画像',
    home: 'ホーム',
    convert: '画像変換',
    formats: '対応形式',
    guide: 'ガイド',
    navAria: 'メインナビゲーション',
  },
  home: {
    heroBadge: 'マルチスレッド WebAssembly エンジン · ブラウザ内ローカル処理 · 16形式の相互変換',
    title: '画像フォーマット変換',
    subtitle: 'WebP、AVIF、JPG、PNG、SVG など16種類の画像フォーマットをブラウザ内で高速一括変換。リアルタイムのスライダー画質比較、ベクター自動トレース、可逆圧縮に対応し、ファイルは外部へ送信されません。',
    startConvert: '変換を開始',
    trySample: 'サンプルを試す',
    reconvertSample: 'サンプルを再変換',
    convertingSample: 'サンプルを変換中…',
    stripParallel: 'マルチコア並列処理',
    stripPrivacy: '完全ローカルで安全',
    stripVector: 'ベクタートレース・最適化',
    samplePicAlt: '山と湖のサンプル画像',
    sampleResultAlt: 'サンプル画像の変換結果',
    compareOriginal: '元画像 · PNG 2.83 MB',
    sampleOriginal: 'サンプル画像 · 2172 × 724',
    compareResultPrefix: '変換結果 · ',
    clickTrySample: '「サンプルを試す」で結果を確認',
    dragCompare: 'スライダーを動かして画質を比較',
    callingWasm: 'WASMエンジンで変換中…',
    targetFormat: '出力形式',
    quality: '画質',
    qualityHints: {
      fidelity: '最高画質',
      balanced: 'おすすめ (高バランス)',
      standard: '標準圧縮',
      compact: '最小サイズ',
    },
    sizeLimit: 'サイズ調整',
    keepSize: '元のサイズを維持',
    maxWidth1920: '最大幅 1920px (フルHD)',
    maxWidth1280: '最大幅 1280px (HD)',
    maxWidth640: '最大幅 640px (サムネイル)',
    enterWorkbench: 'この設定でワークベンチを開く',
    sampleTip: 'サンプル画像で変換結果を確認できます。形式やサイズ変更後、「サンプルを再変換」を押してください。',
    otherFormats: 'その他の対応形式',
    allFormatsCount: '全16種類の形式に対応',
    formatTip: 'HEIC・SVGは入出力両対応、HEIFは入力のみ対応。SVG出力はベクタートレース、PSDは統合画像のみ読み込みます。',
    batchGuideTitle: '一括処理について',
    batchGuideSubtitle: 'ブラウザ内完結アーキテクチャ · ファイルを安全に保護',
    cards: {
      zeroUploadTitle: '完全クライアントサイド実行 (アップロードなし)',
      zeroUploadDesc: 'ワークベンチで複数の画像を一度に追加し、フォーマットや品質を一括指定。変換後は個別またはZIPで一括保存できます。',
      standardBinaryTitle: '標準バイナリエンコード',
      standardBinaryDesc: 'WebAssemblyで正式ビルドされた画像処理ライブラリを使用し、標準に準拠したバイナリを出力します。',
      persistenceTitle: 'ローカル保存とオフライン対応',
      persistenceDesc: '1画像あたり最大40MB・4800万画素まで対応。作業中のタスクはブラウザに自動保存されます。',
    },
    openWorkbench: '画像ワークベンチを開く',
    footerSupported: '16種類の画像形式に対応',
  },
  formatTags: {
    SVG: 'ベクタートレース',
    HEIC: 'Apple撮影写真',
    GIF: 'アニメーション',
    TIFF: '印刷・出版用',
    BMP: 'ビットマップ',
    ICO: 'ファビコン',
    JXL: '次世代 JPEG',
    QOI: '超高速コーデック',
    TGA: 'テクスチャ',
    PSD: '統合レイヤー',
    JP2: 'ウェーブレット圧縮',
    EXR: 'HDR画像',
  },
  app: {
    workbenchTitle: '画像変換ワークベンチ',
    workbenchSummary: '画像をまとめてインポートし、フォーマット・画質・サイズを一括設定。',
    pillTemp: '一時セッション · 閉じる前にダウンロードしてください',
    pillQueue: '待機中 {0} 枚 · 完了 {1} 枚',
    pillOffline: 'ローカル処理 · アップロードなし',
    tempNoticeTitle: 'このウィンドウは一時セッションです',
    tempNoticeDesc: 'ウィンドウを閉じたり再読み込みすると作業中のデータが破棄されます。事前にダウンロードしてください。',
    saving: '保存中…',
    updating: '更新中…',
    reconvertAll: '現在の設定ですべて再変換',
    retryFailed: '失敗した項目を再試行',
    yourImages: '追加した画像',
    clear: 'クリア',
    addImages: '画像を追加',
    dropTitle: 'ここに画像をドロップ',
    dropSubtitle: 'またはファイルを選択（複数選択対応）',
    chooseImages: '画像を選択',
    supportedFormatsHint: 'JPG, PNG, WebP, AVIF, HEIC 形式などに対応',
    maxSizePerFile: '1ファイル最大 40 MB',
    noImagesHint: '手元に画像がありませんか？',
    trySampleAction: 'サンプル画像を試す',
    continueAdd: 'さらに画像を追加、またはドロップ',
    bottomLimit: '1ファイル最大 40 MB · 4800万画素',
    bottomClipboard: 'クリップボード貼り付けに対応',
    statusNames: {
      waiting: '待機中',
      working: '変換中',
      paused: '一時停止',
      interrupted: '中断',
      done: '完了',
      error: '失敗',
      cancelled: 'キャンセル',
    },
    settingsTitle: '変換設定',
    targetFormatLabel: '出力形式',
    moreFormats: 'さらに表示',
    lessFormats: '折りたたむ',
    icoNote: ' · 最大辺 256px',
    heicNote: ' · 8bit静止画、メタデータ自動削除。大サイズ画像は処理に時間がかかります',
    svgPresetLabel: 'ベクタートレース方式',
    svgPresets: {
      poster: 'カラーアイコン',
      bw: '白黒線画',
      photo: '写真トレース',
    },
    svgPresetHelp: 'スケーラブルなベクターパスを生成します。写真は近似トレース、文字はアウトライン化されます。最大400万画素。',
    imageQuality: '画質',
    losslessFixed: '可逆 / 固定',
    smallerSize: 'ファイル軽量化',
    higherQuality: '高画質',
    resizeTitle: 'リサイズ',
    keepAspect: '縦横比を維持',
    maxWidth: '最大幅',
    maxHeight: '最大高さ',
    origWidth: '元の幅',
    origHeight: '元の高さ',
    resizeHelp: '空欄で元のサイズを維持（縮小のみ対応）',
    stripMetadata: 'メタデータ削除',
    stripMetadataSub: 'ICCプロファイルも削除されます',
    bgFill: '透過背景の塗りつぶし色',
    svgBgHelp: '透過部分は選択した背景色に合成されます。',
    convertAll: 'すべての画像を変換',
    reconvert: '再変換',
    resume: '中断タスクを再開',
    convertingProgress: '変換中 {0} / {1}',
    itemsCount: '{0} 枚',
    pause: '一時停止',
    cancelRemaining: '残りをキャンセル',
    stoppingHint: '処理を停止中…実行中の画像が完了するまでお待ちください',
    parallelHint: '最大 {0} 枚を同時処理（大容量画像は個別処理）',
    resumeHint: '元の設定を保持して完了済み以外の画像を変換します',
    targetFormatHint: '出力形式: {0}',
    engineError: 'エンジンの読み込みに失敗しました',
    enginePreparing: '変換エンジンを準備中…',
    reloadEngine: 'エンジンを再読み込み',
    doneBanner: '{0} 枚の画像が変換完了',
    savedPercent: '{0}% 削減',
    largerWarning: '現在の設定ではファイルサイズが増加します',
    downloadZip: 'ZIP ダウンロード',
    staticOnlyTip: '静止画のみ対応。HEIC/SVGは入出力両対応、PSDは統合画像のみ。',
    viewFormatSupport: '対応形式一覧',
    engineOnline: 'エンジン準備完了 · {0} 形式対応',
    engineNeedsReload: '再読み込みが必要',
    formatSupportTitle: '対応形式',
    userGuideTitle: 'ご利用ガイド',
    formatsIntro: '入出力機能はそれぞれ検出されます。SVG入力はブラウザでラスタライズ、出力はローカルWASMでトレースされます。',
    formatHeaderCol: '形式 / 用途',
    importCol: '入力',
    exportCol: '出力',
    supported: '対応',
    notSupported: '非対応',
    detecting: '検出中…',
    formatsFooterHelp: 'PDFおよびカメラRAWには非対応です。SVGトレースの上限は400万画素です。',
    guideSteps: {
      step1Title: '画像をインポート',
      step1Desc: '画像ファイルを選択、ドロップ、またはクリップボードから貼り付けます（1枚あたり最大40MB）。',
      step2Title: '形式とパラメータを指定',
      step2Desc: '出力形式や圧縮品質を選択します。幅と高さは比率を維持して縮小されます。',
      step3Title: '比較確認してダウンロード',
      step3Desc: 'スライダーで変換前後の画質や容量を比較し、個別保存またはZIPで一括保存します。',
    },
    guideSessionNotice: 'このウィンドウは一時セッションです。閉じる前に変換結果を保存してください。',
    guidePersistentNotice: '画像と変換データはお使いの端末に保存され、再読み込み後も引き継がれます。',
    dragOverlayTitle: 'ドロップして画像を追加',
    dragOverlaySub: '複数ファイルの一括追加に対応',
  },
  compare: {
    title: '変換前後の画質比較',
    zoomGroup: '表示倍率',
    zoomOut: '縮小',
    zoomIn: '拡大',
    zoomRatio: '倍率',
    fit: '全体表示',
    enterFullscreen: '全画面表示',
    exitFullscreen: '全画面解除',
    originalAlt: '変換前の元画像',
    resultAlt: '変換後の画像',
    previewIncomplete: 'プレビュー未完了',
    generatingPreview: 'プレビューを生成中…',
    originalTag: '元画像 · ',
    convertedTag: ' · 変換後',
    dragSliderAria: 'スライダーを動かして比較',
    originalValText: '元画像 {0}%、変換後 {1}%',
    readingDimensions: 'サイズを読み込み中…',
    sizeReduced: '{0}% 減少',
    sizeIncreased: '{0}% 増加',
    previewFailed: 'プレビュー生成失敗',
    encoding: 'エンコード中…',
    convertedFormat: '変換後 · ',
    waitingResult: '出力結果を待機中…',
    currentImage: '選択中の画像 · ',
    downloadFormat: 'ダウンロード ',
    hintFallback: '現在形式はエンジンによるサムネイルプレビューを表示しています。',
    hintPixel: '元画像ピクセル基準の100%表示です。',
    hintBase: 'スライダーで比較、ドラッグで移動、Ctrl / ⌘ + ホイールで拡大縮小。{0}設定変更時にプレビューが自動更新されます。',
    previewUnavailable: '元画像のプレビューを取得できませんでした。',
    resultUnavailable: '結果のプレビューは非対応ですが、ファイルの保存は可能です。',
    fullscreenUnavailable: '全画面表示に対応していません。',
  },
  guidePage: {
    breadcrumbHome: 'ホーム',
    breadcrumbGuide: 'ガイド',
    title: '画像変換ご利用ガイド',
    intro: 'PixelForge はブラウザ内で画像フォーマットの変換、画質やサイズの調整を高速に行います。ファイルが外部へ送信されることはありません。',
    updatedAt: '更新日',
    sec1Title: 'HEIC や WebP などの画像形式を変換するには？',
    sec1Step1: '画像変換ワークベンチを開き、画像を選択、ドロップ、または貼り付けます。',
    sec1Step2: '目的の形式を選択し、必要に応じて画質を設定します。サイズ指定時は縦横比を維持して縮小されます。',
    sec1Step3: 'スライダーで画質とファイルサイズを比較確認し、個別またはZIPでダウンロードします。',
    sec1Formats: 'JPEG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、HEIC、QOI、TGA、PSD、JPEG 2000、EXR、SVG の全16形式の出力に対応。',
    samplePageLink: '画像サンプルページですぐに変換設定をお試しいただけます。',
    caption: '画像形式と処理制限',
    colType: '形式区分',
    colLimits: '仕様および対応制限',
    rowHeic: 'HEICは入出力両対応、HEIFは入力のみ。HEIC出力時は透過背景が合成されます。',
    rowSvg: 'SVG入力時はビットマップ変換、出力時は最大400万画素のベクタートレースが行われます。',
    rowPsd: 'PSDは統合画像のみ読み込み可能で、アニメーションフレームは保持されません。',
    rowSize: '1画像あたり最大40MB・4800万画素、ICOの最大辺は256pxです。',
    sec2Title: 'SVG トレースとサイズ指定の仕組みについて',
    sec2P1: 'SVG出力時は、まず指定サイズに合わせて縮小された後にRust / WebAssemblyによってパス化されます。',
    sec2P2: 'カラーアイコン、白黒線画、写真トレースなど、画像の特性に応じたトレース手法を選択可能です。',
    sec3Title: 'ローカル処理・オフライン対応・プライバシー保護',
    sec3P1: '画像変換エンジンは読み込み後、すべて端末上で動作します。タスク情報はブラウザ内に保存されます。',
    sec3P2: 'ファイル内容や変換データがサーバーへ送信されることは一切ありません。',
    backHome: 'ホームへ戻る',
    openWorkbench: '画像変換ワークベンチを開く',
  },
};

export const koKR: ImageTranslations = {
  ...enUS,
  header: {
    brandAria: 'PixelForge 홈',
    brandTag: '이미지',
    home: '홈',
    convert: '이미지 변환',
    formats: '지원 포맷',
    guide: '이용 안내',
    navAria: '메인 내비게이션',
  },
  home: {
    ...enUS.home,
    heroBadge: '멀티스레드 WebAssembly 엔진 · 브라우저 메모리 100% 로컬 실행 · 16개 포맷 상호 변환',
    title: '이미지 포맷 변환',
    subtitle: 'WebP, AVIF, JPG, PNG, SVG 등 16가지 이미지 포맷을 브라우저에서 안전하고 빠르게 일괄 변환합니다. 슬라이더 화질 비교, 벡터 트레이싱, 무손실 압축을 지원하며 파일이 서버로 업로드되지 않습니다.',
    startConvert: '변환 시작하기',
    trySample: '샘플 체험하기',
    reconvertSample: '샘플 다시 변환',
    convertingSample: '샘플 변환 중…',
    stripParallel: '멀티코어 병렬 처리',
    stripPrivacy: '100% 로컬 무업로드',
    stripVector: '벡터 트레이싱 및 최적화',
    targetFormat: '대상 포맷',
    quality: '품질',
    sizeLimit: '크기 조절',
    keepSize: '원본 크기 유지',
    enterWorkbench: '이 설정으로 워크벤치 열기',
    openWorkbench: '이미지 변환 작업 공간 열기',
    footerSupported: '16개 이미지 포맷 지원',
  },
  app: {
    ...enUS.app,
    workbenchTitle: '이미지 변환 작업 공간',
    workbenchSummary: '여러 이미지를 불러와 대상 포맷, 인코딩 품질, 최대 크기를 일괄 설정합니다.',
    pillTemp: '임시 작업 공간 · 닫기 전에 다운로드하세요',
    pillQueue: '대기 중 {0}장 · 완료 {1}장',
    pillOffline: '로컬 인코딩 · 서버 업로드 없음',
    yourImages: '내 이미지',
    clear: '비우기',
    addImages: '이미지 추가',
    dropTitle: '여기에 이미지를 드래그하세요',
    dropSubtitle: '또는 기기에서 파일 선택 (다중 선택 가능)',
    chooseImages: '이미지 선택',
    supportedFormatsHint: 'JPG, PNG, WebP, AVIF, HEIC 등 지원',
    maxSizePerFile: '파일당 최대 40 MB',
    noImagesHint: '사용할 이미지가 없으신가요?',
    trySampleAction: '이 샘플로 테스트해보기',
    convertAll: '모든 이미지 변환',
    reconvert: '다시 변환',
    downloadZip: 'ZIP 다운로드',
    settingsTitle: '변환 설정',
    targetFormatLabel: '대상 포맷',
    imageQuality: '품질',
    resizeTitle: '크기 조절',
    stripMetadata: '메타데이터 제거',
  },
};

export const esES: ImageTranslations = {
  ...enUS,
  header: {
    brandAria: 'Inicio de PixelForge',
    brandTag: 'Imagen',
    home: 'Inicio',
    convert: 'Convertir',
    formats: 'Formatos',
    guide: 'Guía',
    navAria: 'Navegación principal',
  },
  home: {
    ...enUS.home,
    heroBadge: 'Motor WebAssembly multihilo · 100% local en tu navegador · Conversión entre 16 formatos',
    title: 'Conversor de imágenes',
    subtitle: 'Convierte por lotes imágenes en formato WebP, AVIF, JPG, PNG, SVG y 16 formatos más en tu navegador. Comparación visual en tiempo real, vectorización inteligente y compresión sin pérdida sin subir archivos a la nube.',
    startConvert: 'Comenzar a convertir',
    trySample: 'Probar ejemplo',
    reconvertSample: 'Reconvertir ejemplo',
    convertingSample: 'Convirtiendo ejemplo...',
    stripParallel: 'Procesamiento multinúcleo',
    stripPrivacy: 'Privacidad total sin subidas',
    stripVector: 'Vectorizado y optimización',
    targetFormat: 'Formato de salida',
    quality: 'Calidad',
    sizeLimit: 'Redimensionar',
    keepSize: 'Mantener tamaño original',
    enterWorkbench: 'Abrir mesa de trabajo',
    openWorkbench: 'Abrir convertidor',
    footerSupported: 'Compatible con 16 formatos',
  },
  app: {
    ...enUS.app,
    workbenchTitle: 'Mesa de trabajo de conversión',
    workbenchSummary: 'Importa imágenes por lotes para definir formato, calidad y dimensiones.',
    pillTemp: 'Sesión temporal · Descarga antes de cerrar',
    pillQueue: '{0} en cola · {1} listas',
    pillOffline: 'Procesamiento local · Sin subidas',
    yourImages: 'Tus imágenes',
    clear: 'Vaciar',
    addImages: 'Añadir imágenes',
    dropTitle: 'Arrastra imágenes aquí',
    dropSubtitle: 'o selecciónalas desde tu equipo',
    chooseImages: 'Seleccionar imágenes',
    convertAll: 'Convertir todas las imágenes',
    reconvert: 'Reconvertir',
    downloadZip: 'Descargar ZIP',
    settingsTitle: 'Ajustes de conversión',
    targetFormatLabel: 'Formato de salida',
    imageQuality: 'Calidad',
    resizeTitle: 'Dimensiones',
    stripMetadata: 'Eliminar metadatos',
  },
};

export const deDE: ImageTranslations = {
  ...enUS,
  header: {
    brandAria: 'PixelForge Startseite',
    brandTag: 'Bild',
    home: 'Startseite',
    convert: 'Konvertieren',
    formats: 'Formate',
    guide: 'Anleitung',
    navAria: 'Hauptnavigation',
  },
  home: {
    ...enUS.home,
    heroBadge: 'Multithread-WebAssembly-Engine · 100% lokal im Browserspeicher · 16 Formate',
    title: 'Bildkonverter',
    subtitle: 'Konvertieren Sie WebP, AVIF, JPG, PNG, SVG und 16 Bildformate blitzschnell im Stapel direkt im Browser. Visueller Schieberegler-Vergleich, Vektorisierung und verlustfreie Optimierung – ganz ohne Server-Upload.',
    startConvert: 'Jetzt konvertieren',
    trySample: 'Beispiel testen',
    reconvertSample: 'Beispiel neu konvertieren',
    convertingSample: 'Konvertiere Beispiel...',
    stripParallel: 'Multicore-Parallelität',
    stripPrivacy: 'Privat ohne Upload',
    stripVector: 'Vektorisierung & Optimierung',
    targetFormat: 'Zielformat',
    quality: 'Qualität',
    sizeLimit: 'Größe anpassen',
    keepSize: 'Originalgröße beibehalten',
    enterWorkbench: 'Im Arbeitsbereich öffnen',
    openWorkbench: 'Arbeitsbereich öffnen',
    footerSupported: '16 Bildformate unterstützt',
  },
  app: {
    ...enUS.app,
    workbenchTitle: 'Bildkonverter-Arbeitsbereich',
    workbenchSummary: 'Importieren Sie mehrere Bilder und passen Sie Zielformat, Qualität und Abmessungen gebündelt an.',
    pillTemp: 'Temporäre Sitzung · Vor dem Schließen speichern',
    pillQueue: '{0} in Warteschlange · {1} fertig',
    pillOffline: 'Lokale Codierung · Kein Upload',
    yourImages: 'Ihre Bilder',
    clear: 'Leeren',
    addImages: 'Bilder hinzufügen',
    dropTitle: 'Bilder hierher ziehen',
    dropSubtitle: 'oder Dateien vom Gerät auswählen',
    chooseImages: 'Bilder auswählen',
    convertAll: 'Alle Bilder konvertieren',
    reconvert: 'Erneut konvertieren',
    downloadZip: 'ZIP herunterladen',
    settingsTitle: 'Konvertierungseinstellungen',
    targetFormatLabel: 'Zielformat',
    imageQuality: 'Bildqualität',
    resizeTitle: 'Größe ändern',
    stripMetadata: 'Metadaten entfernen',
  },
};

export const frFR: ImageTranslations = {
  ...enUS,
  header: {
    brandAria: 'Accueil PixelForge',
    brandTag: 'Image',
    home: 'Accueil',
    convert: 'Convertir',
    formats: 'Formats',
    guide: 'Guide',
    navAria: 'Navigation principale',
  },
  home: {
    ...enUS.home,
    heroBadge: 'Moteur WebAssembly multithread · 100% local en mémoire · 16 formats pris en charge',
    title: "Convertisseur d'images",
    subtitle: 'Convertissez par lots vos images WebP, AVIF, JPG, PNG, SVG et 16 autres formats directement dans votre navigateur. Comparaison par curseur en temps réel, vectorisation intelligente et optimisation sans perte ni téléversement.',
    startConvert: 'Lancer la conversion',
    trySample: "Tester l'exemple",
    reconvertSample: "Reconvertir l'exemple",
    convertingSample: 'Conversion en cours...',
    stripParallel: 'Traitement multicoeur',
    stripPrivacy: 'Confidentialité totale sans upload',
    stripVector: 'Vectorisation et optimisation',
    targetFormat: 'Format cible',
    quality: 'Qualité',
    sizeLimit: 'Redimensionner',
    keepSize: 'Garder la taille originale',
    enterWorkbench: "Ouvrir l'atelier avec ces réglages",
    openWorkbench: "Ouvrir l'atelier de conversion",
    footerSupported: '16 formats pris en charge',
  },
  app: {
    ...enUS.app,
    workbenchTitle: 'Atelier de conversion',
    workbenchSummary: 'Importez plusieurs images et configurez le format, la qualité et les dimensions.',
    pillTemp: 'Session temporaire · Téléchargez avant de fermer',
    pillQueue: '{0} en attente · {1} terminées',
    pillOffline: 'Traitement local · Aucun envoi sur serveur',
    yourImages: 'Vos images',
    clear: 'Vider',
    addImages: 'Ajouter des images',
    dropTitle: 'Déposez les images ici',
    dropSubtitle: 'ou parcourez votre appareil (fichiers multiples acceptés)',
    chooseImages: 'Sélectionner des images',
    convertAll: 'Convertir toutes les images',
    reconvert: 'Reconvertir',
    downloadZip: 'Télécharger le ZIP',
    settingsTitle: 'Paramètres de conversion',
    targetFormatLabel: 'Format cible',
    imageQuality: 'Qualité',
    resizeTitle: 'Dimensions',
    stripMetadata: 'Supprimer les métadonnées',
  },
};

const dictionaries: Record<Locale, ImageTranslations> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'es-ES': esES,
  'de-DE': deDE,
  'fr-FR': frFR,
};

export function useImageI18n() {
  const { locale, setLocale, locales } = useLocale();
  const t = dictionaries[locale] || dictionaries['en-US'];
  return { locale, setLocale, locales, t };
}
