# 两个独立产品，同仓维护

PDF 和图片转换各有自己的 Next.js 应用、首页、导航、指南、SEO 元数据、依赖、测试与静态产物。应用之间不互相导入代码。

```text
apps/
  pdf-web/         FolioForge · 页匠，PDF 工具
  image-web/       PixelForge，图片格式转换
  pdf-desktop/     FolioForge Electron 壳，只加载 pdf-web/out
  desktop/         PixelForge Electron 壳，只加载 image-web/out
packages/
  ui/              共享主题控件与基础样式
  image-engine/    图片转换 Worker 与调度协议
  heic-wasm/       HEIC 编码
  vectorizer-wasm/ SVG 描摹
```

| 边界 | PDF | 图片 |
| --- | --- | --- |
| 工作区包名 | `@pixelforge/pdf-web` | `@pixelforge/image-web` |
| 开发端口 | 43189 | 43187 |
| 静态预览端口 | 43190 | 43188 |
| 首页 | `/`，19 项 PDF 工具目录 | `/`，图片转换介绍与真实示例 |
| 工作台 | `/pdf/` | `/convert/` |
| 其他页面 | `/guide/` | `/images/`、`/guide/` |
| 静态产物 | `apps/pdf-web/out/` | `apps/image-web/out/` |
| 桌面协议 | `folioforge://app/` | `pixelforge://app/` |
| 正式地址默认值 | `https://pdf.ljhboard.cn` | `https://img.ljhboard.cn` |

图片转 PDF、PDF 转 PNG/JPG 归 PDF 产品，直接使用文档引擎及浏览器图像能力，无需图片转换引擎。

## 开发与验证

```powershell
pnpm install
pnpm dev:pdf
pnpm dev:image

pnpm build:pdf
pnpm build:image
pnpm preview:pdf
pnpm preview:image

pnpm check
pnpm test:unit
pnpm check:architecture --built
pnpm web:test
```

`pnpm dev` 同时启动两个 Web 应用，`pnpm build` 构建两个 Web 应用及依赖。单独构建 PDF 不运行 Rust / 图片 WASM 构建；单独构建图片不准备 PDF.js、OCR 模型与 PDF 离线缓存。各应用的 Vitest 缓存、Playwright 预览端口与输出目录独立。Electron 目录暂时从 pnpm 工作区排除，不参与安装、构建、检查和测试。

`check:architecture` 检查传递依赖与源码导入，防止业务功能重新交叉。加 `--built` 还检查两套静态产物中没有另一产品的页面与资源。

共享包只放主题、通用样式和可复用 UI；功能组件、业务状态与资源准备脚本放在所属应用中。PDF 样式保留在 `pdf-web/src/styles.css`，图片样式保留在 `image-web/src/styles.css`。

## 配置与部署

每个应用有自己的 `.env.example`，在相同目录建立 `.env.local`。`NEXT_PUBLIC_SITE_URL`、索引开关和 Umami 配置分别在各自构建时读取。PDF 站点 `pdf.ljhboard.cn` 使用 Umami ID `350c6cc1-ffe6-4b67-bc0a-4a31831dd4e8`；图片站点 `img.ljhboard.cn` 使用 `69bf35a5-ccf1-4dca-b709-d128d73aa44f`。两者脚本均为 `https://analytics.ljhboard.cn/script.js`，仅在各自正式 HTTPS 主机名加载，预览与其他主机名不加载统计。

Dockerfile 通过 `WEB_APP` 选择一份已构建的静态产物：

```powershell
docker build --build-arg WEB_APP=pdf-web --build-arg RELEASE_SHA=<40位提交SHA> -t folioforge:sha-<SHA> .
docker build --build-arg WEB_APP=image-web --build-arg RELEASE_SHA=<40位提交SHA> -t pixelforge:sha-<SHA> .
```

PDF 沿用 `compose.yaml`、18085 端口和现有受限 SSH 发布流程。图片使用 `compose.image.yaml` 和 18087 端口，可单独部署。镜像 HTTP 验证分别使用：

```powershell
node scripts/test-runtime-image.mjs folioforge:sha-<SHA> <SHA> pdf
node scripts/test-runtime-image.mjs pixelforge:sha-<SHA> <SHA> image
```

当前两个 CI 工作流均暂停，配置保留为 `.github/workflows/desktop.yml.disabled` 和 `.github/workflows/web-deploy.yml.disabled`，GitHub 不会执行这两个文件。使用 `.disabled` 扩展名避免将整份注释的 YAML 当成无效工作流。恢复 CI 前先复核配置，再恢复 `.yml` 扩展名；Web 配置已适配两套独立产物。

两个新域名是构建配置默认值，需要完成 DNS 与站点配置后上线。当前准备记录见 [域名切换准备](PRODUCTION-DOMAINS.md)，仓库配置变更不代表已上线。

## 桌面端暂缓

先完成 Web 迁移。`apps/desktop` 与 `apps/pdf-desktop` 代码保留，均在 `pnpm-workspace.yaml` 中排除，根目录的 `desktop:*` 命令已经移除。桌面发布测试留在桌面目录，不再由 Web 测试运行。恢复桌面开发时再重新纳入工作区、补回命令并验证发布流程。

## 旧路径迁移

原 `apps/web` 已拆除；外部开发脚本需要将 `@pixelforge/web` 改为对应的 `@pixelforge/pdf-web` 或 `@pixelforge/image-web`。历史测试与研究文档中的旧路径描述当时状态，当前命令以本文件和 README 为准。

PDF 继续使用原站点路径；原聚合站的 `/convert/`、`/images/` 不再由 PDF 应用提供。图片上线后如需保留旧链接，应在原域名托管层将这两个路径及查询参数重定向到图片域名。
