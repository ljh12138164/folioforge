# PixelForge

在本机处理 PDF 与图片的工具站，提供网页版和 Electron 桌面版。项目使用 Turborepo、pnpm、Next.js App Router 和 Tailwind CSS 4。

图片通过 Web Worker 调用 ImageMagick WASM 处理，无需上传。Next.js 只导出静态文件，不运行 API、数据库或转换后端。Electron 将页面、Worker 和 WASM 一起打包，通过本地协议加载，安装后可离线使用。

PDF 工作台使用 pdf-lib 处理页面、PDF.js 生成真实预览，字体、CMap、Worker 和解码器均随网站提供，不依赖 CDN。

## 开发与验证

需要 Node.js 22.18+（或 24+）和 pnpm 11.25。

```powershell
cd D:\code\pixelforge
pnpm install
pnpm dev
```

网页开发地址为 <http://127.0.0.1:43187>。

```powershell
pnpm check
pnpm test:unit
pnpm --filter @pixelforge/web exec playwright install chromium
pnpm web:test
pnpm test
pnpm build
pnpm --filter @pixelforge/web preview
```

生产静态预览地址为 <http://127.0.0.1:43188>。预览文件服务器仅用于本地查看产物。PDF 的离线缓存仅在生产构建启用，使用 `pnpm build` 后运行预览验证。

`pnpm test:unit` 使用 Vitest 验证调度上限、大图独占、内存策略、暂停、存储失败等待在途提交，以及引擎取消与故障隔离。`pnpm web:test` 先构建生产静态页面并运行 Vitest，再用 Playwright 在真实 Chromium 浏览器中验证转换、文件与 ZIP 下载、任务保存、暂停续跑、处理中刷新、浏览器关闭后恢复、多窗口互斥、取消、失败重试与存储写入失败，也覆盖实际并行、大图独占和模拟内存错误/引擎崩溃后的有限重试。失败时保存截图和 trace 到 `apps/web/work/test-results/`。如果本机已安装 Chrome，可设置环境变量 `PLAYWRIGHT_CHANNEL=chrome`，使用本机浏览器，无需下载测试版 Chromium。

`pnpm test` 包含上述 Web 测试、引擎测试和真实 Electron 窗口测试，因此需要桌面图形环境和 Playwright 浏览器。引擎测试包含 14 种格式的实际编码和 PNG 回读，以及透明通道、背景填色、元数据、尺寸限制、损坏文件和动图拒绝。桌面测试覆盖首页示例转换、设置传递、AVIF 转换、原生文件保存、ZIP 下载、本地协议和渲染器隔离。

PDF 测试覆盖真实文档合并、顺序与旋转回读、撤销重做、页码提取、拆分 ZIP、PNG/JPG 导出和图片转 PDF；还会在断网冷重载后首次加载处理引擎并导出结果，检查移动端、深浅主题和本地请求。可单独运行 `pnpm --filter @pixelforge/web exec playwright test test/pdf.spec.mjs`（需先构建）；已安装 Edge 的 Windows 可设置 `PLAYWRIGHT_CHANNEL=msedge`。

## Electron 桌面版

```powershell
pnpm desktop:start
pnpm desktop:test
pnpm desktop:package
pnpm --filter @pixelforge/desktop test:package
```

Windows x64 便携版输出在：

```text
apps/desktop/dist/PixelForge-win32-x64/PixelForge.exe
```

保留整个 `PixelForge-win32-x64` 文件夹，双击其中的 EXE 启动。当前已验证 Windows x64；尚未制作安装向导、应用签名或自动更新。

`.github/workflows/desktop.yml` 提供 Windows x64、macOS arm64 / x64、Ubuntu 24.04 x64 的构建、Web / 引擎 / Electron 测试和打包产物启动验证入口。当前未连接 Git remote，工作流尚未执行，macOS / Linux 仍待对应系统实际运行验证。

首次安装需要下载 Electron。如果 GitHub 下载失败，可按 Electron 支持的镜像配置重试：

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
pnpm desktop:start
pnpm desktop:package
```

桌面版使用 `pixelforge://app/` 加载随包资源，不启动本地 HTTP 服务。渲染器关闭 Node.js 集成，启用上下文隔离和沙箱；外部 HTTP(S) 请求与外部页面导航均被阻止。转换结果通过系统保存对话框下载。

## 页面与功能

- 首页 `/`：可搜索、按 PDF / 图片分类的工具目录，提供二十一个功能入口。
- PDF 工作台 `/pdf/`：页面合并、拆分、提取、旋转、排序、删除，PNG/JPG 与 PDF 互转。
- 图片介绍 `/images/`：真实示例转换、原图与结果对比、格式支持及使用说明。
- 图片工作台 `/convert/`：介绍页的格式、画质和尺寸通过查询参数带入；支持选择文件、拖放、粘贴和示例导入。
- 批量转换，每张图片分别显示结果或失败原因。
- 可选保存任务、源图片、参数和结果到本机；支持暂停、取消、刷新或重开后继续未完成任务、单独重试失败项。
- 画质、等比缩小、透明区域填色和元数据清理；移除元数据也会移除 ICC 色彩配置。
- 原图与实际编码结果对比；不能原生显示的格式转为 PNG 预览。
- 单张保存或 ZIP 批量下载，同名结果自动加后缀。
- 桌面与手机布局、键盘焦点和减少动态效果设置。

支持 14 种导出格式：JPG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、QOI、TGA、PSD、JPEG 2000、EXR。HEIC/HEIF 仅导入；SVG 仅导入并由浏览器栅格化。具体变体和损坏文件可能无法解码，页面会逐张提示。

图片工作台仅处理静态图片，拒绝动图和多页文件；PSD 仅读写合成图，不保留图层。单张上限 40 MiB、4800 万像素，尺寸输入为 1–16384px，ICO 最长边不超过 256px。不支持相机 RAW、PDF、SVG 矢量导出或位图矢量化，不承诺专业色彩、HDR 或高位深保真。PDF 请使用独立的 PDF 工作台。

默认仅保存在内存中。开启「保存任务到此设备」后，任务与图片通过 IndexedDB 保存到本地磁盘；清空、移除任务或关闭保存会删除对应磁盘副本。浏览器清除网站数据或回收存储仍可能导致丢失，请及时下载结果。不支持存储锁的浏览器仅提供内存模式；同一来源的工作台只允许一个窗口使用队列。

暂停会等待已开始的图片完成，取消会立即终止在途转换并取消剩余项。继续任务沿用原任务参数并保留完成结果，中断的单张图片需要从头处理；更改当前设置后可选择重新转换全部。网页关闭后停止执行，重开工作台后由用户继续。

转换根据设备情况采用 1–2 路，超过 800 万像素、超过 8 MiB 或不能确认尺寸的图片单独处理。内存或引擎错误会触发逐张处理及一次自动重试；普通损坏文件不会自动重试。并行基准和限制见 [PERFORMANCE.md](docs/PERFORMANCE.md)，可用 `pnpm web:bench` 复测。

ZIP 仍在内存中打包，大量图片建议分批处理。图片网页版首次加载需下载 WASM，图片工作台尚未配置完整离线缓存；Electron 的 WASM 已随应用打包。后续实施顺序、格式扩展和发布方案见 [ROADMAP.md](ROADMAP.md)。

## PDF 工作台与离线使用

多文件导入、真实缩略图和大图预览、拖拽及按钮排序、批量旋转/删除、最近 20 步撤销重做。可按当前排列后的页码选择范围（如 `1-3, 5`），生成合并或提取后的 PDF；拆分每页独立保存为 PDF ZIP；转图片支持 PNG/JPG、72/144/216 DPI ZIP。PNG/JPG 导入会居中放入 A4 页面。

支持添加页码（起始编号、位置、字号）、中文文字水印（本机字体生成透明图片）、按四边毫米数裁剪、横/纵向 A4 等比适配，以及 2/4 页拼版。选择处理范围后点击「应用到页面」，真实预览更新，可撤销、继续叠加处理，最后生成 PDF。拼版选中页时，结果插入第一个选中位置，其余未选页顺序不变。A4/拼版保留原矢量和可选文字，不保留页面链接、注释与结构标签。裁剪只调整可见区域，不能用于安全脱敏；水印本身不可选择或搜索，原正文仍可提取。

双面扫描重排支持当前页面按正面页数分成两段，或恰好两个来源文件交错。可切换正面文件、反转背面顺序；分组内沿用当前工作区页序。应用前显示新页序，数量不等时剩余页追加到末尾，不补空白页，不旋转页面。应用作用于全部页面，支持撤销重做；导出复用页面复制，不将内容转为位图。入口 `/pdf/?tool=duplex`。

空白页识别 `/pdf/?tool=blank` 以最长边 1200px 的可见渲染分析墨迹比例，提供三档灵敏度，并保留含现有文字层的页。只标记候选，不自动勾选或删除；用户预览、勾选后才删除，可撤销。浅色印章、扫描噪点或极细笔画可能影响候选结果，需人工确认；编辑后旧候选清空。

签名与图片 `/pdf/?tool=stamp` 支持鼠标/触控手写或上传 PNG/JPG，拖动定位、滑块调整位置与大小、旋转、不透明度；同一比例应用到全部或选中页，保持原有文字/矢量。图片最长边归一到 2048px，限制 5 MiB / 800 万像素。图片水印入口 `/pdf/?tool=stamp&stamp=watermark` 使用同一工具；推荐透明 PNG，JPG 白底保留。只添加外观图片，不是证书数字签名，不提供身份验证或防篡改。

视觉对比 `/pdf/?tool=compare` 支持两个当前来源同步翻页，滑块、透明叠加、左右并排；按可见尺寸保留比例居中对齐，页数不等明确提示缺页。比较各来源在工作区中的当前页序，不自动校正扫描偏移，不判断语义变化，不导出差异报告。预览最长边 1400px、每侧最多约 200 万像素，不修改文档。

PDF 调研清单与验收状态见 [交付清单](docs/PDF-CHECKLIST.md)。OCR `/pdf/?tool=ocr` 支持简体中文、英文、TXT 和可搜索 PDF；每批最多 20 页，手机建议 1–3 页。默认保留已有文字；识别页会重建为图片加文字层，原矢量、链接、注释和标签不保留。识别结果需人工核对。

压缩 `/pdf/?tool=compress` 支持保留页面内容的对象重存优化，以及有损扫描件 JPEG 降采样；可设 96/150/200 DPI 和画质。降采样会丢失可选文字、链接等内容，需先勾选确认。比较当前导出范围的真实 PDF 字节数，结果更大时保留原范围文件；结果可预览首页。两项实现说明与 Web 验证见 [OCR / 压缩交付](docs/PDF-OCR-COMPRESSION.md)，早期 [方案及独立实验](docs/PDF-OCR-COMPRESSION-VALIDATION.md) 保留供参考。

首次开发/生产构建会下载固定版本的中英文 fast 模型并验证 SHA-256，后续使用本地资源。Tesseract.js/core 锁定 7.0.0，同源托管 Worker、三种 LSTM core 分支和模型，附带许可证；生产离线缓存覆盖全部资产。清除站点数据后需要重新联网缓存。单页 OCR / 降采样限 3000px、400 万像素，实际 DPI 可能低于设置值。

文字提取复用 PDF.js，按页预览、搜索字面关键词、导出 UTF-8 TXT；该模式只读取已有文字，扫描页请使用独立 OCR 模式。多栏、表格、竖排或缺失字符映射可能影响提取顺序与结果。最多提取 500 万字符，每页界面预览 4000 字符；TXT 保留完整提取结果。处理与撤销后会清空旧搜索结果。实现前的方案与来源见 [技术调研](docs/PDF-IMPLEMENTATION-RESEARCH.md)。

单文件最多 40 MiB，任务总计 100 MiB、200 页；图片导出单页最长边 4096px、1200 万像素。仅支持静态 PDF，拒绝加密文档、交互表单和签名字段；不提供正文编辑、加密或内容脱敏。页面重组可能不保留书签、文档级附件。原件保持不变。

100 MiB 总量包含撤销/重做仍引用的来源与处理结果。不可达的旧来源及其渲染缓存会释放；超过限制时保留当前任务，提示下载后清空并分批处理。

首次联网打开生产版本 `/pdf/`，等待底部显示「离线资源已就绪」后，即可断网重新访问 `/pdf/`（包括 `?tool=split` 等入口）。构建生成 `/pdf-sw.js`，使用根作用域以覆盖专用 Worker，仅缓存构建清单中的应用资源与 PDF 页面，不缓存用户文档或请求内容。此离线保证仅覆盖 PDF 工作台；工具目录和图片工作台仍需联网打开。需要 HTTPS 或 localhost，不能直接双击 HTML。清除网站数据后需重新联网缓存。

PDF 任务只保存在当前页面内存中，刷新或关闭会丢失，离开前请下载结果；清空会释放任务和预览。与图片任务的可选 IndexedDB 保存相互独立。示例 PDF 由本地代码生成，并标为合成示例。

## 项目结构

```text
apps/web/
  src/tools/               工具目录与分类搜索
  src/pdf/                 PDF 处理、渲染、Worker 与离线状态
  src/Home.tsx              产品介绍与真实转换示例
  src/App.tsx               批量转换工作台
  src/task-store.ts         本地任务与结果存储
  src/task-runner.ts        并行调度与大图独占策略
  src/SiteHeader.tsx        共用导航
  src/app/                 Next.js 路由与元信息
  scripts/preview.mjs       静态产物预览
  scripts/prepare-pdf-assets.mjs  准备本地 PDF 资源
  scripts/build-pdf-offline.mjs   生成离线清单和 Service Worker
  test/pdf.spec.mjs         PDF 实际输出、断网与响应式测试
  test/tasks.spec.mjs       真实浏览器任务恢复测试
  test/parallel.spec.mjs    真实并行及故障恢复测试
  src/*.test.ts            Vitest 调度和引擎客户端测试
  bench/parallel.bench.mjs  1/2/4 路性能基准
apps/desktop/
  src/main.cjs             Electron 窗口、本地协议和保存对话框
  scripts/package.mjs      打包静态页面与桌面入口
  test/smoke.cjs           真实渲染器、转换和下载测试
packages/image-engine/
  src/convert.ts           转换逻辑
  src/worker.ts            WASM 初始化与消息处理
  src/index.ts             浏览器客户端与 SVG 栅格化
  test/smoke.ts            编码、回读与边界测试
```

Next.js 配置 `output: 'export'`，构建生成 `apps/web/out`。部署网页版时完整上传该目录，以 HTTP(S) 托管；`.wasm` 使用 `application/wasm`，`.mjs` 使用 JavaScript MIME，可开启 gzip/Brotli。`/pdf-sw.js` 建议禁用长期 HTTP 缓存，让新构建及时更新。当前按域名根路径部署，子路径需要同步调整 `basePath`、资源路径与离线缓存作用域。构建使用 webpack 打包跨 workspace 的 Worker 和 WASM。

## 设计记录

已本地安装并使用 [impeccable](https://github.com/pbakaus/impeccable)。先展示三个首页效果图及工作台效果图，用户选择 A「全幅转换对比」，再展示可点击页面并接入正式路由和 Electron。中文文案使用本地 humanizer-zh 技能润色。

效果图、选择记录、素材来源和实际页面截图位于 `.impeccable/`。自动设计引擎下载失败，本轮未执行其自动测量门禁，不能将人工截图复核视为自动审计通过。首页山景为 AI 生成的示例素材，生成记录见 `.impeccable/sample-landscape.provenance.json`。

ImageMagick WASM 的 LICENSE 和 NOTICE 随静态资源及桌面包保留于 `web/licenses/magick-wasm/`（网页源码对应 `apps/web/public/licenses/magick-wasm/`）。Electron 自带的许可证文件保留在便携目录中。

PDF.js 和 pdf-lib 的许可证在构建时复制到 `pdf-assets/`；该目录为生成资源，不提交到 Git。
