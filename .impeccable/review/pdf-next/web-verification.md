# PDF 扩展验证

2026-10-24，Windows / Edge，生产静态站 http://127.0.0.1:43188/ 。实现前技术依据：docs/PDF-IMPLEMENTATION-RESEARCH.md。

- `pnpm --filter @pixelforge/web build`：通过，4 个业务静态路由，241 项离线资源。
- `pnpm check`：3 个包通过。
- `pnpm --filter @pixelforge/web test:unit`：23 项通过。
- `PLAYWRIGHT_CHANNEL=msedge pnpm --filter @pixelforge/web exec playwright test test/pdf.spec.mjs test/pdf-extensions.spec.mjs --reporter=line`：10 项通过。
- `pnpm --filter @pixelforge/desktop test`：通过实际 WebP/AVIF 转换、设置传递、原生下载/ZIP、安全源与外部请求阻断。
- `PLAYWRIGHT_CHANNEL=msedge pnpm --filter @pixelforge/web exec playwright test test/tasks.spec.mjs test/parallel.spec.mjs --reporter=line`：原有图片任务与并发回归 7 项通过；本轮浏览器验证合计 17 项。
- impeccable detect 对本轮 PDF/目录 UI 源文件扫描一次，结果 `[]`，见 detector.json。

真实 PDF 回读覆盖：四向旋转、非零 MediaBox/CropBox、UserUnit=2 时新增页码距可见底边为 16pt；中文水印实际像素可见且原正文仍能提取；连续盖印与撤销/重做恢复真实资源；过大裁剪原子失败；混合尺寸与空白页 A4 适配；2/4 页拼版页数及选中页面位置；TXT 页分隔、字面关键词、大小写匹配、扫描空页、编辑后清除陈旧文字。断网冷重载后首次应用中文水印、拼版和提取下载可用，监测到的请求仅同源 GET。

界面证据：desktop.png / dark-desktop.png（1440）、mobile.png（390）、user-310.png（用户窄面板宽度）、watermark-preview.png（1440×1000 弹层）、layout.png、text.png；目录截图 ../pdf/home-desktop.png、../pdf/home-mobile.png。截图从文档顶部采集，预览弹层保留当前视口，均逐一打开检查。最早一批全页截图在滚动位置采集导致粘性导航错误，已用有效截图覆盖，不作为证据。

测试范围与边界：合成夹具，不代表所有 PDF 兼容。图片水印不可选中/搜索；裁剪只隐藏边缘；A4/拼版不保留链接/注释/结构标签；文字提取无 OCR，复杂阅读顺序受原文档影响。未宣称性能基准或覆盖全部第三方 PDF 生成器。
