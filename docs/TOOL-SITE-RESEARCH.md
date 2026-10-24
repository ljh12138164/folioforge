# 工具站功能调研

PDF 范围交付状态（2026-10-24）：见 [PDF 清单](PDF-CHECKLIST.md)。用户最初要求 OCR / 压缩先验证方案，随后要求全部实现，现已补齐 OCR 和压缩功能；下文保留最初调研及优先级，不代表所有非 PDF 候选均已纳入实现。

调研日期：2026-10-24。目标：为 PixelForge 找下一批值得实现的功能，优先保持本地处理、离线优先的方向。

建议先扩展 PDF 工作流：页码、水印、裁剪/A4 适配、2/4 页拼版、文本提取；随后加双面扫描重排与空白页识别。图片方向补裁剪、批量水印、手动画区打码。综合工具作为后续独立分类，不把已有图片缩放、质量设置和原图/结果对比重复算成新功能。

## 范围与证据口径

当前能力按本次任务提供的项目范围记录：PDF 合并、拆分、提取、排序、旋转、删除、撤销和真实预览；PNG/JPG 转 A4 PDF；PDF 转 PNG/JPG 并打包 ZIP；图片转换支持 14 种格式，以及质量、缩放、背景、元数据选项和任务恢复。因此，已有格式转换、基本缩放、PDF 页面管理不重复列为新增功能。

以下竞品功能以官方产品页或项目维护者源码为依据，属于“官方列出/源码可见”，没有把它们当成本次实测结果。优先级、使用场景和实现难度是针对本项目的判断；没有流量、转化或用户访谈数据支撑需求量排序。浏览器可行性是工程推断，仍需原型验证，不等于已经在 PixelForge 跑通。

## 非 PDF 方向参考的 4 个站点

| 站点 | 官方可核实内容 | 对项目的启发 |
| --- | --- | --- |
| iLoveIMG | 提供裁剪、旋转、水印、动图制作、模糊人脸/指定区域等图片工具。[工具目录](https://www.iloveimg.com/) | 从已有图片转换向“处理后直接交付图片”延伸。 |
| Squoosh | 官方介绍本地图片压缩；Google 的说明展示编码设置和并排比较。[官网](https://squoosh.app/) · [官方仓库隐私说明](https://github.com/GoogleChromeLabs/squoosh#privacy) · [Google 图片教程](https://web.dev/learn/images/jpeg) | 将已有质量参数变成能看见效果的压缩工作台。 |
| IT-Tools | 维护者工具注册源码包含 QR/Wi-Fi QR、JSON 格式化/压缩/转 CSV、文本比较、Base64 等。[官方源码目录](https://github.com/CorentinTh/it-tools/blob/main/src/tools/index.ts) | 可以扩展轻量文字与数据工具，但应在图片/PDF 主线外单设入口。 |
| CyberChef | 官方 README 列出编码、压缩、哈希和校验；声明输入与文件在浏览器处理，并可下载本地运行。[官方功能与运行说明](https://github.com/gchq/CyberChef#features) | 借鉴简单的输入→操作→结果流程，先做少数独立工具，无须复制完整配方系统。 |

## 具体候选与建议顺序

P0：适合作为下一轮；P1：主线完善后；P2：有明确使用反馈再做。这里的优先级依据是与现有能力的衔接和最小实现范围，属于产品/工程判断。

| 优先级 | 候选工具 | 竞品已列出的能力与证据 | 建议的最小范围及用途（本项目判断） | 本地/离线可行性（工程推断） |
| --- | --- | --- | --- | --- |
| P0 | 图片裁剪、旋转、翻转 | iLoveIMG 支持像素矩形裁剪；目录有图片旋转。[裁剪](https://www.iloveimg.com/crop-image) · [旋转](https://www.iloveimg.com/rotate-image) | 先做单图拖动裁剪、固定比例、90° 旋转和翻转；翻转是本项目建议，并非此处核实的竞品功能。适合头像、封面、扫描件纠正。 | 高；预计可衔接现有图片解码/导出。先限制静态图，动画保留需另行验证。 |
| P0 | 批量图片水印 | iLoveIMG 提供文字/图片水印，含透明度、字体等选项。[水印工具](https://www.iloveimg.com/watermark-image) | 一个文字或 Logo、九宫格位置、边距、透明度、批量导出。适合商品图和作品署名。 | 高；预计可复用导出与队列，中文字体、透明图和不同尺寸定位是验证点。 |
| P0 | 图片区域打码 | iLoveIMG 明确提供自动人脸模糊和指定区域模糊。[模糊工具](https://www.iloveimg.com/blur-face) | 首版只做手动画矩形、像素化/实色覆盖、撤销和导出；不把自动识别人脸纳入同一交付。适合截图中的姓名、地址等处理。 | 手动区域高；自动检测属于另一项研发，先不承诺准确率。需验证导出像素确实被改写。 |
| P1 | 图片压缩工作台增强，非新增基础对比工具 | Squoosh 提供编码参数和并排比较，官网说明本地处理。[Google 教程](https://web.dev/learn/images/jpeg) · [官网](https://squoosh.app/) | 本项目已有质量/缩放和原图/结果对比；可再探索“输入目标 KB，自动寻找质量参数”，这是本项目建议，不能据 Squoosh 来源推定其提供目标 KB 功能。 | 中；需约定最低画质、是否允许缩小尺寸、迭代次数和取消；目标达不到时说明原因，不承诺所有图片都能压到指定大小。 |
| P1 | 多图制作 GIF | iLoveIMG 的 JPG 转换页列出静态/动态 GIF、每帧秒数和循环选项。[官方工具](https://www.iloveimg.com/jpg-to-image) | 图片排序、统一画布、全局帧时长、循环、预览和导出；这是多帧合成，区别于已有格式转换。 | 中；需要动画编码能力验证。帧数、分辨率、调色板与内存限制需原型测量。 |
| P1 | 二维码生成 | IT-Tools 源码注册普通 QR 与 Wi-Fi QR 工具。[普通 QR](https://github.com/CorentinTh/it-tools/blob/main/src/tools/qr-code-generator/index.ts) · [Wi-Fi QR](https://github.com/CorentinTh/it-tools/blob/main/src/tools/wifi-qr-code-generator/index.ts) | 先做文本/链接转 QR、PNG 下载；Wi-Fi 模式后加。可把下载图继续交给现有图片工具。 | 高；小型本地编码依赖预计足够，必须用真实扫码验证中文、长链接与纠错参数。 |
| P1 | 文本差异比较 | IT-Tools 注册 text-diff，关键词包含文本/字符串比较。[官方源码](https://github.com/CorentinTh/it-tools/blob/main/src/tools/text-diff/index.ts) | 左右输入、按行差异、忽略空格开关；适合改稿和配置对比。 | 高；大文本性能与中文显示需验证，可设合理输入限制。 |
| P2 | JSON 格式化、校验、压缩、转 CSV | IT-Tools 注册 JSON 格式化/压缩与转 CSV；转换组件展示 JSON 输入校验与 CSV 输出。[格式化](https://github.com/CorentinTh/it-tools/blob/main/src/tools/json-viewer/index.ts) · [工具注册](https://github.com/CorentinTh/it-tools/blob/main/src/tools/index.ts) · [CSV 组件](https://github.com/CorentinTh/it-tools/blob/main/src/tools/json-to-csv/json-to-csv.vue) | 先做严格 JSON 的校验/格式化/压缩；CSV 仅支持对象数组并说明列规则。不要首版包揽 YAML/XML/TOML。 | 高；复杂嵌套和大文件属于范围约束，需要明确定义，不能将可解析等同于 CSV 无损转换。 |
| P2 | Base64 / URL 编解码 | CyberChef README 列出 Base64；IT-Tools 注册 Base64 字符串/文件和 URL 编码。[CyberChef](https://github.com/gchq/CyberChef#cyberchef) · [IT-Tools](https://github.com/CorentinTh/it-tools/blob/main/src/tools/index.ts) | UTF-8 文本编解码、URL 组件编解码、复制结果；之后再考虑文件模式。适合排查数据与链接。 | 高；需验证中文、多字节字符和错误输入。Base64 与 URL 编码要清楚分开。 |
| P2 | 文件/文本 SHA-256 校验 | CyberChef 官方说明支持哈希/校验；IT-Tools hash-text 注册含 SHA256 等算法。[CyberChef](https://github.com/gchq/CyberChef#cyberchef) · [IT-Tools](https://github.com/CorentinTh/it-tools/blob/main/src/tools/hash-text/index.ts) | 一个 SHA-256 选项、文件或文字输入、与预期值比较。文件模式是本项目扩展建议，不是对 IT-Tools 文本工具能力的推定。 | 高（中小文件）；原生 digest 接口接收 BufferSource 并复制输入字节，不能直接当成流式哈希接口，超大文件需另评估。[W3C digest 定义](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest) |

## 建议的交付切分

1. 先做“图片裁剪/旋转”和“水印”，连通导入→编辑→沿用现有转换/导出。验证单图、不同尺寸批量、透明图片和中文文字。
2. 再做手动区域打码；已有图片对比不重复建设。目标体积压缩作为现有转换器增强，先验证质量与尺寸策略。
3. 多图 GIF、二维码和文本比较作为下一批候选。它们各自有独立输入输出，适合单独上线验证使用反馈。
4. JSON/编码/哈希等开发者工具等出现明确需求后再扩展；当前没有证据说明应该把网站重心转成开发者工具大全。

## 暂不放进首批的方向

- 自动抠图、AI 放大：iLoveIMG 确实列出这两项，但其产品页面不构成 PixelForge 能在当前依赖和设备上离线实现的证据。先验证模型体积、效果、耗时和离线资源策略，再决定是否立项。[官方目录](https://www.iloveimg.com/)
- 完整 CyberChef 配方系统：已有浏览器端实现证明这一类工具存在，不代表本项目需要承担同样的功能面。先验证单个编解码/校验工具是否有人使用。
- 对现有 14 格式转换重复开新入口：本次建议优先补编辑、预览和多帧工作流，不以增加功能卡片数量作为目标。

本次未实际上传文件测试竞品，也未测量本地实现速度、移动端内存或离线首次加载行为；以上内容适合选题，具体实现范围需在开始开发时以小原型验证。

## PDF 方向参考的 3 个站点

| 站点 | 官网能力事实 | 对项目的启发（判断） |
| --- | --- | --- |
| iLovePDF | 工具目录列出页码、水印、裁剪、签名、OCR、对比和工作流。[官方目录](https://www.ilovepdf.com/) | 补齐页面重组后的文档交付操作。 |
| PDF24 | 除基础操作外列出拼页、手册、页面尺寸、文档信息、元数据移除、全文搜索及文本导出。[全部工具](https://tools.pdf24.org/en/all-tools) | 区分编辑、打印、提取场景，避免只有格式转换入口。 |
| BentoPDF | 文档列出双面扫描重排、交错合并、拼版、空白页检测、文本提取、签名和压缩等细分工具。[官方工具文档](https://www.bentopdf.com/docs/tools) | 对扫描件整理与打印任务提供直接操作；其文档声明浏览器本地运行，不能据此宣称离线 PDF 工具竞争少。 |

下表优先级统一以当前 PDF 主线为先。难度是基于本仓库已有 pdf-lib、PDF.js、页面模型、Worker、ZIP 和离线缓存的工程判断，不是竞品实现方式或已验证工期。

| 批次 | 工具 | 已核实的竞品能力 | 建议首版范围 | 预估难度 / 验收要点 |
| --- | --- | --- | --- | --- |
| 第一批 | PDF 页码 / 页眉页脚 | iLovePDF 支持位置、起始数、页码格式与页面范围。[页码工具](https://www.ilovepdf.com/add_pdf_page_number) | `1`、`1 / 20`、自定义起始页；跳过封面；六个位置。 | 低至中；旋转页、不同纸张定位及中文模板字体需验证。 |
| 第一批 | PDF 文字 / 图片水印 | iLovePDF 支持文字与图片水印及位置、透明度等选项。[水印工具](https://www.ilovepdf.com/pdf_add_watermark) | 文字或 Logo、透明度、旋转角度、指定页面；与现有真实预览联动。 | 中；离线中文字体、长文本与批量定位；水印不承诺不可移除。 |
| 第一批 | PDF 裁剪 / A4 适配 | iLovePDF 支持拖框裁剪、当前页或全部页；PDF24 列出页面尺寸变更。[裁剪](https://www.ilovepdf.com/crop-pdf) · [页面尺寸](https://tools.pdf24.org/en/all-tools) | 去白边、按边距裁剪；内容等比放入 A4，分别提供缩放与裁剪选项。 | 中；坐标、原有 CropBox 和旋转页必须准确；裁剪不能当作隐私内容删除。 |
| 第一批 | 2/4 页拼一张 | BentoPDF N-Up 支持一张纸放多页，选择纸型、方向与间距。[N-Up](https://www.bentopdf.com/docs/tools/n-up-pdf) | 首版仅 2 合 1、4 合 1，A4 横竖版，保留比例，打印前预览。 | 中；末页不足、混合页面尺寸与旋转验证；尽量嵌入页面内容，避免先转位图。 |
| 第一批 | PDF 提取文字 / 搜索 | BentoPDF 可导出 TXT，并明确无文字层扫描件需 OCR。[PDF to Text](https://www.bentopdf.com/docs/tools/pdf-to-text) | 按页查看、复制、关键词搜索、单文件 TXT / 多文件 ZIP；首版只处理现有文字层。 | 低至中；复用 PDF.js；多栏阅读顺序和缺失字符映射属于边界，不承诺 Word 式版面重建。 |
| 第二批 | 双面扫描重排 / 正反页交错 | BentoPDF 支持单 PDF 前后两个区块重排、背面反转，以及多个 PDF 交错合并。[双面重排](https://www.bentopdf.com/docs/tools/duplex-collate) · [交错合并](https://www.bentopdf.com/docs/tools/alternate-merge) | 两份 PDF 交错；或一份 PDF 按分界点拆区块交错，允许反转背面；预览新页序后导出。 | 低；可沿用现有页面引用与导出；奇数页和正反面数量不等给出明确结果。 |
| 第二批 | 空白页识别 | BentoPDF 渲染后分析像素，提供灵敏度与候选缩略图确认。[空白页检测](https://www.bentopdf.com/docs/tools/remove-blank-pages) | 检测候选页、用户确认后批量删除，支持撤销；首版不自动提交删除。 | 中；浅色印章、少量页码与扫描噪点容易影响判断，需要真实样本集。 |
| 第二批 | 手写 / 图片签名 | BentoPDF 可画签名、输入姓名或上传签名图片，拖动放置。[Sign PDF](https://www.bentopdf.com/docs/tools/sign-pdf) | 首版画签名或上传透明 PNG，调整位置与大小，写入选定页。 | 中；定位可复用水印机制。功能名明确为外观签名，不宣传证书签名、身份验证或防篡改。 |
| 第二批 | PDF 视觉对比 | PDF24 列出文本标记、页面叠加和滑块对比。[PDF 对比](https://tools.pdf24.org/en/compare-pdf) | 先做两份文档同步翻页和滑块/叠加；后续才评估文字与版面差异定位。 | 中至高；页尺寸和扫描偏移需对齐；首版不能把每个像素变化称为语义改动。 |
| 后续探索 | PDF / 图片 OCR | iLovePDF 列出扫描 PDF 识别；BentoPDF 的离线文档说明需要 Worker、语言数据与文字层字体。[OCR 入口](https://www.ilovepdf.com/) · [离线 OCR 文档](https://www.bentopdf.com/docs) | 先做图片转文字，再评估生成可搜索 PDF；中文和英文资源单独下载与缓存。 | 高；先验证语言包体积、移动端内存、倾斜扫描和文字层坐标。 |
| 后续探索 | PDF 压缩 | BentoPDF 文档区分图片重压缩、字体处理、清理与页面栅格化，并说明栅格化影响文字选择/链接。[压缩文档](https://www.bentopdf.com/docs/tools/compress-pdf) | 如果先做扫描件压缩，应明确是图片重编码、可调 DPI；保留文字/矢量的压缩另行立项。 | 高；不能把 pdf-lib 重新保存等同于有效压缩，也不能宣称转换成图片后仍保留原结构。 |

## 实现依据与需要保留的边界

- pdf-lib 提供绘制文本、图片与嵌入页面；自定义字体需 fontkit。由此推断页码、水印、简单外观签名、拼版适合在当前前端栈扩展，但中文字体需合法来源、按需加载和实际缺字检查。[官方示例](https://pdf-lib.js.org/) · [嵌入页面 API](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpages)
- PDF.js 的 `getTextContent` 提供页面文字内容，可作为文字提取/搜索基础；这不是 OCR，也不等于还原标题、表格和多栏阅读顺序。[官方 API](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html#getTextContent)
- pdf-lib 将 CropBox 定义为显示/打印时的裁切区域，仅用它隐藏边缘不等于从文件移除底层内容。[官方页面边界 API](https://pdf-lib.js.org/docs/api/classes/pdfpage#getcropbox)
- Tesseract.js 官方明确不直接支持 PDF 文件。采用它时，需要先渲染页面识别；生成可搜索 PDF 还要另做文字层，而不是安装一个 OCR 包即可完成整个 PDF OCR 功能。[项目范围](https://github.com/naptha/tesseract.js#project-scope)
- BentoPDF 的功能文档标明 AGPL-3.0 / 商业双许可。本报告参考功能与交互，未拷贝其实现，也未把它当作本项目可直接无条件复用的依赖。[官方文档](https://www.bentopdf.com/docs)

## 合并后的建议顺序

1. **补 PDF 交付功能**：页码、水印、裁剪/A4 适配、2/4 页拼版、提取文字。沿用当前工作台与离线资源策略；每一项都用实际导出文件回读验证。
2. **补扫描件工作流**：双面重排、空白页识别、签名图片、视觉对比；新增图片裁剪、水印、手动打码，连通图片处理后转 PDF。
3. **做一项重能力原型**：优先评估中文 OCR 或保留结构的 PDF 压缩，不同时承诺两条完整引擎。Office 格式互转、PDF 正文编辑、证书签名、自动抠图和 AI 放大均不列入首轮。
4. **再扩独立工具类目**：二维码、文本比较、JSON/CSV、编码与文件校验。有使用反馈再确定次序。

产品交互可借鉴 iLovePDF 的连续工作流，但首版只保留当前文档并顺序执行已实现操作，例如“合并 → 页码 → 水印 → 导出”，无需先建通用流程编排器。[官方工作流入口](https://www.ilovepdf.com/)
