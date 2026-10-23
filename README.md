# PixelForge

在本机转换图片格式，提供网页版和 Electron 桌面版。项目使用 Turborepo、pnpm、Next.js App Router 和 Tailwind CSS 4。

图片通过 Web Worker 调用 ImageMagick WASM 处理，无需上传。Next.js 只导出静态文件，不运行 API、数据库或转换后端。Electron 将页面、Worker 和 WASM 一起打包，通过本地协议加载，安装后可离线使用。

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
pnpm test
pnpm build
pnpm --filter @pixelforge/web preview
```

生产静态预览地址为 <http://127.0.0.1:43188>。预览文件服务器仅用于本地查看产物。

`pnpm test` 会先构建网页，再测试真实 Electron 窗口，因此需要桌面图形环境。引擎测试包含 14 种格式的实际编码和 PNG 回读，以及透明通道、背景填色、元数据、尺寸限制、损坏文件和动图拒绝。桌面测试覆盖首页示例转换、设置传递、AVIF 转换、原生文件保存、ZIP 下载、本地协议和渲染器隔离。

## Electron 桌面版

```powershell
pnpm desktop:start
pnpm desktop:test
pnpm desktop:package
```

Windows x64 便携版输出在：

```text
apps/desktop/dist/PixelForge-win32-x64/PixelForge.exe
```

保留整个 `PixelForge-win32-x64` 文件夹，双击其中的 EXE 启动。当前已验证 Windows x64；尚未制作安装向导、应用签名或自动更新。

首次安装需要下载 Electron。如果 GitHub 下载失败，可按 Electron 支持的镜像配置重试：

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
pnpm desktop:start
pnpm desktop:package
```

桌面版使用 `pixelforge://app/` 加载随包资源，不启动本地 HTTP 服务。渲染器关闭 Node.js 集成，启用上下文隔离和沙箱；外部 HTTP(S) 请求与外部页面导航均被阻止。转换结果通过系统保存对话框下载。

## 页面与功能

- 首页 `/`：产品介绍、真实示例转换、原图与结果对比、格式支持及使用说明。
- 工作台 `/convert/`：首页的格式、画质和尺寸通过查询参数带入；支持选择文件、拖放、粘贴和示例导入。
- 批量转换，每张图片分别显示结果或失败原因。
- 画质、等比缩小、透明区域填色和元数据清理；移除元数据也会移除 ICC 色彩配置。
- 原图与实际编码结果对比；不能原生显示的格式转为 PNG 预览。
- 单张保存或 ZIP 批量下载，同名结果自动加后缀。
- 桌面与手机布局、键盘焦点和减少动态效果设置。

支持 14 种导出格式：JPG、PNG、WebP、AVIF、GIF、TIFF、BMP、ICO、JPEG XL、QOI、TGA、PSD、JPEG 2000、EXR。HEIC/HEIF 仅导入；SVG 仅导入并由浏览器栅格化。具体变体和损坏文件可能无法解码，页面会逐张提示。

仅处理静态图片，拒绝动图和多页文件；PSD 仅读写合成图，不保留图层。单张上限 40 MiB、4800 万像素，尺寸输入为 1–16384px，ICO 最长边不超过 256px。不支持相机 RAW、PDF、SVG 矢量导出或位图矢量化，不承诺专业色彩、HDR 或高位深保真。

队列和结果保存在内存中，刷新或关闭即清空，请先下载结果。转换按队列串行执行，ZIP 在内存中打包，大量图片建议分批处理。网页版首次加载需下载 WASM，尚未配置 Service Worker 离线安装；Electron 的 WASM 已随应用打包。

## 项目结构

```text
apps/web/
  src/Home.tsx              产品介绍与真实转换示例
  src/App.tsx               批量转换工作台
  src/SiteHeader.tsx        共用导航
  src/app/                 Next.js 路由与元信息
  scripts/preview.mjs       静态产物预览
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

Next.js 配置 `output: 'export'`，构建生成 `apps/web/out`。部署网页版时完整上传该目录，以 HTTP(S) 托管；`.wasm` 使用 `application/wasm`，可开启 gzip/Brotli。当前按域名根路径部署，子路径需要同步调整 `basePath` 与资源路径。构建使用 webpack 打包跨 workspace 的 Worker 和 WASM。

## 设计记录

已本地安装并使用 [impeccable](https://github.com/pbakaus/impeccable)。先展示三个首页效果图及工作台效果图，用户选择 A「全幅转换对比」，再展示可点击页面并接入正式路由和 Electron。中文文案使用本地 humanizer-zh 技能润色。

效果图、选择记录、素材来源和实际页面截图位于 `.impeccable/`。自动设计引擎下载失败，本轮未执行其自动测量门禁，不能将人工截图复核视为自动审计通过。首页山景为 AI 生成的示例素材，生成记录见 `.impeccable/sample-landscape.provenance.json`。

ImageMagick WASM 的 LICENSE 和 NOTICE 随静态资源及桌面包保留于 `web/licenses/magick-wasm/`（网页源码对应 `apps/web/public/licenses/magick-wasm/`）。Electron 自带的许可证文件保留在便携目录中。
