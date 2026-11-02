# 全功能回归记录

后续 Mac Intel、Linux 和 Docker 运行验证，以及本轮发现的 sitemap MIME 修复，见[跨平台补充报告](REGRESSION-2026-10-25-CROSS-PLATFORM.md)。以下保留首次 Windows 回归的范围和当时结论。

日期：2026-10-25（Asia/Shanghai）。代码版本：`50f7966d9acabeb03b8e9f64d4a5cc6639f3d0a2`。

本机 Windows x64 + 已安装 Chrome，使用新构建的生产静态页面和 Windows 打包产物。已有未提交的设计文件已备份，逐文件比较确认原有 109 个设计文件内容未被测试修改。

## 结论

本次覆盖的已实现功能全部通过，未发现回归缺陷；没有修改产品代码。该结论适用于以下测试范围，不表示所有平台、浏览器和任意用户文件均已验证。

## 实际执行

Web 测试环境变量为 `PLAYWRIGHT_CHANNEL=chrome`。全量测试和最终检查使用 `--force` 绕过 Turbo 结果缓存，未跳过或重试失败用例。

| 命令 / 阶段 | 结果 |
| --- | --- |
| `pnpm check --force` | 5 个工作区包的 TypeScript、Node 语法、Rust WASM 检查通过；含依赖构建共 7 个任务成功 |
| `pnpm test --force` | 含生产构建共 8 个任务成功，退出码 0，约 2 分 38 秒 |
| Vitest | 8 个文件、37 个用例通过 |
| Playwright / Chrome | 15 个文件、52 个用例通过，无跳过，约 2 分 12 秒 |
| 图片转换引擎 | 15 种位图实际编码、解码及 PNG 回读通过；SVG 真实路径与透明、背景、元数据、尺寸、坏文件、动图拒绝通过 |
| HEIC Rust WASM | 1×1、31×17、257×145，独立解码、质量比较和缓冲区 / 透明 / 尺寸 / 画质边界通过 |
| SVG Rust WASM | 彩色、黑白、照片三种模式产生实际路径；输入边界通过 |
| 桌面路径安全测试 | 3 个用例通过，覆盖编码路径穿越和 Windows / POSIX 分隔符 |
| Electron 源码模式 | 工具目录、PDF 缩略图、图片示例、AVIF、参数传递、原生下载、ZIP、安全沙箱与网络隔离通过 |
| `pnpm --filter @pixelforge/desktop package` | 从本轮静态产物重新打包 Windows x64 成功 |
| `pnpm --filter @pixelforge/desktop test:package` | 实际启动新打包 EXE，上述桌面 smoke 通过，退出码 0 |

## Web 覆盖范围

| 功能组 | 验证内容 |
| --- | --- |
| 工具目录与帮助 | 分类、搜索、功能入口、帮助导航、页头对齐 |
| 图片导入与对比 | 本地导入、外部拖放、站内拖图防重复导入、自动真实编码预览、体积与像素、缩放平移、键盘分割线、取消手势、全屏和预览回退 |
| 图片格式与下载 | HEIC 离线编码、SVG 导入和三模式描摹、真实预览、单文件及 ZIP 下载、导出后再次导入 |
| 并行与任务恢复 | 1–2 路、低内存串行、大图独占、引擎释放、内存错误及崩溃的有限重试、暂停 / 取消、处理中刷新、浏览器重开、多标签页独立队列、存储不可用与写入失败 |
| PDF 基础流程 | 合并、页序、旋转、选页、撤销重做、预览、提取、拆分 ZIP、PNG/JPG 导出、图片转 PDF、异常输入恢复 |
| PDF 排序 | 跨行动画、减少动画设置、键盘排序与取消、触控长按拖放、导出页序回读 |
| PDF 版面与标记 | 页码、中文水印、裁剪、A4、2/4 页拼版、选页顺序、旋转 / CropBox / UserUnit、签名图片和手写定位 |
| PDF 扫描与比较 | 双面重排、正反来源切换、不同页数、空白页候选保护与显式删除、双文档滑块 / 叠加 / 并排比较 |
| PDF 文字与 OCR | 已有文字提取、搜索、TXT 下载、离线中文 / 英文 OCR、可搜索 PDF 及文字坐标回读、已有文字保护、范围 / 页数限制、取消、模型加载失败后恢复 |
| PDF 压缩 | 矢量内容保留、真实扫描页降采样、内容损失确认、输出更大时回退、输出预览 |
| PDF 离线与更新 | 冷重载后首次加载引擎、离线导出、OCR 模型、标记及比较；联网重载取新页面、断网重载使用缓存 |
| SEO 与统计 | 无 JavaScript 的元数据及结构化数据、站点地图等资源、移动端帮助、localhost 不加载统计、模拟正式域名时统计成功或被阻止均不影响工具 |
| 响应式与主题 | 桌面、390px、310px、深浅主题；另人工查看本轮 310px 图片对比、PDF 桌面和 OCR 桌面截图，未见阻断操作的布局问题 |

## 验证边界

- 本轮没有重新测性能基准或给出新的提速倍数；并行调度和真实重叠转换已通过功能测试。
- 本机仅执行 Windows / Chrome / Electron，没有执行 Firefox、Safari 或其他系统的本机测试。
- 另只读核对了最新 [Desktop compatibility CI](https://github.com/ljh12138164/folioforge/actions/runs/40141869813)：版本 `058dfcd6cfc727d5f337673ca9c8f9427714de0e` 的 [macos-15 任务成功](https://github.com/ljh12138164/folioforge/actions/runs/40141869813/job/121015122468)；macos-15-intel、Ubuntu 和该次 Windows 任务取消，未完成测试。整体工作流为 cancelled，不能据此宣布整个跨平台矩阵通过；本轮没有重跑远程 CI。
- Docker Linux 引擎未运行，未做镜像运行回归。未访问或改动生产服务器，正式域名及 Umami 场景由本地请求模拟，不构成线上部署验收。
- ZIP 仍在内存打包；图片工作台完整 PWA / 离线安装仍未实现。PDF 工作台已有离线资源缓存，已实测通过。安装向导、签名、自动更新、动图 / 多页图片、RAW 和 PSD 图层保留仍按现有边界处理。
- PDF 任务目前仍只在页面内存中；刷新丢失是现有明确限制。图片任务的本机自动保存和独立标签页恢复已通过。
- OCR 使用合成中英文样本验证流程与坐标，不保证所有真实扫描件的识别准确率。

## 证据位置

- 全量日志：`work/regression-2026-10-25/full-test.log`。
- 全量退出码：`work/regression-2026-10-25/test-result.json`。
- 打包与启动日志：`work/regression-2026-10-25/packaged-test.log`。
- 打包退出码：`work/regression-2026-10-25/package-result.json`。
- CI 只读快照：`work/regression-2026-10-25/ci-history.json`、`ci-jobs.json`。
- Web 下载及截图：`apps/web/work/test-results/`，视觉矩阵在其 `visual/` 子目录。
- 桌面截图及下载：`apps/desktop/work/smoke/`、`apps/desktop/work/packaged-smoke/`。
- 新打包产物：`apps/desktop/dist/PixelForge-win32-x64/PixelForge.exe`。

`work/` 与打包目录均不纳入 Git；报告保留验证命令、版本和结论，日志及二进制保留在当前工作区。
