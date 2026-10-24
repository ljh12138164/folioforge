# 离线 PDF 扩展：实现方案调研

调研日期：2026-10-24。范围：页码、中文水印、边距裁剪、A4 适配、2/4 页拼版、文字提取与搜索。本文是实现前的技术依据；测试矩阵为验收要求，不代表功能已完成或测试已通过。

## 结论

继续使用现有 pdf-lib 1.17.1 Worker 写入 PDF，PDF.js 6.4.299 渲染与提取文字。首版不引入新的 PDF 引擎、服务器、OCR 或字体包。

| 功能 | 推荐做法 | 需要说明的边界 |
| --- | --- | --- |
| 页码 | 标准 Helvetica，按当前页面顺序绘制 ASCII 数字；支持起始值、位置与字号 | 页码是新增文字，覆盖原内容前应留足边距 |
| 中文水印 | 浏览器 Canvas 用本机字体画透明 PNG，Worker 在 PDF 中嵌入一次并复用 | 只有水印是位图；水印文字自身不能选择和搜索，字形随本机字体变化 |
| 边距裁剪 | 以旋转后可见页的上下左右为输入，转换回原 PDF 坐标；修改 CropBox 或按裁剪框嵌入 | 裁剪隐藏内容，不承担安全脱敏功能 |
| A4 适配 | 原页作为 Form XObject 等比放入新 A4 页面，保留原内容流 | 保留矢量和可选文字；页面注释、链接和结构标签不应承诺保留 |
| 2/4 页拼版 | 同样嵌入原页，按行优先排入 2 或 4 个单元格，等比居中 | 最后一张纸允许空单元格；它不是骑马钉书册排序 |
| 文字提取与搜索 | PDF.js `getTextContent()`，按页展示与导出 UTF-8 TXT，搜索当前结果 | 不做 OCR；复杂排版与缺失字符映射可能影响内容和阅读顺序 |

pdf-lib 官方能力与页面绘制接口支持上述写入路径；PDF.js 官方接口提供文字项和渲染视口。[pdf-lib](https://pdf-lib.js.org/)、[PDFPage](https://pdf-lib.js.org/docs/api/classes/pdfpage)、[PDFPageProxy](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html)

## 1. 页面坐标：不能直接使用 getSize()

现有工作台的 `PdfPage.rotation` 已代表绝对页面旋转角。新增操作必须使用该值，不能再叠加原页 `/Rotate`。PDF.js 的 `getViewport({ scale: 1, rotation })` 会计算旋转、可见框和 `/UserUnit`，适合验证实际显示方向。[PDF.js PageViewport 源码](https://github.com/mozilla/pdf.js/blob/v6.4.299/src/display/page_viewport.js)

pdf-lib 1.17.1 的 `PDFPageEmbedder` 默认仅由 MediaBox 计算宽高，并构造从 `(0,0)` 开始的框；其 Form XObject 不自动带原页面 `/Rotate`。所以必须显式计算可见框（CropBox 与 MediaBox 的有效交集）、传入 boundingBox，并自己处理旋转。否则有非零原点或原有裁剪的 PDF 会偏移、露出已隐藏区域或旋转错误。[固定版本 PDFPageEmbedder 源码](https://github.com/Hopding/pdf-lib/blob/v1.17.1/src/core/embedders/PDFPageEmbedder.ts)

最容易验证的共用路径：将可见原页嵌入新的、原点为零且旋转为零的页面。设有效框原点为 `(cx, cy)`，宽 `w`、高 `h`；`embedPage` 使用显式框，默认矩阵会平移 `(-cx,-cy)`。然后使用以下 `drawPage` 参数（数学坐标 y 向上）：

| 绝对顺时针旋转 | 新页宽、高 | drawPage 旋转角 | 未缩放偏移 x、y |
| --- | --- | --- | --- |
| 0° | w、h | 0° | 0、0 |
| 90° | h、w | -90° | 0、w |
| 180° | w、h | -180° | w、h |
| 270° | h、w | -270° | h、0 |

等比缩放系数为 `s`、单元格居中偏移为 `(ox,oy)` 时，以上偏移乘 `s` 再加 `(ox,oy)`；使用 `xScale=yScale=s`，避免混淆旋转前后的 width/height。[drawPage 选项](https://pdf-lib.js.org/docs/api/interfaces/pdfpagedrawpageoptions)、[操作符实现](https://github.com/Hopding/pdf-lib/blob/v1.17.1/src/api/operations.ts)

`/UserUnit` 不等于 1 时，标准单位不能盲目当作 pt。保留原尺寸的归一化页面应把宽高及绘制比例乘 UserUnit；A4 适配只需按最终可见尺寸计算比例。以毫米输入的裁剪或边距需转换到用户空间，或者使用相对百分比避免这种单位混淆。此结论来自 PDF.js 实际视口计算，属于实现推导，需通过夹具验证。[PDF.js PageViewport 源码](https://github.com/mozilla/pdf.js/blob/v6.4.299/src/display/page_viewport.js)

空白 PDF 页可能没有 Contents；pdf-lib 嵌入时会抛 `MissingPageContentsEmbeddingError`。归一化时检测空内容，创建等尺寸空白页即可，不应拒绝整份包含空白页的文件。[PDFPageEmbedder 源码](https://github.com/Hopding/pdf-lib/blob/v1.17.1/src/core/embedders/PDFPageEmbedder.ts)

## 2. 保留内容的取舍

Form XObject 保存原页内容流与资源，所以无需把整个 PDF 渲染成 PNG。这样原有字体、图形和可选文字仍在 PDF 中。它只处理 Contents/Resources，不复制页面级 Annots、文章顺序或结构树；部分注释的可见外观也可能消失。A4 与拼版应明确面向静态页面输出，不能宣称交互、书签、无障碍结构完全保留。[固定版本源码](https://github.com/Hopding/pdf-lib/blob/v1.17.1/src/core/embedders/PDFPageEmbedder.ts)

页码、水印和单纯裁剪若要优先保留原页面注释，可沿用 `copyPages`，直接新增内容或改 CropBox；代价是需要一套视觉坐标到原始坐标的逆变换。首版若统一采用归一化管线，代码更简单，但上述页面级信息的限制必须与 A4/拼版一样说明。不要为了统一实现而把整页位图化。[copyPages](https://pdf-lib.js.org/docs/api/classes/pdfdocument#copypages)、[PDFPage](https://pdf-lib.js.org/docs/api/classes/pdfpage)

实现选择：页码、水印和单纯裁剪保留原页；A4 与拼版使用 Form XObject。将“旋转后可见页底部为 y=0”的绘制坐标转换到原页，矩阵分别为：0° `[1,0,0,1,cx,cy]`；90° `[0,1,-1,0,cx+w,cy]`；180° `[-1,0,0,-1,cx+w,cy+h]`；270° `[0,-1,1,0,cx,cy+h]`。这些矩阵的输入为原用户空间单位；若界面绘制采用物理 pt，需将矩阵前四项除以 UserUnit，平移项不变。在保存/恢复 graphics state 之间绘制。此矩阵为上述旋转公式的逆变换推导，不能只靠单元测试数字等式，应比较实际 PDF.js 渲染结果。

CropBox 的定义只控制显示/打印区域，内容可能仍可恢复，文字提取也不能被当作安全过滤。因此 UI 应叫“裁剪边缘”，而不是“永久删除敏感内容”。[getCropBox / setCropBox](https://pdf-lib.js.org/docs/api/classes/pdfpage#getcropbox)

## 3. 中文水印：首版选择 Canvas

标准 Helvetica 适合数字页码，不适合直接编码中文。另一条完整文字路径是注册 `@pdf-lib/fontkit`、读取自托管中文字体，再 `embedFont(bytes, { subset: true })`；pdf-lib 官方提供此方式，fontkit 的专用分支支持浏览器和 Uint8Array。[pdf-lib 自定义字体示例](https://pdf-lib.js.org/#embed-font-and-measure-text)、[fontkit 官方仓库](https://github.com/Hopding/fontkit)、[EmbedFontOptions](https://pdf-lib.js.org/docs/api/interfaces/embedfontoptions)

Noto Sans SC 是可用的候选，官方 Google Fonts 元数据提供简体中文字体；附带 OFL 允许嵌入及随应用分发，但需保留版权与许可。完整 CJK 字体资源增加首次离线缓存的负担，而系统又只需要简短水印，这轮不引入它。没有下载或测量字体体积，不给出伪精确大小。[官方元数据](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/METADATA.pb)、[字体许可原文](https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt)

Canvas `fillText()` 可直接使用浏览器字体栈；Canvas 本质上输出位图。先 `measureText()` 获取实际包围范围，加内边距并限制最大像素，再生成透明 PNG，只给水印区域分配像素。PNG 只嵌入一次，多页复用图片对象，透明度在 PDF 绘制时控制。[HTML Canvas 规范](https://html.spec.whatwg.org/multipage/canvas.html#drawing-text-to-the-bitmap)、[measureText](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)

这个选择使首次离线使用中文水印不需要额外网络字体，且不影响原正文的可选文字与矢量清晰度；代价是新增水印本身不可选、放大存在像素边界、跨系统字形可能不同。不能保证所有系统都安装每一种文字的字形。文本长度、字号与透明度用合理范围约束；在 UI 说明“使用本机字体生成水印”，不暴露不必要的技术细节。

页码仍由标准字体绘制，按当前工作台顺序生成。起始页码和总数的定义需要固定：例如选择 3 页并从 5 开始，产生 5、6、7；“第 x / n 页”里的 n 应明确是处理页数还是结束编号。首版可采用 `5, 6, 7` 或 `5 / 7` 这样的清晰格式，避免内部含义不一致。

## 4. 裁剪、A4 与拼版

边距输入宜基于旋转后的可见页面，四边独立，必须验证左右之和小于宽度、上下之和小于高度。对混合尺寸文档，每一页都验证，失败时在提交前说明哪一页过小；不要只按第一页面积判断。比例输入可以覆盖混合尺寸，毫米输入则更适合打印场景，但须处理 UserUnit。

A4 设为约 595.28 × 841.89 pt，提供横向/纵向与留白选项，保持长宽比，居中留白，不通过 `setSize` 假装已经缩放正文。pdf-lib 明确提供内容缩放和尺寸设置两类 API，它们不是同一个操作。[PDFPage setSize / scaleContent / drawPage](https://pdf-lib.js.org/docs/api/classes/pdfpage)

2 合 1 可默认横向 A4、两列；4 合 1 可默认纵向 A4、两行两列。按工作台当前顺序逐页填充，剩余单元格保持空白。每个格子的可用宽高减去边距与间距后求最小缩放比例。无需用 canvas，也无需引入 PDF 排版引擎。[embedPages](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpages)

拼版改变页数，范围语义必须清楚。最低歧义的首版是对全部当前页面拼版；若支持选页，需明确把选中页的拼版结果放在第一个被选页的位置，移除其余被选页，并保留未选页顺序，而不是默默重排未选页。

## 5. 文字提取、搜索与 TXT

复用现有 renderer 的 PDF.js 文档缓存，逐页 `getTextContent()`，取含 `str` 的 TextItem，使用 `hasEOL` 组织换行。不要把所有 items 用空格无差别连接，中文原有连续字串会被破坏；同一行不同 item 间的必要空格可参考 transform/width，但不要在首版宣称重建复杂版式。公开类型还包含 dir、transform、width、height 供以后改进。[PDF.js 固定版本类型](https://github.com/mozilla/pdf.js/blob/v6.4.299/src/display/api.js)、[getTextContent 文档](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html#getTextContent)

官方接口明确会规范化空白字符，也没有保证最终文本等同于人的多栏阅读顺序。因此首版按原有文字项顺序提供纯文本，并说明表格、多栏、竖排等可能需要人工检查。扫描图片页通常没有可提取文字，应显示“此页未提取到文字，可能是扫描页”，不把空结果报成损坏，也不自动承诺 OCR。

搜索针对当前提取结果，不把字符串拼成用户正则表达式。提供匹配页和上下文，点结果打开对应预览；可用普通 `<mark>` 标记文本命中，不需要这轮加入整套 PDF 文字层。把它描述为“搜索提取文字”，避免承诺在 PDF 画布中精确标注位置。TXT 按当前页序加页分隔，UTF-8 Blob 下载。

提取期间展示页级进度，允许取消；处理后页面发生旋转、删除、拼版、撤销或导入时清空旧结果或按当前页面引用重新建立。防止取消后的迟到 Promise 把旧文档结果写回 UI。执行提取并不要求把 PDF.js 再搬到第二个 Worker，现有 PDF.js 本身已使用专用 Worker。[PDFPageProxy](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html)

## 6. 接入现有历史：应用后生成新源

仓库已有 `PdfSource` 字节、`PdfPage` 引用、20 步页面历史以及 Worker 取消能力。推荐让“应用到页面”生成真实 PDF 字节，把输出作为新 source，以一条编辑记录替换相应页面。缩略图与预览随后读取同一份真实输出，用户能继续串联“合并 → 页码 → 水印 → 裁剪 → 导出”，并使用已有撤销/重做。这个方案是基于本仓库代码的架构判断，不是第三方库强制要求。

无需增加可序列化操作树、后端任务队列或新的编辑器状态库。将变换计算放进现有 Worker；Canvas 水印图只在点击应用时生成并发送 PNG 字节。成功返回后再原子替换页面，失败或取消保持旧页面。保留既有总页数和文件大小上限。

必须按“当前页面 + 所有撤销/重做历史”仍引用的 source 管理内存。单次变换不能把所有旧源永远追加保留；清除不可达来源，同时计入新源真实 bytes 长度。否则 20 次大 PDF 操作会绕过 100 MiB 任务限制。不能删除仍被历史引用的来源，否则撤销后的页面会缺失。renderer 对被清理来源的缓存也应释放，或在批次提交后重建 renderer。

## 7. 实现后验收矩阵

| 场景 | 必须检查的真实结果 |
| --- | --- |
| 0/90/180/270°、非零 CropBox/MediaBox 原点 | 页码位置、中文字方向、裁剪四边与预览一致；无隐藏边缘意外暴露 |
| 混合横竖页和尺寸、UserUnit=2 | A4 输出物理框尺寸正确，内容不拉伸，字号/边距含义一致 |
| 空白页，无 Contents | 可页码、水印、裁剪、A4、拼版，不导致整份失败 |
| 中文水印、长文本、透明度边界 | 导出 PDF 实际可见且不截字；只新增水印为图片，正文仍可提取 |
| 3 页 2 合 1，5 页 4 合 1 | 分别输出 2 页，页序正确，末尾空格不重复旧页 |
| 裁剪过大、非法页码起始值或边距 | 错误可理解且不修改当前文档，恢复参数后可继续操作 |
| 原文 PDF 与扫描图片 PDF | 前者提取到已知文本；后者空状态正确；搜索跨多个文字项和多页 |
| 连续应用及撤销/重做 | 恢复真实页面、页数、方向与选区；清除陈旧文字搜索结果 |
| 取消正在执行的任务、紧接着重新处理 | 无迟到结果覆盖新结果，页面可继续导出 |
| 缓存完成后冷启动离线 | 首次使用新增水印、布局和提取无需外网资源；仅 GET 应用资源，无文件上传 |
| 导出后重新加载 | pdf-lib 读取页数/框，PDF.js 提取原文并实际渲染，不能只断言下载文件存在 |
| 桌面、窄屏、深色主题 | 参数、应用按钮、搜索结果和导出入口可操作，无横向溢出 |

与原工作台的合并、拆分、图片导出、图片转 PDF 保持回归覆盖。用合成夹具而不是私人文档；保存渲染截图供 UI 与真实输出核对。调研阶段未进行实现测试，不将本节写成通过记录。
