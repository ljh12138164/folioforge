# OCR / 压缩：最终 Web 验证

2026-10-24。用户在上一轮方案验证后要求“全部实现”，本批补齐剩余 PDF 的 OCR 和压缩产品入口。验收仅 Web，不运行 Electron。

## 检查结果

- `rtk pnpm check`：三个包检查通过。
- `rtk pnpm --filter @pixelforge/web build`：生产静态构建通过；离线资源 253 项，版本 `3c71ae4978d4dabe`。
- `PLAYWRIGHT_CHANNEL=msedge pnpm --filter @pixelforge/web test`：28 项单元测试、30 项浏览器测试全部通过，浏览器回归约 1.6 分钟。本次为干净完整通过，无跳过或失败后拼接结果。
- 新增 `compression.test.ts` 与 `test/pdf-heavy.spec.mjs`；四个新增 Web 用例执行真实 OCR / PDF 导出和回读，旧有 26 个浏览器用例回归通过。

## 功能与证据

- 空白文字层的本地合成扫描 PDF，Canvas 生成大字 `PIXELFORGE LOCAL OCR` / `你好世界 中文测试`，浏览器真实识别；不是 mock 文本或仅检查下载存在。
- 首次联网缓存应用、core 与模型，关闭联网后冷重载，首次运行 OCR 的 TXT 和可搜索 PDF，未请求外部域名。TXT 中英文字精确匹配；生成 PDF 的中文可提取，英文基线坐标在预期原页位置，可见页大小仍为 400×500 pt。
- 已有文字页不重新识别、不重复叠加；按当前页范围导出指定页面。21 页 OCR 被明确阻止；初始化期间取消，忙碌状态退出且没有结果下载。
- 阻断模型请求，OCR 明确报错且不产生下载；恢复请求后相同页面重试成功。
- 矢量文档对象重存输出小于输入且原文字保留；扫描件降采样须显式勾选损失，输出为可渲染图片 PDF，无原文字层。
- 合成带噪声扫描件本轮为 2,889,100 → 115,657 bytes，约节省 96%；这是故意构造夹具，不是典型压缩率宣传。矢量文档栅格化变大时自动提供原字节，测试逐字节相等。
- 两种 PDF 结果的首页在原生预览 dialog 中由 PDF.js 实际渲染；输出预览替换时释放渲染缓存。原工作区与编辑历史不被压缩结果覆盖。
- 资源准备锁定 Tesseract.js/core 7.0.0，三种 LSTM core 分支和 fast 中英文模型；模型提交与 SHA-256 在脚本中固定，许可同源分发。初始化、加载模型和识别均由可终止的原生 Worker 管理，版本协议有注释和真实浏览器回归覆盖。

## 最终截图

两轮截图。第一轮检查六张新功能截图；第二轮完整回归捕获下列八张，逐一打开检查有效性、文字、控件与边界，没有水平溢出：

- `ocr-desktop.png`：1440px，TXT 识别完成、中文搜索命中。
- `mobile.png`：390px，PDF 输出与设置下移。
- `user-310.png`：310px，十四模式三列五行、末行两项。
- `ocr-dark.png`：1440px，深色可搜索 PDF 结果。
- `compress-desktop.png`：1440px，损失确认、实际字节与结果下载。
- `compress-310.png`：310px，压缩设置和结果完整显示。
- `ocr-output.png`：1440px，实际输出首页预览，中英文扫描内容可见。
- `compress-output.png`：1320px，实际降采样输出首页预览，人工噪声仍可见。

预览 dialog 截图是文档顶部的 full-page 捕获；原生 backdrop 覆盖可视窗口，窗口以下的页面仍是全页截图的一部分。它不代表 backdrop 在可视窗口内中断。合成大字、噪声均为测试内容，无新增生成式栅格素材。

本轮沿用既有 Operate 表面和 DESIGN.md，没有 approved comp 或系统改版。单次检测 PdfApp.tsx、DocumentTools.tsx、pdf.css、ToolsHome.tsx，detector 结果 `[]`。独立审阅另见 finish-review.md。

## 边界

OCR 20 页/批、单页 3000px/400 万像素，图片重建不保留原矢量与链接。重存优化不保证缩小；有损扫描件降采样移除文字与结构。真实 iOS/Android 的峰值内存、复杂中文样本准确率、多阅读器兼容性与任意 PDF 的结构保真未做广泛评测，不将一次清晰合成样本成功等同于这些保证。产品没有完整正文编辑或通用对象图像优化引擎。实现说明见 docs/PDF-OCR-COMPRESSION.md。
