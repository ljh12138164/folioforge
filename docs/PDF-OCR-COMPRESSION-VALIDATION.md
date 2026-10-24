# PDF OCR 与压缩：可行性验证

历史记录说明：本文记录前一轮“先验证方案”的调查和实验，以下“未接入 / 未运行”描述对应当时状态。用户随后要求“全部实现”，现已接入中英文 OCR 与压缩；最新能力、实际浏览器验收及限制见 [实现交付](PDF-OCR-COMPRESSION.md)。历史实验数据保持原样。

调研及实测日期：2026-10-24。范围对应 [工具调研](TOOL-SITE-RESEARCH.md) 中的两个后续探索项。本次交付是技术路径、资源与许可核查，以及独立压缩实验；**没有为产品接入 OCR 或完整压缩引擎**，没有新增依赖、模型或服务端。

结论：浏览器离线中文 OCR 有可行路径，宜先验证图片/扫描页转 TXT；可搜索 PDF 是下一项独立验收。现有栈可以做明确标注损失的“扫描件降采样”，不能据此推出通用、保留结构的压缩。pdf-lib 重存已有紧凑文件，在本次夹具上没有节省字节；将矢量文档栅格化反而放大约 230 倍并丢失全部可提取文字。

## 证据口径与现有基础

- **官方事实**：下文链接仅指向维护者仓库、规范或厂商文档；代码以核查日读取版本为准。Tesseract.js 当前仓库及发布页为 v7.0.0；文档中的 v5 例子不能当作 v7 完整资产表。[包版本](https://github.com/naptha/tesseract.js/blob/master/package.json)、[发布说明](https://github.com/naptha/tesseract.js/releases/tag/v7.0.0)
- **仓库事实**：`apps/web/package.json` 已有 pdf-lib 1.17.1、PDF.js 6.4.299、Playwright；`src/pdf/worker.ts` 写入 PDF，`renderer.ts` 已能渲染与提取文字，当前渲染有 4096 边长/1200 万像素上限。`core.ts` 限单文件 40 MiB、任务 100 MiB、200 页；这些导入限制不是 OCR 安全负载的测量结论。
- **实测**：第 4 节数据来自新增独立脚本和合成夹具，不是竞品测试、OCR 准确率或真实用户文件统计。
- **工程判断/待验收**：缓存协议、首版范围与门槛是本项目建议；未执行中文识别、手机性能、OCR 离线冷启动或任意 PDF 结构保真测试。

## 1. 离线中文 OCR 的最小路径

PDF.js 将选定页按明确像素上限渲染到白底 Canvas → 一个 Tesseract.js Worker 顺序识别 → 按页展示、校正、复制及下载 UTF-8 TXT。Tesseract.js 接受图片，**不直接接受 PDF**；PDF.js 的 `getTextContent()` 仅提取已有文字层。应先用现有提取功能，扫描页才交给 OCR。[Tesseract.js 项目范围](https://github.com/naptha/tesseract.js#project-scope)、[PDF.js 页面接口](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html)

**自托管资源必须覆盖完整加载链**：主 API bundle、`worker.min.js`、版本匹配的 core JS/WASM、所选语言数据。显式指定同源 `workerPath`、目录形式的 `corePath`、`langPath`；不要依赖默认 CDN。上游 loader 按设备选择普通、SIMD、relaxed-SIMD，且区分 LSTM-only/Legacy，因此 v7 完整目录有六组 `.wasm.js` 与对应 `.wasm`。仅 LSTM 的资源裁剪也要以锁定版本的实际请求清单验证，不能只照旧文档复制四个文件。[实际 core loader](https://github.com/naptha/tesseract.js/blob/master/src/worker-script/browser/getCore.js)、[core 发行文件表](https://github.com/naptha/tesseract.js-core/blob/master/package.json)

安装时要把 JS 与 core 作为一组锁定：v7.0.0 的正式包声明 core `^7.0.0`；本次查询 npm registry 时 core 的 `latest` 标签仍是 6.1.2，但 7.0.0 版本已存在，不能独立取两个包的 `latest` 来拼资源。[v7 正式包依赖](https://github.com/naptha/tesseract.js/blob/v7.0.0/package.json)、[core registry 元数据](https://registry.npmjs.org/tesseract.js-core)

可评估如下配置；这是**未执行的候选配置**，不是已完成的 OCR 原型：

```js
const worker = await createWorker(['chi_sim', 'eng'], 1, {
  workerPath: '/ocr-assets/v7/worker.min.js',
  corePath: '/ocr-assets/v7/core',
  langPath: '/ocr-assets/tessdata-fast/<固定版本>',
  gzip: false, // 对应直接托管的 .traineddata；若托管 .gz 则改为 true
  cachePath: 'pixelforge-ocr-fast-<固定版本>',
});
const { data } = await worker.recognize(canvas, {}, { text: true });
await worker.terminate();
```

`chi_sim` 是简体中文，繁体需要另外评估 `chi_tra`；fast 数据仅支持 LSTM，匹配 OEM=1。默认 Tesseract.js 下载的是 `4.0.0_best_int`，不是这里建议对比的官方 `tessdata_fast`。不能把不同系列的体积、速度、准确率混用。[官方语言数据说明](https://tesseract-ocr.github.io/tessdoc/Data-Files)、[fast 说明](https://github.com/tesseract-ocr/tessdata_fast)、[默认下载实现](https://github.com/naptha/tesseract.js/blob/master/src/worker-script/index.js)

### 语言与代码体积

以下是 2026-10-24 对官方文件执行 **HEAD，`Accept-Encoding: identity`** 得到的 `Content-Length`，均为 HTTP 200，未下载模型正文。它们是资源大小测量，**不是 OCR 内存、实际 gzip 下载量或完整安装体积**。

| 资源 | 字节 | 约 MiB | 来源 |
| --- | ---: | ---: | --- |
| fast 简体中文 `chi_sim.traineddata` | 2,469,156 | 2.35 | [官方文件](https://github.com/tesseract-ocr/tessdata_fast/blob/main/chi_sim.traineddata) |
| fast 英文 `eng.traineddata` | 4,113,088 | 3.92 | [官方文件](https://github.com/tesseract-ocr/tessdata_fast/blob/main/eng.traineddata) |
| v7 relaxed-SIMD LSTM core WASM（一个分支） | 2,862,266 | 2.73 | [发行文件](https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-relaxedsimd-lstm.wasm) |

中英 fast 数据合计 6,582,244 字节，另加实际选用的 core、loader、Worker/API 和许可文件；为多设备准备的离线资产可能含多个 core，不能把单个 WASM 数字说成总包体积。固定版本时应记录 SHA-256 和实际压缩传输字节，再决定按语言下载；fast 质量是否满足中文小字、印章、表格，仍须标注真值的样本实验。[官方性能指南](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)

### 本地缓存与离线状态

Tesseract.js 在浏览器用 IndexedDB 缓存解压后的语言数据，默认 `cacheMethod: 'write'` 会读写缓存；`cachePath` 在浏览器是缓存键的一部分。缓存仅按语言名容易混用新旧模型，建议用带引擎/模型版本的 key。不要为常规使用设置 `none` 或 `refresh`。[API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md)、[读写缓存实现](https://github.com/naptha/tesseract.js/blob/master/src/worker-script/index.js)

当前 `build-pdf-offline.mjs` 只枚举 `_next/static`、`pdf-assets` 与 PDF 页面；新增 `ocr-assets` 不会自动获得离线保证。建议独立按需缓存 OCR 包，成功拉取所有必需资源后才显示“中英 OCR 离线就绪”。语言缓存不覆盖 Worker、JS 和 WASM，必须同时覆盖两层；升级、写入失败、配额不足或用户清站点数据后应重新检测。浏览器可能回收 best-effort 存储，缓存不是永久安装承诺。[WebKit 官方存储策略](https://webkit.org/blog/14403/updates-to-storage-policy/)

验收应区分：从未联网且无资源时明确提示先下载；首次下载完成后关闭页面、离线冷启动、第一次点击 OCR，验证只有已缓存的同源资源请求，仍能识别。再测试损坏语言缓存、缺一个 WASM 分支、版本升级与下载取消；不能把应用页面离线可打开当作 OCR 已可离线。

### TXT 与可搜索 PDF 的差别

默认输出是 `text`，需要时可显式请求 blocks/hOCR/TSV 的布局信息。TXT 不需要额外 PDF 字体，也不承诺还原标题、表格、竖排与阅读顺序。[默认输出](https://github.com/naptha/tesseract.js/blob/master/src/worker-script/constants/defaultOutput.js)、[recognize API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md#workerrecognizeimage-options-output-jobid-promise)

需要修正“必须自己从零写文字层”的过强说法：当前源码已有可选 `{ pdf: true }` 输出，支持 `pdfTextOnly`，内部调用 `TessPDFRenderer`。这说明**由识别图片生成 PDF**存在上游路径，不等于它能读取原 PDF、保留原矢量/注释或直接修补原文字层。[实际输出实现](https://github.com/naptha/tesseract.js/blob/master/src/worker-script/utils/dump.js)

后续可以分别验证两种输出：一是以每页渲染图重建可搜索 PDF，原结构会丢失；二是把 text-only OCR 层按原页面坐标叠回原 PDF，需处理 CropBox、UserUnit、旋转、倾斜及像素到 PDF 单位映射。Tesseract 的 PDF renderer 使用不可见文字、GlyphLessFont 与 ToUnicode，不能仅因中文就断言必须下载完整可见 CJK 字体；如果改用 pdf-lib 绘制中文文字，则需要另外解决字体与映射。[Tesseract PDF renderer](https://github.com/tesseract-ocr/tesseract/blob/main/src/api/pdfrenderer.cpp)

这两条 PDF 输出均未在本次运行；需用中文实际复制/搜索、选择框位置、重复文字层、不同阅读器打开结果验收，再承诺可搜索 PDF。

### 移动端与负载

上游明确警告 Worker 内存较高，逐图创建 Worker 或无界并行可能导致崩溃；顺序任务复用单 Worker，完成或取消后终止。本项目应从**单页、单 Worker、可取消**开始，手机上不直接沿用“最多 200 页”的现有导入上限。[官方性能指南](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md)

A4 约 300 DPI 的 2480×3508 RGBA 单缓冲就约 33.19 MiB，150 DPI 的 1240×1754 约 8.30 MiB；这是 `宽×高×4` 的算术下界，未计 PDF 解码、模型、WASM 堆、图像副本及输出，**不是峰值内存实测**。当前预览的边长上限也可能降低超长页的有效 DPI。候选起点为 150–200 DPI、显式像素预算，质量不足允许单页提高；最终阈值必须以真实 iOS Safari/Android Chrome 测试决定，尚未验证耗时、温控、后台挂起与内存峰值。

## 2. 压缩路径应拆成不同能力

| 路径 | 实质 | 当前判断与边界 |
| --- | --- | --- |
| pdf-lib 重新保存 | 对象重新序列化、可用对象流 | 能压缩某些对象表示，已压缩的图像通常不会因重存变小。没有通用图片优化参数；不能叫“智能压缩”。[固定版本 save 源码](https://github.com/Hopding/pdf-lib/blob/v1.17.1/src/api/PDFDocument.ts) |
| 对象/流优化 | 清理未引用对象、去重、压缩流，保留字体和矢量路径 | 属于结构优化，可作为未来引擎对比；不是任意文件都能缩小。MuPDF 官方工具提供垃圾回收、去重、对象流及图像重编码控制。[官方 mutool 手册](https://github.com/ArtifexSoftware/mupdf/blob/master/docs/man/mutool.1) |
| 原图像对象重编码 | 只处理 PDF 内图片，保留其余内容 | 必须识别重复引用、软蒙版、颜色空间、ICC、透明度、JPEG/JPX/CCITT/JBIG2 与嵌套 XObject；当前 pdf-lib API 不构成完整优化器。本轮不实现。 |
| 整页渲染后 JPEG 重建 | PDF.js 渲染 → 缩像素/质量 → pdf-lib 包图 | 现有依赖可验证；只适合作为明确告知损失的“扫描件降采样”。文字、矢量、链接、注释、标签等不会因包成 PDF 而恢复；已有 OCR 层也会丢失。 |
| Ghostscript pdfwrite | 解释输入绘图操作后重建 PDF | 支持图像降采样等，但不是原 PDF 对象级无损优化；官方明确指出内部结构会改变，部分非绘图信息不能带过去。不能承诺完整保留结构。[官方高层设备说明](https://ghostscript.readthedocs.io/en/latest/VectorDevices.html) |

**范围建议**：先在独立原型验证扫描件降采样，UI 明确写“转换为图片页，原有可选文字和链接会丢失”，提供 DPI/质量与处理前后预览。输入没有提取到文字并不能证明它完全没有矢量、链接或已有结构，因此不能据空字符串自动选择破坏性路径。保留结构的压缩另立验收，避免把扫描件捷径用于正文 PDF。

压缩结果统一以输入/输出 **PDF bytes** 计算 `节省比例 = (1 - 输出字节 / 输入字节) × 100%`；图片字节、ZIP 字节和 HTTP 传输压缩不能混报。输出更大时报告“未缩小”，默认提供原文件或允许保留两者，不伪造正节省比例。显示是否有损、输出有效像素/DPI、文字/链接是否保留；不能只给一个“压缩成功”提示。

## 3. 许可与依赖决策

| 候选 | 官方许可事实 | 本轮决策 |
| --- | --- | --- |
| 现有 pdf-lib / PDF.js | MIT / Apache-2.0。[pdf-lib 许可](https://github.com/Hopding/pdf-lib/blob/v1.17.1/LICENSE.md)、[PDF.js 许可](https://github.com/mozilla/pdf.js/blob/v6.4.299/LICENSE) | 沿用已安装版本做实验，不改依赖。 |
| Tesseract.js / core / 官方 fast 语言数据 | 都各有 Apache-2.0 许可。[JS](https://github.com/naptha/tesseract.js/blob/master/LICENSE.md)、[core](https://github.com/naptha/tesseract.js-core/blob/master/LICENSE)、[fast 数据](https://github.com/tesseract-ocr/tessdata_fast/blob/main/LICENSE) | 后续如分发，保留相应 LICENSE、NOTICE/版权与修改说明；还需核查实际锁定包的第三方组件。此次未加入。 |
| MuPDF.js | 官方 WASM/JS 包，AGPL 与商业双许可。[官方 WASM README](https://github.com/ArtifexSoftware/mupdf/blob/master/platform/wasm/README.md) | 有浏览器运行路径，但不是可直接无条件加入的宽松许可依赖；先确认项目分发方式与许可匹配，再评估。此次未加入。 |
| Ghostscript | 官方提供 AGPL 和商业许可；pdfwrite 是原生引擎能力，不能据 CLI 文档假定已有适配本项目的官方浏览器包。[官方许可入口](https://www.ghostscript.com/licensing/index.html)、[许可说明](https://artifex.com/licensing)、[设备文档](https://ghostscript.readthedocs.io/en/latest/VectorDevices.html) | 不引入第三方来源不明的 WASM 压缩包；原生/服务端或浏览器移植均另评估。此次未加入。 |

“在浏览器本地运行”不能免除引擎/模型的分发许可要求；具体集成需以选定版本许可文本和分发形态判断。本报告不据厂商营销摘要给出整个应用必须如何授权的法律结论。

## 4. 已运行的小实验

复现入口：`apps/web/scripts/pdf-feasibility.mjs`。从仓库根目录运行：

```powershell
rtk proxy node apps/web/scripts/pdf-feasibility.mjs
```

默认使用本机 Chrome；也可预先设 `PLAYWRIGHT_CHANNEL` 选择已经安装的浏览器通道。本机默认 Playwright 自带 Chromium 尚未安装，所以本实验未下载浏览器，而使用 Chrome。脚本只以 Node 原生 HTTP 服务在 `127.0.0.1` 随机端口提供已安装的 PDF.js 文件，结束后关闭，不启动产品服务、不请求外网。

环境：Windows、Node v24.22.1、Chrome 155.0.8059.85、pdf-lib 1.17.1、PDF.js 6.4.299。脚本生成 `apps/web/work/pdf-feasibility/results.json`、合成 PDF 与扫描图；这些是可重新生成的本地工作产物。Chrome Canvas 执行编码与 PDF.js 实际渲染，Node PDF.js 回读文字，pdf-lib 回读页数/尺寸。不是仅比较文件名或断言下载存在。

夹具：三页 A4 矢量文档，每页 40 行可选英文与边框；一页近 300 DPI 的合成扫描图，含固定种子浅噪声、中英文字与细边框。PDF 时间元数据固定，扫描图使用本机 sans-serif，因此跨系统字体/编码器不同会改变字节数。该夹具包含故意构造的高分辨率噪声，**不能外推典型压缩率**。

| 实验 | 输入 PDF bytes | 输出 PDF bytes | 节省 | PDF.js 提取文字字符数 |
| --- | ---: | ---: | ---: | ---: |
| 矢量文档：非对象流 → 默认重存 | 7,325 | 4,033 | 44.94% | 6,813 → 6,813 |
| 矢量文档：已有对象流 → 默认重存 | 4,033 | 4,033 | 0% | 6,813 → 6,813 |
| 300 DPI PNG 扫描 PDF → 默认重存 | 5,884,896 | 5,884,896 | 0% | 0 → 0 |
| 300 DPI JPEG q=.95 扫描 PDF → 默认重存 | 2,565,024 | 2,565,024 | 0% | 0 → 0 |
| PNG 扫描 PDF → PDF.js 150 DPI 渲染 → JPEG q=.8 PDF | 5,884,896 | 272,720 | 95.37% | 0 → 0 |
| 矢量 PDF → PDF.js 150 DPI 渲染 → JPEG q=.8 PDF | 4,033 | 926,878 | 增大至 229.82 倍 | 6,813 → 0 |

所有输出回读页数与输入一致，首页面积均为 595.28×841.89 pt；这只验证这些夹具，不代表已验证任意 PDF 结构保真。脚本含可选文字仍存在、栅格化后文字为零及页数的最小自检，实际运行通过。

另将同一原始扫描 Canvas 按不同分辨率/质量直接构建图片页 PDF，隔离编码参数的影响；这是构建夹具对比，不是对已有 PDF 做对象级重编码：

| 近似 DPI / 编码 | 像素 | 原图编码 bytes | PDF bytes |
| --- | --- | ---: | ---: |
| 300 / PNG | 2480×3508 | 9,527,053 | 5,884,896 |
| 300 / JPEG .95 | 2480×3508 | 2,564,065 | 2,565,024 |
| 150 / JPEG .8 | 1240×1754 | 275,275 | 276,230 |
| 100 / JPEG .6 | 827×1169 | 118,452 | 119,407 |

已人工查看 150 DPI JPEG：中英字形与边框可见。没有做盲评、小字/印章检测、OCR 字符错误率、PSNR/SSIM、移动端内存或性能基准，因此不能宣传“无损”或“肉眼无差别”。原 PNG 与 PDF bytes 不相等也说明不能以图片大小代替最终 PDF 指标。

## 5. 这轮验证完成项与下一次门槛

- [x] 核实浏览器中文 OCR 的引擎、页面渲染、语言资源、自托管和离线缓存路径；区分 TXT、图片重建 PDF 与叠加原页文字层。
- [x] 核查 fast 中英语言数据及一个 core 的 HEAD 大小、主要许可；没有下载大模型或添加依赖。
- [x] 用现有依赖实测 pdf-lib 重存、扫描件 DPI/JPEG 取舍和整页栅格化的结构损失，保留复现脚本。
- [ ] 若启动 OCR 实现：固定版本/哈希，真值样本涵盖清晰中英、倾斜、低对比、小字、表格、竖排；分别记录字符错误率、冷/热启动、每页时间、取消及峰值内存。
- [ ] OCR 发布前：真实 iOS/Android 验证像素与页数预算；完成资源缓存后的首次离线识别、缓存损坏/丢失/升级与零文件上传检查。
- [ ] 若启动可搜索 PDF：中文复制/搜索与坐标命中、旋转/CropBox/UserUnit、重复文字层和不同阅读器；不得只检查存在 PDF 文件。
- [ ] 若启动扫描件压缩：真实扫描件与小字/章/二维码样本，结果变大回退、白底/透明、逐页释放与取消；明确原结构丢失。
- [ ] 若启动保留结构压缩：先完成引擎许可选择，再验证文字、矢量、链接、书签、标签、注释、字体、颜色与蒙版；与扫描件路径分别命名和验收。

未勾选项是**未来实现/发布门槛**，不属于本轮已承诺交付完整引擎。本轮结果足以确定路线和成本边界，不能写成“中文 OCR / PDF 压缩已上线”。
