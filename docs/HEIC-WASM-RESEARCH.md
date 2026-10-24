# 浏览器 HEIC 编码：Rust / WebAssembly 调研

调研日期：2026-10-25。范围是给现有图片转换 Worker 补充 HEIC 输出；其他格式继续使用 ImageMagick。以下版本来自实际下载的 crates.io 发布包，不能用仓库主分支的 API 代替。

## 结论

选择 **MIT 许可的 `zvidlib-hevc-encoder = 0.5.0`**。它已经有真正的有损 HEVC Main、8-bit、4:2:0、帧内编码器。发布包在 crate 根部主动排除了 wasm32，需要在仓库内保存一个很小的、带来源说明的补丁版本，解除这个限制并禁用默认 `hardware` feature。然后由本项目编写单图 HEIF 封装器和窄接口。调研期间已完成隔离 WASM 原型与独立解码验证，初步结果见末尾；产品集成仍需验收。[发布包](https://static.crates.io/crates/zvidlib-hevc-encoder/zvidlib-hevc-encoder-0.5.0.crate)、[API 文档](https://docs.rs/zvidlib-hevc-encoder/0.5.0/zvidlib_hevc_encoder/)、[上游仓库](https://github.com/lsegal/zvidlib)

`still265 = 0.6.0` 的接口更完整，直接提供 HEIC 文件输出，但它是 **GPL-2.0-or-later**，README 明确说明包含从 x265 翻译的代码，并且编码路径存在无条件的 `std::time::Instant::now()`，不能把“纯 Rust”当作“已经支持浏览器”。本次优先选择 MIT 路径，不复制 still265 的封装器实现。[精确发布包](https://static.crates.io/crates/still265/still265-0.6.0.crate)、[文档](https://docs.rs/still265/latest/still265/)

## 候选版本与取舍

| 组件 | 检查版本 | 许可 / 结果 |
| --- | --- | --- |
| zvidlib-hevc-encoder | 0.5.0，Rust ≥ 1.85 | MIT；真正的有损编码；根模块排除 wasm32，需本地补丁；不提供 HEIF 文件封装 |
| zvidlib-hevc / hevc-syntax / color / core / build | 全部精确 0.5.0 | 发布包均标 MIT；与 encoder 配套；无 C 编解码器依赖 |
| still265 | 0.6.0，Rust ≥ 1.97 | GPL-2.0-or-later；HEIC 封装完整；存在浏览器时钟兼容性问题 |
| oxideav-h265 | 0.0.14 | MIT；公开编码入口仍是 PCM bootstrap，样本直接存储，不适合以压缩导出为目标的工具 |
| libheif + kvazaar | 本次检查官方主分支，未选定构建版本 | libheif LGPL-3.0-or-later；kvazaar BSD-3-Clause；是备选路线，需要 Emscripten/C/C++ 构建链 |

来源：[zvidlib encoder 发布源码](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/)、[同版本 HEVC](https://docs.rs/crate/zvidlib-hevc/0.5.0/source/)、[syntax](https://docs.rs/crate/zvidlib-hevc-syntax/0.5.0/source/)、[color](https://docs.rs/crate/zvidlib-color/0.5.0/source/)、[core](https://docs.rs/crate/zvidlib-core/0.5.0/source/)、[build](https://docs.rs/crate/zvidlib-build/0.5.0/source/)、[oxideav 文档](https://docs.rs/oxideav-h265/0.0.14/oxideav_h265/)、[libheif](https://github.com/strukturag/libheif)、[kvazaar 许可](https://github.com/ultravideo/kvazaar/blob/master/LICENSE)。

## zvidlib 的具体接口与浏览器边界

精确发布源码的 `src/engine/encoder/lossy.rs` 提供以下入口：

```rust
pub fn encode_idr_residual_au(
    y: &[u8], cb: &[u8], cr: &[u8],
    width: usize, height: usize, qp: i32,
) -> Result<(Vec<u8>, ReconstructedPicture), PcmEncodeError>
```

结果是含 VPS、SPS、PPS 和 IDR 的 Annex B 访问单元，另附编码器重建画面。QP 范围为 0..=51；QP 0 也不是无损保证。三个输入平面长度分别为 `width*height`、`width*height/4`、`width*height/4`。宽高必须为非零且为 16 的倍数。编码器只写 8-bit 4:2:0，固定 16×16 CTB。不要把现有 UI 的质量百分比直接当成 QP：质量越高应对应越低的 QP。[lossy.rs](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/engine/encoder/lossy.rs)、[pcm.rs](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/engine/encoder/pcm.rs)

`src/lib.rs` 的 `#![cfg(not(target_arch = "wasm32"))]` 是第一处明确障碍。解除后应直接调用上面的底层入口，避免浏览器使用面向操作系统的 factory。设置 `default-features = false`，不引入硬件编码依赖。它的底层模块是文档隐藏的内部 API，因此固定版本比使用宽泛的版本区间更稳妥。[lib.rs](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/lib.rs)、[Cargo.toml](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/Cargo.toml)

检查的配套依赖没有整 crate 的 wasm32 排除。`zvidlib-color` 已明确实现 wasm32 标量路径；`zvidlib-hevc` 的 profiling 在 wasm32 上返回禁用结果，不使用原生 `Instant`。编码生产路径中没有发现线程创建、文件系统或无条件时钟调用；检索到的编码器计时调用在测试/基准部分。这个静态检查不能替代运行测试。[color/lib.rs](https://docs.rs/crate/zvidlib-color/0.5.0/source/src/lib.rs)、[HEVC profile.rs](https://docs.rs/crate/zvidlib-hevc/0.5.0/source/src/engine/profile.rs)

发布源码合计约 3.65 MB（包含文档、测试源码及解码器），**不是最终 WASM 大小**。使用 release、LTO 和裁剪后必须测量实际产物。只链接编码入口，让链接器裁剪未使用的解码/视频 factory。源码尺寸不能推导浏览器编码速度。

输入透明像素先按现有背景色合成成不透明 RGB/RGBA；本次接口只编码一个彩色图像，不创建 HEIF alpha 辅助图。颜色转换可复用 `zvidlib_color::colorconv::{luma_row,chroma_row_pair}`，其系数是 BT.601 studio-swing，alpha 不参与颜色计算。对应 HEIF `colr/nclx` 应声明 **limited range、BT.601 matrix**；primaries 和 transfer 应按实际输入色彩空间填写，不能因为矩阵是 BT.601 就随意改写成 BT.709 matrix。[colorconv.rs](https://docs.rs/crate/zvidlib-color/0.5.0/source/src/colorconv.rs)

## HEVC 码流还需要 HEIF 封装

`.heic` 不是改文件扩展名后的 `.h265`。HEIF 使用 ISOBMFF boxes，静态图存为 item。`heic` 品牌允许 HEVC **Main 或 Main Still Picture**，因此 zvidlib 的 Main profile 单 IDR 是适用方向。[Nokia HEIF 技术说明](https://nokiatech.github.io/heif/technical.html)

建议只实现一个主图 item 的最小文件结构，暂时不做视频轨、缩略图或多图容器：

```text
ftyp  major=heic; compatible 包含 mif1 和 heic
meta  FullBox v0
  hdlr  handler_type=pict
  pitm  primary item ID=1
  iloc  item 1 -> mdat 中的 extent
  iinf
    infe v2  item ID=1; item_type=hvc1
  iprp
    ipco
      hvcC  HEVC 配置与 VPS/SPS/PPS
      ispe  编码后的宽高
      pixi  3 channels; 8/8/8 bits
      colr  nclx，匹配实际转换矩阵和范围
      clap  仅在补边时添加
    ipma  item 1 与上述 properties 的关联
mdat  每个 VCL NAL 之前写 4 字节大端长度
```

这是根据 item 模型和独立解码器读取要求整理的实现边界；box 的尺寸、版本、偏移及关联都必须测试，不能只验证 `ftyp` 字符串。[HEIF item 模型](https://nokiatech.github.io/heif/technical.html)、[libheif HEVC item 初始化](https://raw.githubusercontent.com/strukturag/libheif/master/libheif/image-items/hevc.cc)、[hvcC 读取布局](https://raw.githubusercontent.com/strukturag/libheif/master/libheif/codecs/hevc_boxes.cc)

zvidlib 发布包 `src/encoder.rs` 已有 `hvcc_box(annexb)` 和 `length_prefixed_vcl(annexb)` 两个 public、doc-hidden helper。后者保留 VCL NAL 并去掉 Annex B 起始码，用四字节长度替代。前者返回**包含 8 字节 box 头的整个 hvcC box**，不是只有 payload，外层不能重复套一次 box。[encoder.rs](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/encoder.rs)

**需要修正 hvcC helper 的固定 level。** 发布源码把 decoder configuration 的 `general_level_idc` 写为 30，而 SPS 的 `level_idc_for` 随图像尺寸改变：36,864、122,880、245,760 等像素对应不同级别。封装器应从实际 SPS 的 profile-tier-level 取得 profile、compatibility、constraint、level 等信息，或在严格固定配置下复用同一个级别计算；不要让普通照片的 hvcC 宣称 Level 1。实际解析 SPS 前需要去除 NAL header 与 emulation-prevention 字节。[helper](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/encoder.rs)、[SPS / PTL 写入](https://docs.rs/crate/zvidlib-hevc-encoder/0.5.0/source/src/engine/encoder/pcm.rs)

最小且完整的修复是复用 `collect_nal_units` 返回的 SPS `rbsp`：这个字段已经去除 NAL header 和 emulation-prevention。在本编码器固定的单层 SPS 中，第一个 RBSP 字节之后的 12 字节就是 general PTL，可将 `sps.rbsp[1..13]` 写入 hvcC payload `[1..13]`。`SeqParameterSet::parse` 能取得 level、尺寸和位深，但其 `ProfileTierLevel` 会跳过 compatibility/constraint，单靠结构体不能恢复完整 PTL。[NAL 解析](https://docs.rs/crate/zvidlib-hevc-syntax/0.5.0/source/src/nal.rs)、[SPS](https://docs.rs/crate/zvidlib-hevc-syntax/0.5.0/source/src/sps.rs)、[PTL parser](https://docs.rs/crate/zvidlib-hevc-syntax/0.5.0/source/src/vps.rs)

### 任意尺寸与补边

假设原图为 `W×H`，编码尺寸为 `CW=ceil(W/16)*16`、`CH=ceil(H/16)*16`。复制边缘像素填满右侧和底部，避免补黑产生边缘色差。SPS 没有 conformance window，因此将 `ispe` 设为 `CW×CH`，用 clean aperture 恢复原图范围：

```text
clap width   = W / 1
clap height  = H / 1
horizontal offset = (W - CW) / 2
vertical offset   = (H - CH) / 2
```

偏移分子是有符号 32 位数，分母是无符号正整数。`clap` 不是 FullBox；payload 为八个 32 位值。将它关联为 essential property。libheif 的 crop 逻辑使用图像中心和这些偏移计算左上角，这组值定位到 `(0,0)`。奇数尺寸必须单独验证，不能只测 16 的倍数。[libheif clean aperture 的读取和坐标定义](https://raw.githubusercontent.com/strukturag/libheif/master/libheif/box.cc)

## still265：为什么没有直接采用

0.6.0 可直接 `Image::from_rgb8(...)` → 可选 `subsample_to_420(1)` → `encode_heic(image,&encoder,qp,options)`；也支持 10/12-bit、metadata、orientation，但不编码 alpha、动画、lossless。其 `std` feature 并不把代码变成 no_std，默认 `rayon` 关闭。

这里有两项独立的移植工作：线程数读取失败后会回退 1，从而避开多数线程分支；**时钟则没有同样的保护**，`encoder/mod.rs::encode_inner` 开始就调用 `std::time::Instant::now()`，之后还有多处无条件 phase 计时。Rust 的 wasm32-unknown-unknown 标准库不能完整提供操作系统能力，线程创建会 panic；编译成功并不保证这种代码可运行。[精确源码](https://docs.rs/crate/still265/0.6.0/source/)、[Rust target 文档](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html)

另外，该库的 GPL 来源在发布 README 和 Cargo.toml 中已说明。不能把它作为 MIT 实现复制到本项目；若选择这条路径，需要按实际 GPL 依赖处理源码和分发声明。[发布包内 README / LICENSE](https://static.crates.io/crates/still265/still265-0.6.0.crate)

## libheif + kvazaar 备选

libheif 官方列出 kvazaar 为 HEVC 编码 backend，kvazaar 为 BSD-3-Clause；libheif 本身仍是 LGPL。该路线保留成熟容器实现，但本机只有 Rust 并不足以构建：需要 Emscripten 和 C/C++ 工具链，再编译/链接 kvazaar。官方 `build-emscripten.sh` 有 WASM 构建，但当前脚本默认准备 libde265 解码，不会自动准备 kvazaar 编码器，必须补充构建和配置。[libheif codec 清单](https://github.com/strukturag/libheif)、[libheif Emscripten 脚本](https://raw.githubusercontent.com/strukturag/libheif/master/build-emscripten.sh)、[kvazaar](https://github.com/ultravideo/kvazaar)

## 集成与验收边界

建议 Rust 模块只接收已经缩放、旋转和背景合成的 RGBA/尺寸/质量，返回 HEIC 字节；动态加载到现有转换 Worker，不在主线程执行同步编码。单线程 WASM 先跑通，可避免为了线程引入 SharedArrayBuffer 和跨源隔离要求。将同版本 wasm-bindgen CLI 与 Rust 依赖锁定，生成的 JS 与 WASM 要一同构建、缓存和部署。[wasm-bindgen 官方工具链](https://wasm-bindgen.github.io/wasm-bindgen/)

最低验收项目：

1. **Native 与 wasm32 编译**：固定依赖版本；禁用硬件 feature；WASM 导出函数真正存在。
2. **实际 WASM 执行**：至少编码小色块图和普通照片，记录耗时、文件大小、WASM 下载大小。
3. **独立解码**：用项目现有 ImageMagick/libheif 读取生成的 HEIC，检查宽高、可导出的像素和颜色。编码器自己的 reconstruction 或同源 decoder 不能单独作为互操作性证明。
4. **尺寸**：1×1、奇数尺寸、非 16 倍数、长图和常见照片；确认无补边泄漏、裁剪偏移和尺寸变化。
5. **颜色与质量**：灰阶、纯 RGB、透明输入背景合成；低/高质量产生实际可解码结果；确认颜色矩阵和 range 一致。
6. **产品行为**：导出 MIME 为 `image/heic`，扩展名为 `.heic`；下载/ZIP/预览链路工作；仍然离线处理。失败时报告实际失败原因，不能返回另一个格式并改后缀。

### 隔离原型的实测进展

实现代理在本机的隔离原型已报告：移除 encoder 根模块的 wasm32 排除后，成功编译并运行 wasm-bindgen 模块；`opt-level=s + LTO` 的初始原始 WASM 为 **160,157 bytes，约 156 KiB**。生成的单图 HEIC 通过 **ImageMagick 0.0.45 / libheif 独立解码**：16×16、31×17、320×192 红色图像的尺寸和颜色正确；31×17 验证了补边后的 clean aperture。320×192 纯色图在这台机器上的标量编码初测约 **535 ms**。

这些是本项目隔离原型结果，不是上游性能承诺；纯色图不能代表照片、文本截图或大图。最终 WASM 尺寸可能随绑定/错误处理改变。完整应用的上传、下载、ZIP、预览和复杂图像测试仍以随后生成的构建日志、浏览器测试和独立解码记录为准。

### 已完成的应用集成验证（2026-10-25）

- 新增 `packages/heic-wasm`，使用 Rust 1.97.1、wasm-bindgen/CLI 0.2.129；Cargo.lock 固定依赖，Turborepo 管理 WASM 构建及 Web 构建依赖。
- 正式模块 **199,213 bytes，gzip 81,122 bytes**。包含 RGBA 输入校验、边缘补齐、BT.601 studio-range 色彩转换和单图 HEIF 封装。hvcC 从 SPS 复制真实 PTL，不使用固定 level。
- Worker 启动时并行加载 ImageMagick 和该小型 WASM；初始化成功后才报告 HEIC 写入能力。ImageMagick 负责预处理和最终导出文件的独立回读，主线程不运行编码。
- `packages/heic-wasm/test/encode.mjs`：1×1、31×17、257×145 实际编码与独立解码；高低质量的体积和像素误差、红色色块、buffer/alpha/尺寸/质量边界通过。257×145 的编码尺寸超过 level 1 上限，另行检查 hvcC level。
- `packages/image-engine/test/smoke.ts`：15 种导出格式全部完成编码→解码→PNG；HEIC 透明区域按用户背景色合成，始终移除元数据，UI 明示这些边界。
- `apps/web/test/heic.spec.mjs`：真实 Chrome 通过 HEIC 链接选择、断网转换、对照预览、HEIC/ZIP 下载、刷新恢复、重新导入 HEIC 再导出 PNG。原有图片对照与拖放回归测试也通过。
- `pnpm check`、31 项 Vitest 与 Web 静态生产构建通过。本地未执行 Electron 测试；Windows/macOS/Linux CI 已补 Rust 安装与缓存步骤，远端结果需在推送后确认。
- `packages/heic-wasm/LICENSE.txt` 收录 zvidlib、OxideAV 来源与 MIT 声明及 wasm-bindgen 的 MIT 选项；Web/桌面静态产物同时携带 `/image-assets/HEIC-LICENSE.txt`。

当前边界是单张 8-bit 4:2:0 有损图像；不保留 alpha、元数据、HDR、辅助图像或动画，质量 100 不等于无损。大图 CPU 编码仍较慢，尚未承诺移动端或 Safari/系统原生看图器的兼容性与性能。
