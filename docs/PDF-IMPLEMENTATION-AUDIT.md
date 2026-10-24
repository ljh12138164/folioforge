# PDF 九类功能：实现方式核对

调研日期：2026-10-24。范围为用户本次列出的九类 PDF 功能，保持浏览器本地处理与离线使用。逐项检查当前源码，并重新查阅维护者文档、固定版本源码和浏览器平台文档。**九类均已有实际执行路径，未发现列出的功能项缺失或只有界面占位。** 源码审计与运行验收分别完成，本轮运行结果见文末；通过测试不等于真实扫描件准确率已经评测。

## 逐项实现与选型

下表文件均相对 `apps/web/src/pdf/`。入口为 `/pdf/`，工具参数只是切换同一工作台，页面整理结果可继续交给其他工具。

| 用户清单 | 实际实现文件与处理方法 | 官方依据与范围边界 |
| --- | --- | --- |
| 页面管理：合并、拆分、提取、排序、旋转、删除、撤销重做 | `core.ts` 的 `exportPdf` 按页面引用顺序用 `copyPages` / `addPage` 重组并设置旋转；`worker.ts` 拆分为每页 PDF；`PdfApp.tsx` 负责范围选择、拖动/按钮排序、删除、最多 20 步内存历史及 ZIP。 | [pdf-lib PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument#copypages)、[PDFPage 旋转](https://pdf-lib.js.org/docs/api/classes/pdfpage#setrotation)。这是静态页面工作流；历史不跨刷新持久化，不能推定复制页面会保留全部文档级结构。 |
| 图片转换：PDF 与 PNG/JPG 互转、批量 ZIP | `core.ts` 的 `inspectFile` 实际检测 PNG/JPEG 文件头并嵌入 A4；`renderer.ts` 用 PDF.js 渲染当前页/旋转；`PdfApp.tsx` 用 Canvas 编码 PNG/JPEG、`fflate.zipSync` 批量打包。 | [pdf-lib 图片嵌入](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpng)、[PDF.js 渲染示例](https://mozilla.github.io/pdf.js/examples/)、[Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)、[fflate 官方用法](https://github.com/101arrowz/fflate#usage)。PDF 转图片必然栅格化；设置 DPI 仍受像素上限约束。 |
| 页面排版：页码、四边裁剪、A4、2/4 拼版 | `EditTools.tsx` 提供参数，`operations.ts` 的 `visible` 统一可见区域、旋转与 UserUnit；页码用标准字体绘制，裁剪设置 CropBox；A4/N-up 嵌入原页内容后等比排放，不先转成图片。 | [PDFPage 绘制与 CropBox](https://pdf-lib.js.org/docs/api/classes/pdfpage)、[嵌入页面](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpage)。CropBox 只改变可见/打印区域，不能用于删除敏感底层内容；A4/N-up 不承诺交互结构保真。 |
| 水印与签名：中文文字、图片、手写及图片外观签名 | `renderer.ts` 的 `watermarkImage` 用本机中英文字体画透明 PNG，再由 `operations.ts` 嵌入；`StampTools.tsx` 将手写 Canvas 或上传 PNG/JPG 转透明/原背景 PNG，预览拖动或滑块定位；`analysis.ts` / `operations.ts` 使用同一旋转边界计算。 | [PDFPage.drawImage](https://pdf-lib.js.org/docs/api/classes/pdfpage#drawimage)、[Canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)。中文水印是图像外观，不是可编辑文字；字形取决于设备字体。签名是外观图片，水印不承诺不可移除。 |
| 扫描整理：双面交错、空白候选与确认删除 | `DuplexTools.tsx` + `core.ts` 的 `interleavePages` 支持单文件分段或两文件、反转背面、多余页追加，并应用到同一历史；`PdfApp.tsx` 检测先保护已有文字页，再渲染无文字页；`analysis.ts` 按背景和墨迹覆盖比例筛候选，用户勾选后调用删除。 | 页面渲染依据 [PDF.js 示例](https://mozilla.github.io/pdf.js/examples/)。交错顺序和墨迹算法是本仓库实现，不归因为上游能力。空白是候选判断，浅色印章、细线、扫描噪点仍需人工核对；没有自动删页。 |
| 文字处理：提取、搜索、TXT | `renderer.ts` 的 `pageText` 调 `getTextContent`，按项拼接与换行、间距启发式补空格；`PdfApp.tsx` 按页显示与字面搜索高亮，生成带页分隔的 UTF-8 TXT。 | [PDF.js getTextContent 官方源码](https://mozilla.github.io/pdf.js/api/draft/api.js.html)。读取现有文字层，不从图像推断文字；无法保证多栏、表格阅读顺序和缺失字符映射的还原。图像页另用 OCR。 |
| 文档对比：同步翻页、滑块、透明叠加、并排 | `PdfCompare.tsx` 按两个来源在当前工作区中的页序同步取页，用 PDF.js 渲染，按物理可见比例居中到同一画布，再用裁切/透明度/并排展示；明确提示缺页，回收 Blob URL。 | 渲染与 viewport 依据 [PDF.js 官方示例](https://mozilla.github.io/pdf.js/examples/)。滑块及叠加为本仓库 UI 实现；当前不自动校正扫描偏移，不自动判断语义差异，也不生成差异报告。 |
| OCR：简体中文、英文、TXT/可搜索 PDF | `document-jobs.ts` 先用 PDF.js 将待识别页渲染 PNG；`ocr-client.ts` 驱动固定 Tesseract.js/core 7.0.0 Worker，语言为 `chi_sim` / `eng` / 组合；读取官方 PDF 输出后嵌入与原可见物理尺寸一致的新页。默认非空文字页直接沿用文字/复制原页，避免重复文字层，允许强制重识别。 | [Tesseract 项目范围](https://github.com/naptha/tesseract.js#project-scope)不直接接受 PDF；[v7 API](https://github.com/naptha/tesseract.js/blob/v7.0.0/docs/api.md)支持语言、识别输出和终止；[v7 PDF 输出源码](https://github.com/naptha/tesseract.js/blob/v7.0.0/src/worker-script/utils/dump.js)实际调用 TessPDFRenderer。识别页重建会失去原矢量、链接、注释、标签；准确率与阅读顺序需核对。 |
| 压缩：对象重存、扫描降采样、比较/变大回退 | `compression.ts` 以完整未改变单一来源原字节或当前重组范围导出字节为基准，调用 `save({useObjectStreams:true})`；`document-jobs.ts` 扫描模式按选定 DPI 渲染 JPEG 再构建图片页；`PdfApp.tsx` 比实际 PDF 字节，候选不小时回退到同一基准，提供结果首页预览。 | [pdf-lib SaveOptions](https://pdf-lib.js.org/docs/api/interfaces/saveoptions)、[Canvas JPEG quality](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)。重存优化不会保证每份 PDF 缩小；扫描降采样有损，界面已要求确认文字层、矢量、链接等损失。 |

## 离线与资源选型

`renderer.ts` 的 PDF.js Worker、CMap、字体、WASM 与 ICC 均指向本站 `/pdf-assets/`。`scripts/prepare-ocr-assets.mjs` 将固定版本引擎及 `tessdata_fast` 的 `chi_sim`、`eng` 模型放到同源目录，模型固定在提交 `87416418657359cb625c412a48b6e1d6d41c29bd`，下载及复用均核对 SHA-256。fast 模型选择 LSTM-only OEM=1，与其官方限制一致；三种 LSTM core 分支覆盖普通、SIMD、relaxed-SIMD，符合 v7 加载器实际选择。依据：[固定模型 README](https://github.com/tesseract-ocr/tessdata_fast/blob/87416418657359cb625c412a48b6e1d6d41c29bd/README.md)、[v7 core 加载器](https://github.com/naptha/tesseract.js/blob/v7.0.0/src/worker-script/browser/getCore.js)。

`scripts/build-pdf-offline.mjs` 在生产构建时生成 Service Worker，将 `/pdf/`、应用静态文件及 PDF/OCR 资源列入版本化预缓存，只拦截列入清单的同源 GET；`use-offline.ts` 注册并显示状态。用户文档来自内存中的 File/Uint8Array，不加入该缓存。OCR 的 `cacheMethod: 'none'` 禁用 Tesseract 自身模型 IndexedDB 缓存，由应用资源缓存供给模型。[Service Worker 生命周期与离线机制](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)、[Tesseract v7 缓存参数](https://github.com/naptha/tesseract.js/blob/v7.0.0/docs/api.md)。

首次完整缓存需要联网，开发服务器不启用这份离线缓存；生产页面需安全上下文（HTTPS 或受信任的 localhost），缓存清理/回收后需重新联网。这里的“离线”指已准备好的应用资源，不等于用户文档会自动持久保存。

## 实质缺口与验收结论口径

- **本次九类功能没有待实现项。** 不需要再增加同名工具或更换引擎来兑现这一清单；应以真实导出和浏览器验收确认现有执行路径。
- **尚缺外部真实样本的质量/性能评测。** 仓库已有合成 PDF、中文/英文扫描、断网重载、导出回读等测试，但不能用合成大字样本或噪声图片压缩比替代真实扫描件 OCR 准确率、空白检测误判率和常见文档压缩率。真实 iOS/Android 内存与耗时仍待测；这属于已知验证边界，不是把页面控件算作实现完成。
- **资源限制已经在实现中约束。** 单文件 40 MiB、工作区和历史合计 100 MiB、最多 200 页；OCR 每批 20 页、长边 3000px / 400 万像素，OCR 与扫描压缩结果上限 100 MiB。加密 PDF、交互表单/签名字段被拒绝。不要对这些输入宣称支持。
- **选型适用于当前本地静态 PDF 首版。** 保留现有 pdf-lib + PDF.js + 固定 Tesseract/模型 + Canvas + fflate，是对当前九类要求最小且可核对的方案；这是依据代码与上游能力作出的工程判断，不是跨设备性能结论。

## 本轮运行验收

主任务于 2026-10-24 重新执行并报告：`pnpm check`、Web 生产构建、28 项单元测试、30 项 Web 浏览器测试及 `git diff --check` 全部通过；浏览器全套耗时约 1.5 分钟。生产离线缓存包含 253 个资源，版本为 `84bd633bf7a49079`。本轮只验收 Web，未执行 Electron 或真实手机性能测试。

浏览器验收位置：`apps/web/test/pdf.spec.mjs`、`pdf-extensions.spec.mjs`、`pdf-duplex.spec.mjs`、`pdf-complete.spec.mjs`、`pdf-heavy.spec.mjs`；历史交付记录见 [PDF-CHECKLIST.md](PDF-CHECKLIST.md)、[PDF-OCR-COMPRESSION.md](PDF-OCR-COMPRESSION.md) 与 `.impeccable/review/pdf-heavy/web-verification.md`。本轮缓存版本以上述重新构建结果为准，不覆盖历史设计记录。
