# PixelForge

同一仓库维护两个独立产品：**FolioForge · 页匠**负责 PDF，**PixelForge**负责图片转换。两个 Web 应用拥有独立首页、导航、依赖、构建、测试与部署产物。Electron 和 CI 暂停，先完成 Web 迁移；桌面代码保留但不参与工作区默认任务。完整边界见 [架构说明](docs/ARCHITECTURE.md)。项目使用 Turborepo、pnpm、Next.js App Router 和 Tailwind CSS 4。

图片通过 Web Worker 调用 ImageMagick WASM 处理，HEIC 输出和 SVG 路径描摹使用仓库内 Rust + wasm-bindgen 模块，无需上传。Next.js 只导出静态文件，不运行 API、数据库或转换后端。保留的 Electron 方案将页面、Worker 和 WASM 一起打包，通过本地协议加载；本轮暂停桌面开发。

PDF 工作台使用 pdf-lib 处理页面、PDF.js 生成真实预览，字体、CMap、Worker 和解码器均随网站提供，不依赖 CDN。

## 开发与验证

需要 Node.js 22.18+（或 24+）、pnpm 11.25 和 Rust（通过 rustup 安装）。`rust-toolchain.toml` 固定 Rust 1.97.1 与 `wasm32-unknown-unknown`；首次构建会安装匹配的 wasm-bindgen CLI 0.2.129。

```powershell
cd D:\code\pixelforge
pnpm install
pnpm dev        # 同时启动两个应用
pnpm dev:pdf    # 仅 PDF
pnpm dev:image  # 仅图片
```

图片开发地址为 <http://127.0.0.1:43187>，PDF 为 <http://127.0.0.1:43189>。

`packages/heic-wasm` 是同一 pnpm/Turborepo 工作区中的 Rust 包。`pnpm dev`、`pnpm build` 和 `pnpm check` 会先生成 WASM 与 JS/TS 绑定；直接运行 Web 的 dev/build 也会编译该包。可用 `pnpm --filter @pixelforge/heic-wasm build` 单独构建，`pnpm --filter @pixelforge/heic-wasm test` 用独立 ImageMagick 解码器验证输出、任意尺寸、画质与输入边界。生成文件在 `pkg/`，不提交 Git；Cargo.lock 固定 Rust 依赖。

`packages/vectorizer-wasm` 使用固定版本 VTracer `1.0.0-alpha.4`，同样随 Web dev/build 和 Turbo 依赖构建。`pnpm --filter @pixelforge/vectorizer-wasm test` 验证三种模式的真实路径和输入边界；浏览器 SVG 用例验证渲染像素、预览、下载、ZIP、刷新恢复与 SVG→PNG 回读。

```powershell
pnpm check
pnpm test:unit
pnpm --filter @pixelforge/image-web exec playwright install chromium
pnpm web:test
pnpm test
pnpm build
pnpm preview:image
pnpm preview:pdf
pnpm check:architecture --built
```

图片静态预览地址为 <http://127.0.0.1:43188>，PDF 为 <http://127.0.0.1:43190>。预览文件服务器仅用于本地查看产物。PDF 的离线缓存仅在生产构建启用，使用 `pnpm build` 后运行预览验证。

`pnpm test:unit` 使用 Vitest 验证调度上限、大图独占、内存策略、暂停、存储失败等待在途提交，以及引擎取消与故障隔离。`pnpm web:test` 先构建生产静态页面并运行 Vitest，再用 Playwright 在真实 Chromium 浏览器中验证转换、文件与 ZIP 下载、任务保存、暂停续跑、处理中刷新、浏览器关闭后恢复、多标签页独立保存与恢复、取消、失败重试与存储写入失败，也覆盖实际并行、大图独占和模拟内存错误/引擎崩溃后的有限重试。失败时保存截图和 trace 到 各应用的 `work/test-results/`。如果本机已安装 Chrome，可设置环境变量 `PLAYWRIGHT_CHANNEL=chrome`，使用本机浏览器，无需下载测试版 Chromium。

`pnpm test` 包含上述 Web 测试与引擎测试，因此需要 Playwright 浏览器。引擎测试包含 15 种位图格式的实际编码和 PNG 回读、SVG 真实路径输出，以及透明通道、背景填色、元数据、尺寸限制、损坏文件和动图拒绝。桌面测试覆盖首页示例转换、设置传递、AVIF 转换、原生文件保存、ZIP 下载、本地协议和渲染器隔离。

PDF 测试覆盖真实文档合并、顺序与旋转回读、撤销重做、页码提取、拆分 ZIP、PNG/JPG 导出和图片转 PDF；还会在断网冷重载后首次加载处理引擎并导出结果，检查移动端、深浅主题和本地请求。可单独运行 `pnpm --filter @pixelforge/pdf-web exec playwright test test/pdf.spec.mjs`（需先构建）；已安装 Edge 的 Windows 可设置 `PLAYWRIGHT_CHANNEL=msedge`。

## Electron 与 CI 暂停

当前先完成两个 Web 应用的迁移。`apps/desktop` 和 `apps/pdf-desktop` 保留代码，但从 pnpm 工作区排除，根目录暂不提供桌面构建、打包和测试命令。

两个工作流保留为 `.github/workflows/desktop.yml.disabled` 和 `.github/workflows/web-deploy.yml.disabled`，不触发 CI、Release 或自动生产部署。恢复前先复核配置，再恢复扩展名。历史桌面发布说明见 [Electron 版本与发布](docs/DESKTOP-RELEASE.md)。

## 页面与功能

- PDF 首页 `/`：可搜索的 19 项 PDF 工具目录。图片应用首页 `/`：图片格式介绍与真实转换示例。
- PDF 工作台 `/pdf/`：页面合并、拆分、提取、旋转、排序、删除，PNG/JPG 与 PDF 互转。
- 图片介绍 `/images/`：真实示例转换、原图与结果对比、格式支持及使用说明。
- 图片工作台 `/convert/`：介绍页的格式、画质和尺寸通过查询参数带入；支持选择文件、拖放、粘贴和示例导入。
- 批量转换，每张图片分别显示结果或失败原因。
- 可选保存任务、源图片、参数和结果到本机；支持暂停、取消、刷新或重开后继续未完成任务、单独重试失败项。
- 画质、等比缩小、透明区域填色和元数据清理；移除元数据也会移除 ICC 色彩配置。
- 原图与实际编码结果对比；不能原生显示的格式转为 PNG 预览。
- 单张保存或 ZIP 批量下载，同名结果自动加后缀。
- 桌面与手机布局、键盘焦点和减少动态效果设置。

支持 16 种导出格式：JPG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、QOI、TGA、PSD、JPEG 2000、EXR、HEIC、SVG。HEIC/HEIF 可导入；SVG 导入由浏览器栅格化，导出为 VTracer 生成的矢量路径。具体变体和损坏文件可能无法解码，页面会逐张提示。

HEIC 编码器使用 MIT 的 zvidlib 0.5.0 本地补丁版，输出单张 8-bit YUV 4:2:0 有损 HEVC/HEIF。透明区域按背景色填充，元数据始终移除，不保留 HDR、广色域、动画或辅助图像；质量 100 也不保证无损。纯 CPU 编码，大图耗时较长，可缩小尺寸或取消任务。完整 WASM 约 199 KB（gzip 约 81 KB）。来源、许可和浏览器移植取舍见 [调研记录](docs/HEIC-WASM-RESEARCH.md) 与 [补丁说明](packages/heic-wasm/vendor/README.md)。

生成的网站和桌面资源中包含 `/image-assets/HEIC-LICENSE.txt`，保留 HEIC 编码器、上游引擎和 JS 绑定的 MIT 声明。

SVG 提供彩色图标、黑白线稿、照片描摹三种模式。透明和半透明区域先合成到所选背景色，黑白模式再转为黑色前景和白色背景；文字成为轮廓，照片与渐变为近似描摹，不保证无损或体积更小。调整尺寸后的描摹输入最多 400 万像素，生成结果最多 16 MiB；超限需减小最大宽高。SVG→SVG 也会先栅格化再描摹，不保留原路径、文字、滤镜或图层。预览由浏览器重新渲染实际生成的 SVG。许可随 `/image-assets/VECTORIZER-LICENSE.txt` 分发。

图片工作台仅处理静态图片，拒绝动图和多页文件；PSD 仅读写合成图，不保留图层。单张上限 40 MiB、4800 万像素，尺寸输入为 1–16384px，ICO 最长边不超过 256px。不支持相机 RAW、PDF，不承诺专业色彩、HDR 或高位深保真。PDF 请使用独立的 PDF 工作台。

每个标签页的任务、参数与自动保存相互独立。新标签页从空白开始，刷新恢复当前标签页的任务；浏览器恢复原标签页身份时可读取对应的已保存任务。添加、转换、移除和清空只影响本标签页，复制标签页也会获得独立队列。旧版共享任务保留并由首次升级的标签页接续。浏览器清除网站数据或回收存储仍可能导致丢失，请及时下载结果；仅存储不可用时使用内存模式并提示刷新或关闭前下载。

暂停会等待已开始的图片完成，取消会立即终止在途转换并取消剩余项。继续任务沿用原任务参数并保留完成结果，中断的单张图片需要从头处理；更改当前设置后可选择重新转换全部。网页关闭后停止执行，重开工作台后由用户继续。

转换根据设备情况采用 1–2 路，超过 800 万像素、超过 8 MiB 或不能确认尺寸的图片单独处理。内存或引擎错误会触发逐张处理及一次自动重试；普通损坏文件不会自动重试。并行基准和限制见 [PERFORMANCE.md](docs/PERFORMANCE.md)，可用 `pnpm web:bench` 复测。

ZIP 仍在内存中打包，大量图片建议分批处理。图片网页版首次加载需下载 WASM，图片工作台尚未配置完整离线缓存；保留的 Electron 方案将 WASM 随应用打包。后续实施顺序、格式扩展和发布方案见 [ROADMAP.md](ROADMAP.md)。

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

PDF 任务只保存在当前页面内存中，刷新或关闭会丢失，离开前请下载结果；清空会释放任务和预览。图片应用的 IndexedDB 任务保存由其独立维护。示例 PDF 由本地代码生成，并标为合成示例。

## 项目结构

```text
apps/pdf-web/       PDF 首页、工作台、OCR、离线缓存和测试
apps/image-web/     图片首页、转换工作台、任务存储和测试
apps/pdf-desktop/   FolioForge 桌面壳，只打包 PDF 产物
apps/desktop/       PixelForge 桌面壳，只打包图片产物
packages/ui/       共享主题控件与通用样式
packages/image-engine/     图片 Worker、转换逻辑与客户端
packages/heic-wasm/        HEIC 编码
packages/vectorizer-wasm/  SVG 描摹
```

Next.js 配置 `output: 'export'`，分别生成 `apps/pdf-web/out/` 和 `apps/image-web/out/`。部署时选择对应产品并完整上传其目录，以 HTTP(S) 托管；`.wasm` 使用 `application/wasm`，`.mjs` 使用 JavaScript MIME，可开启 gzip/Brotli。`/pdf-sw.js` 建议禁用长期 HTTP 缓存，让新构建及时更新。当前按域名根路径部署，子路径需要同步调整 `basePath`、资源路径与离线缓存作用域。构建使用 webpack 打包跨 workspace 的 Worker 和 WASM。

## 正式域名、SEO 与访问统计

PDF 默认正式地址为 `https://pdf.ljhboard.cn`，图片为 `https://img.ljhboard.cn`（需单独配置 DNS 与托管）。部署时将该子域名的 DNS 指向静态托管服务、配置 HTTPS，并上传完整 对应应用的 `out/`；其他公开访问域名应在托管端重定向到正式地址。当前改动不包含 DNS 或线上部署。

仓库保留 Docker + 受限 SSH 上线配置，CI 与自动部署目前暂停，恢复步骤见 [部署、验证与回滚](docs/DEPLOYMENT.md)。`.github/workflows/web-deploy.yml.disabled` 恢复启用后会先验证 Web 与镜像，仅 main 且仓库变量 `ENABLE_PRODUCTION_DEPLOY=true` 时发布到 production。首次需要配置服务器、域名证书、专用 SSH 密钥和 GitHub 变量；Dockerfile 仅包装先前构建好的静态产物。

各应用目录中的 `.env.example` 列出构建时配置。可复制为该目录的 `.env.local`，或在 CI 设置同名环境变量；修改后必须重新构建。`NEXT_PUBLIC_SITE_URL` 必须是无子路径、查询参数的 HTTP(S) origin。公开预览环境设置 `NEXT_PUBLIC_SITE_INDEXABLE=false`，输出 `noindex, follow` 和空站点地图；本地预览本身不应公开暴露给搜索引擎。

两个应用的页面分别提供独立标题、描述、canonical、Open Graph / Twitter 分享信息和 JSON-LD；查询参数对应同一工作台的设置，canonical 不包含这些参数。`/guide/` 提供可直接抓取的操作步骤、格式限制、离线与隐私说明。构建还输出 `/robots.txt`、`/sitemap.xml`、`/llms.txt`、1200×630 分享图和 SVG 图标。静态托管需正确提供 XML、文本、SVG、PNG 和 WASM MIME。`llms.txt` 是补充说明，不保证搜索排名或 AI 引用。上线后可向搜索平台提交站点地图并检查实际抓取结果。

两个应用的 Umami 均使用 `https://analytics.ljhboard.cn/script.js`。PDF 的 Website ID 为 `350c6cc1-ffe6-4b67-bc0a-4a31831dd4e8`，图片为 `69bf35a5-ccf1-4dca-b709-d128d73aa44f`。脚本带 `defer`，在页面交互就绪后加载，仅在各自构建配置对应的 HTTPS 正式主机名启用；localhost、其他预览域名和 Electron 不加载统计。排除页面 URL 查询参数与片段，尊重浏览器 Do Not Track，不添加文件名、文件内容、OCR 文字或转换结果事件。统计服务加载失败不影响工具。将对应应用的 `NEXT_PUBLIC_UMAMI_WEBSITE_ID` 设置为空并重新构建即可关闭。部署 CSP 时按 Umami 实例配置放行对应的脚本与上报域名。

本轮实现与验证记录见 [SEO / GEO 记录](docs/GEO-ANALYSIS.md)。

## 设计记录

已本地安装并使用 [impeccable](https://github.com/pbakaus/impeccable)。先展示三个首页效果图及工作台效果图，用户选择 A「全幅转换对比」，再展示可点击页面并接入正式路由和 Electron。中文文案使用本地 humanizer-zh 技能润色。

效果图、选择记录、素材来源和实际页面截图位于 `.impeccable/`。自动设计引擎下载失败，本轮未执行其自动测量门禁，不能将人工截图复核视为自动审计通过。首页山景为 AI 生成的示例素材，生成记录见 `.impeccable/sample-landscape.provenance.json`。

ImageMagick WASM 的 LICENSE 和 NOTICE 随静态资源及桌面包保留于 `web/licenses/magick-wasm/`（网页源码对应 `apps/image-web/public/licenses/magick-wasm/`）。Electron 自带的许可证文件保留在便携目录中。

PDF.js 和 pdf-lib 的许可证在构建时复制到 `pdf-assets/`；该目录为生成资源，不提交到 Git。
