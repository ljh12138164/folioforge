# SVG 导出可行性调研

日期：2026-10-25。以下为实现前的调研记录；目前已接入 VTracer WASM 与 SVG 导出，实际实现和验收见文末。

## 结论

**可以实现真正的矢量 SVG 导出**。建议增加“图片矢量化”能力：复用 ImageMagick 的解码、旋转、缩放与 RGBA 提取，用 VTracer 在 Rust/WASM Worker 中描摹轮廓并生成 SVG 路径。输出适合图标、标志、线稿、色块插画；照片也能处理，但结果属于近似描摹，不能承诺无损、文件更小或保留可编辑文字。这些使用边界是根据算法的区域分割、曲线拟合和纯色图层输出推断，需用产品样本验收。[官方说明](https://github.com/visioncortex/vtracer/tree/1.0.0-alpha.4)、[SVG 输出源码](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/svg.rs)

## 当前为何显示不支持

`packages/image-engine/src/convert.ts::getCapabilities()` 明确令 SVG `write=false`。`src/index.ts` 则把 SVG 输入先经浏览器 `Image.decode()` 和 Canvas 栅格化为 PNG，因此现有链路不会保留原 SVG 的路径、文字、图层或滤镜结构。

本机隔离验证：直接调用当前安装的 `@imagemagick/magick-wasm`，把 16×16 红色位图写为 SVG，得到 **913 字节**文件；内容含 `<image>` 和 `data:image/png;base64`，没有 `<path>`。这是 SVG 容器内嵌位图，放大仍有像素，不能当成已实现矢量化。探针在被 Git 忽略的 `work/svg-research/probe.mjs`。ImageMagick 官方源码也区分 AutoTrace delegate 与回退的 PNG/base64 包装路径，格式表里的 RW 本身不足以证明当前 WASM 构建有轮廓描摹功能。[ImageMagick SVG coder](https://github.com/ImageMagick/ImageMagick/blob/7.1.2-34/coders/svg.c)、[官方格式表](https://imagemagick.org/formats/)

## 候选方案及精确版本

| 方案 | 核实结果 | 本项目适用性 |
| --- | --- | --- |
| VTracer Rust 核心 | 最新发布 `1.0.0-alpha.4`；最新稳定版 `0.6.5`；1.0 的 manifest 标注 `MIT OR Apache-2.0`，仓库保留 MIT 声明 | 优先候选；接入前固定精确版本并做真实 WASM 验证 |
| `@visioncortex/vtracer` | 同版本 Node 包以 wasm-bindgen 提供 `vectorize_rgba`，但外层 JS 使用 `require('fs')`，构建 target 是 nodejs | 可参考窄接口，不能直接把 Node 入口作为浏览器包 |
| Potrace | 官方为 GPL-2.0-or-later，也提供另一套商业许可；以黑白轮廓描摹为主 | 可选黑白模式，但没有必要为当前彩色离线工具优先引入 |

来源：[发布页](https://github.com/visioncortex/vtracer/releases/tag/1.0.0-alpha.4)、[crates.io 版本元数据](https://crates.io/api/v1/crates/vtracer)、[固定版本 Cargo workspace](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/Cargo.toml)、[MIT 文件](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/LICENSE)、[Node JS 入口](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/nodejs/index.js)、[Node 构建配置](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/nodejs/package.json)、[Potrace 官方](https://potrace.sourceforge.net/)。

## VTracer 接口与透明度边界

1.0 核心不解码文件，接口接收 `ColorImage { pixels, width, height }`，执行 `Config::default().build()?.to_svg(&img)` 返回 SVG 字符串。官方明确核心可编译为 `wasm32-unknown-unknown`；仓库已有 wasm-bindgen 的 RGBA 入口可作移植参考。可用黑白、色块、照片预设，以及颜色精度、去噪、曲线简化和路径精度等参数。现有 JPG 的“质量百分比”不能直接解释为 SVG 的画质。[核心 API](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/lib.rs)、[配置](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/config.rs)、[wasm-bindgen 包装](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/nodejs/src/lib.rs)

透明度不能笼统标为“完整保留”：该版本按采样启发式判断是否启用透明色键，只替换 alpha=0 的像素并丢弃该背景；SVG writer 写纯色 `fill`，没有逐形状 `fill-opacity`，也没有原始 PNG 的连续 alpha 通道。因此半透明阴影、抗锯齿边缘和少量透明孔洞必须单独处理、测试并明确结果。初版可以提供背景合成策略；如要承诺保留透明背景，需专门验证透明遮罩，不应仅依据输入支持 RGBA 就开启说明。[透明色键源码](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/frontend/keying.rs)、[聚类源码](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/frontend/color_cluster.rs)、[SVG writer](https://github.com/visioncortex/vtracer/blob/1.0.0-alpha.4/crates/vtracer/src/svg.rs)

## 推荐接入位置

- 在同一 Cargo/pnpm/Turborepo 工作区新增独立 `packages/vectorizer-wasm`；保持 HEIC 包专门负责 HEIC，沿用同版本 wasm-bindgen CLI 与资产打包方式。此处是方案建议，尚未创建该包。
- `convert.ts` 完成 autoOrient/缩放后，复用 `image.getPixels(...toByteArray(...,'RGBA'))` 传入矢量化器；得到 SVG UTF-8 字节、`image/svg+xml` MIME 和 `.svg` 文件名。仍通过现有队列、下载、ZIP 和本地任务保存链路处理。
- 预览必须渲染**实际生成的 SVG**。不要用原图缩略图冒充转换后结果。优先复用现有浏览器 `Image.decode()`→Canvas 的路径生成 PNG 对照缩略图；可在客户端收到 Worker 结果后补齐 `Conversion.after`。若尝试 ImageMagick/MSVG 回读，先验证当前 WASM 构建，不能假设存在 RSVG/Inkscape delegate。
- 用独立 SVG 设置表达“黑白 / 彩色、颜色数量或精度、去噪、平滑程度”，不要把 SVG 混成普通压缩格式。照片和复杂渐变可能产生大量路径，先设输入工作尺寸与输出路径/体积上限，再依据实测调整。

## 实现前后的验收条件

1. 编译并在真实浏览器运行固定版本 WASM，记录二进制体积、照片与线稿的耗时和内存；本文没有声称已完成 VTracer 的运行时验证。
2. XML 可解析、尺寸正确；非空普通图包含路径，且不依赖 `<image>`/base64、脚本、外部 URL 或外部字体。
3. 黑白线稿、彩色标志、孔洞、透明背景、半透明阴影、全透明图、1×1、小字截图、照片和大图均有样本；检查去噪误删细线、色块边界缝隙和尺寸失真。
4. 用浏览器或独立 SVG renderer 回读生成文件，对照真实输出；检查放大、单张下载、ZIP、刷新恢复、再导入转 PNG、取消、离线和移动端。
5. 若输入本来就是 SVG，需要保留其矢量结构，必须另建受约束的 SVG→SVG 处理路径；当前“先栅格化再描摹”无法恢复原始文字和图层。

## 首版实现与验收

已新增 `packages/vectorizer-wasm`，固定 `vtracer = 1.0.0-alpha.4` 和 `wasm-bindgen = 0.2.129`，接入同一 Cargo/pnpm/Turborepo 工作区及 CI。WASM 实测 261,193 字节，gzip 100,245 字节。许可证及依赖声明随 `/image-assets/VECTORIZER-LICENSE.txt` 分发。

图片引擎复用 ImageMagick 的解码、方向、尺寸和 RGBA 处理；SVG 分支调用 `vectorize_svg` 生成路径。浏览器重新渲染实际输出并生成 PNG 预览，沿用滑块对照、下载、ZIP、本标签页任务保存和恢复。图片工作台的“更多格式”及 `/convert/?format=SVG` 可进入；图片介绍页和工具目录更新为 16 种导出格式。

首版使用彩色图标、黑白线稿和照片描摹三个预设，不增加完整算法调参面板。为保证透明度行为可预测，透明与半透明区域统一先合成到所选背景色，黑白模式再转为黑色前景和白色背景。图标模式关闭小区域过滤以保留细线；最短边小于 3px 时使用像素折线，避免平滑拟合丢弃 1px 图像。黑白模式显式补上白底路径，因为上游二值描摹只输出黑色前景。

调整尺寸后的输入最多 400 万像素、单边最多 16384px，输出 SVG 最多 16 MiB；超限报错并提示调整最大宽高，不静默缩小。输出为近似描摹，不保留可编辑文字、原 SVG 图层、半透明或照片的逐像素细节，也不保证更小。

实际验证：

- `pnpm --filter @pixelforge/vectorizer-wasm test`：三个预设均生成路径且没有内嵌位图；验证 1×1、1×7、7×1、2×2、尺寸/像素数、缓冲长度、alpha 和非法模式。
- `pnpm --filter @pixelforge/image-engine test`：15 种位图格式独立回读，SVG 路径输出，以及 400 万像素拒绝、缩小后允许转换。
- `pnpm exec turbo run check --force`：7 个任务通过；生产构建通过。
- `PLAYWRIGHT_CHANNEL=chrome pnpm web:test`：同一轮 31 项 Vitest、41 项 Playwright 全部通过，浏览器阶段约 2.4 分钟。SVG 专项包括保留原 SVG 导入透明度、三种模式实际像素、真实照片、无内嵌位图、断网批量转换、ZIP 字节、刷新恢复、SVG→PNG、390/310px 无横向溢出。
- 桌面和移动端截图已目视检查；设计检测仅提示原有 CSS 字号建议，本次新增控件复用现有样式。

测试产物位于 `apps/web/work/test-results/`，SVG 专项另保留于 `apps/web/work/svg-implementation-results/`。本次未重新运行 Electron GUI/安装包或远端 GitHub Actions，Firefox/Safari 尚未验证。
