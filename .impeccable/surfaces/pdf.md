# PDF 工作台

模式：Operate。扩展已有 PixelForge；用户明确选择整合到 /pdf/，沿用相同 UI 技能和视觉系统。代码主导，不产生新品牌或效果图轮次；沿用现有工作台的页面区与右侧设置栏构图。

后续用户明确要求「搞成一个完整的工具站把先做离线 PDF 工具的东西」。首页因此成为工具检索入口，属于同一视觉系统的 Operate 目录；图片介绍迁至 /images/，图片转换保留 /convert/。目录只展示已实现的二十一个入口，不添加未实现的工具。本轮用户要求先调研实现方案，再扩展功能；依据 docs/PDF-IMPLEMENTATION-RESEARCH.md 扩展现有页面，不更换视觉系统。

THESIS: 用户直接看到与操作文档页面，完成本地整理及导出。

OWN-WORLD: 继承 DESIGN.md 和 styles.css 的浅灰绿底、白色工作区、深绿主操作、系统字体与深色主题，复用 SiteHeader 和 ThemePicker。

STORY: 导入 PDF/图片或真实生成的合成示例，操作缩略图、选择导出方式，生成并下载结果。

FIRST VIEWPORT: 品牌导航、任务标题、十四种工作模式；左侧文档工作区与右侧设置。空状态能直接导入或载入示例；有内容时缩略图真实渲染，文字/OCR 模式按页核对提取结果。窄屏工具按钮为三列五行，末行两项，设置下移。

FORM: 用户固定已有工作台构图，属于现有视觉系统的功能扩展，不发起新视觉方向抽签。桌面双栏，760px 以下设置下移。签名交互为实际页面重排与旋转，可撤销重做；键盘按钮覆盖拖拽功能。

范围：静态 PDF 页面合并、旋转、删除、提取、拆分；PNG/JPG 导入到 A4；PDF 转 PNG/JPG ZIP；页码、中文图片水印、四边裁剪、A4 适配、2/4 页拼版，以及文字提取、搜索与 TXT 导出。修改先应用到实际页面，支持连续处理及撤销；拼版选页结果放在首个选中位置。文字编辑后失效，搜索结果可打开原页预览。裁剪只隐藏内容，A4/拼版不保留链接和注释。首次联网完成生产资源缓存后可离线重新打开 /pdf/，包含中英文 OCR 与压缩。不保存用户文档，不接受加密或交互表单 PDF。示例明确标为合成素材。

验证：类型检查、PDF 回读、真实浏览器处理、断网冷重载、桌面/移动/深色截图；最后独立审阅和设计记录。

双面扫描扩展：新增第十五个工具目录入口 /pdf/?tool=duplex。当前页分段或恰好两个来源文件交错，设置在原右栏内展开；预览当前页码对应的新顺序。数量不等时剩余页追加，不补空白页；按当前页序分组，可反转背面但不旋转内容。应用仅重排全部页面引用，真实缩略图与撤销重做沿用现有行为。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

清单收尾范围：空白页先用文字层保护和渲染覆盖率筛出候选，用户复核后显式删除；外观签名支持手写与 PNG/JPG 上传、真实页面拖动定位、范围和透明度设置，并复用为图片水印；视觉对比支持两个来源同步翻页、滑块、叠加和并排，不提供语义差异或自动扫描对齐。全部沿用现有明暗主题和窄屏布局。

本轮追加范围：用户随后要求“全部实现”，将先前验证的 OCR 与压缩接入产品。OCR 提供中英文、TXT / 可搜索 PDF、页范围、已有文字保护、限制与取消；识别页重建丢失原矢量/链接，结果需核对。压缩提供对象重存优化与明确确认损失的扫描件降采样，显示真实字节对比、增大回退和结果首页预览。界面继续复用原设置分组、原生选择框/滑块/复选框和页面预览 dialog，不修改 DESIGN.md。最新事实及限制见 ../../docs/PDF-OCR-COMPRESSION.md，完整状态见 ../../docs/PDF-CHECKLIST.md；以下完成记录保留各历史批次当时范围。

完成记录：独立审阅为 ship；既有 DESIGN.md 予以保留，扩展核对记录见 ../review/pdf/design-documentation.md，Web 验证见 ../review/pdf/web-verification.md。本次 PDF 示例由代码生成，无新增生成式栅格素材。

本轮功能扩展完成记录（2026-10-24）：页码、中文图片水印、裁剪、A4 适配、2/4 页拼版和文字提取/搜索已按同一视觉系统核对；独立审阅 ../review/pdf-next/finish-review.md 为 ship，detector 结果为 []。本轮设计核对见 ../review/pdf-next/design-documentation.md，类型/构建、PDF 回读、浏览器、桌面和离线验证见 ../review/pdf-next/web-verification.md。已逐一查看七张本轮 PDF 截图及首页桌面/移动截图；保留根目录 DESIGN.md 与上一轮记录，不新增 sidecar，不修复既有漂移。无新增生成式栅格素材，PDF 示例仍由代码生成。

双面扫描扩展完成记录（2026-10-24）：两种来源、正面切换、背面反转、当前页码顺序预览、不等量余页保留、全部页面应用及撤销重做已按既有视觉系统核对。独立审阅 ../review/pdf-duplex/finish-review.md 为 ship，detector 为 []；设计记录见 ../review/pdf-duplex/design-documentation.md。Web 验证见 ../review/pdf-duplex/web-verification.md，记录 24 项单元测试、类型检查、生产构建及 13 项 Web 测试，含实际导出回读与离线冷重载；Electron 尝试超时，不计为通过，本轮按用户要求仅以 Web 验收。已逐一打开桌面、390px、310px、深色、应用成功和空任务六张截图；保留 DESIGN.md，不新增 sidecar，不修复既有漂移，无新增生成式栅格素材。

PDF 清单收尾完成记录（2026-10-24）：空白候选检测与显式复核删除、手写 / 图片外观签名、图片水印、同步视觉对比已按既有系统核对；首页十九个已实现入口，PDF 十二种模式。OCR / 压缩仍仅验证方案，未作为工具发布。独立审阅 ../review/pdf-complete/finish-review.md 为 ship，无 material_fixes，detector.json 为 []；设计核对见 ../review/pdf-complete/design-documentation.md，Web 证据见 ../review/pdf-complete/web-verification.md。已逐一打开本轮九张最终截图，覆盖桌面、390px、用户 310px、深色及滑块 / 叠加 / 并排对比；窄屏模式为三列四行，对比并排改上下排列。验证记录披露 27 项单元测试、类型检查、生产构建和共 26 项浏览器用例验证，含实际导出回读及离线冷启动；仅按 Web 验收。保留 DESIGN.md 与 sidecar 状态，不修复既有漂移，无新视觉世界或 approved comp，无新增生成式栅格素材；白 / 黑纸页、红矩形和倒置文字均为合成夹具内容。

OCR / 压缩产品化完成记录（2026-10-24）：用户要求“全部实现”后，OCR 中英文、TXT / 可搜索 PDF、已有文字保护、选页、限制、取消与同源模型离线，以及压缩重存 / 降采样、显式损失确认、实际字节比较、增大回退和输出首页预览均已交付。当前首页 21 个入口，PDF 14 种模式；窄屏三列五行、末行两项。独立审阅 ../review/pdf-heavy/finish-review.md 为 ship，material_fixes 为 none，detector.json 为 []；设计核对见 ../review/pdf-heavy/design-documentation.md，Web 证据见 ../review/pdf-heavy/web-verification.md，记录类型检查、生产构建及 28 项单元 / 30 项浏览器测试完整通过。已逐一打开该目录八张最终截图，覆盖桌面、390px、310px、深色和两类实际输出预览；原生 dialog 的 full-page 截图遮罩行为正常。保留 DESIGN.md 与 sidecar 状态，不修复既有漂移，无新世界或 approved comp，无新增生成式栅格素材；中英大字和噪声为合成扫描样本，不外推真实文档准确率或典型压缩率。本轮仅按 Web 验收，历史“仅验证”记录保留其当时范围。
