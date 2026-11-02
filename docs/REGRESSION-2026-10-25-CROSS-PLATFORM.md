# Mac Intel、Linux 和 Docker 补充验证

日期：2026-10-25（Asia/Shanghai）。本地基线为 `50f7966d9acabeb03b8e9f64d4a5cc6639f3d0a2`。

## 结论

本轮指定的三项验证全部通过。发现并修复了 Docker sitemap MIME 与既有测试要求不一致的问题；未发现图片 / PDF 功能或桌面运行回归缺陷。

| 目标 | 验证结果 |
| --- | --- |
| macOS 15 Intel x64 原生 CI | 37 个 Vitest、52 个 Playwright、3 个路径安全用例及 Electron / 打包 / 打包产物启动通过 |
| Ubuntu 24.04 x64 原生 CI | 37 个 Vitest、52 个 Playwright、3 个路径安全用例及 Electron / 打包 / 打包产物启动通过 |
| Docker Linux amd64 Nginx | 5 个页面、256 个离线资源、健康检查及 52 个浏览器用例通过；Linux 发布脚本隔离测试通过 |

## Docker 运行结果

已通过。Docker Desktop 的 Linux 引擎版本为 29.7.2，镜像平台为 `linux/amd64`。使用上一轮已构建和测试的生产静态产物，按仓库 Dockerfile 构建实际 Nginx 镜像，然后运行 HTTP 验收和完整浏览器回归。

```text
docker build --build-arg RELEASE_SHA=50f7966d9acabeb03b8e9f64d4a5cc6639f3d0a2 -t folioforge:regression-50f7966 .
node scripts/test-runtime-image.mjs folioforge:regression-50f7966 50f7966d9acabeb03b8e9f64d4a5cc6639f3d0a2
```

- 5 个页面及 256 个离线资源通过，包括 WASM / JS MIME、缓存头、sitemap、robots、llms、404、目录跳转、健康检查和版本号。
- Chrome 对运行中的 Docker 镜像执行全部 52 个 Playwright 用例，52 通过，0 跳过、0 重试、0 失败，约 130 秒。临时 Playwright 配置禁用了本地预览服务器，Docker 映射到测试使用的 `127.0.0.1:43188`。
- 功能覆盖图片转换、HEIC / SVG、并行与内存降级、任务保存及中断恢复、PDF 编辑、签名、对比、双面扫描、中文/英文 OCR、压缩、离线重新加载、移动布局及 SEO。
- 实际容器健康状态为 `healthy`，`nginx -t` 通过。测试结束后已删除本次临时容器，没有改动其他容器或生产部署。
- 在 Ubuntu 24.04 容器中执行 `bash scripts/test-deploy.sh` 通过，覆盖发布成功、启动/健康检查失败回滚、错误版本拒绝、首次发布失败清理及 SSH 命令限制。此测试使用隔离的 Docker/HTTP 命令替身，仓库只读挂载，只有测试工作目录可写。

第一次在 Docker 上执行浏览器回归时，51 个通过、1 个失败：Nginx 默认将 sitemap 返回为 `text/xml`，而本地预览和现有浏览器测试要求 `application/xml`。两者均为 XML 类型，但测试暴露了环境之间的差异。仅为 `/sitemap.xml` 添加明确的 MIME 映射，并将镜像 HTTP 验收的宽松 `/xml/` 断言收紧为 `application/xml`。收紧的验收在旧镜像上复现失败；修复后重建镜像，HTTP 验收与全部 52 个浏览器用例均通过。

最终镜像 ID：`sha256:0c30d95b0f156483fd96e14a997ebae44c181cc1fad7a0dbcb830bc081bf0839`。镜像包含上述尚未提交的 Nginx 修复，不能仅凭 `release.txt` 将它视为远端发布产物。

证据位于本地忽略目录 `work/regression-2026-10-25/`：

- `docker-runtime-http.log`
- `docker-browser-before-fix.log`、`docker-browser-before-fix.json`
- `docker-browser-test.log`、`docker-browser-after-fix.json`、`docker-browser-result.json`
- `docker-container.json`、`docker-nginx.log`

## Mac Intel 和 Linux 桌面

通过现有 [Desktop compatibility 工作流](https://github.com/ljh12138164/folioforge/actions/runs/40141869813) 的对应原生执行器重跑，包含检查、图片引擎、HEIC / SVG、生产构建、Vitest / Playwright、真实 Electron GUI、桌面打包和打包产物启动。

该工作流锁定的提交为 `058dfcd6cfc727d5f337673ca9c8f9427714de0e`；与本地基线的提交差异仅为 `LICENSE`，应用代码、测试和桌面工作流一致。本轮 Docker 的 Nginx MIME 修复不属于桌面运行路径。

Mac Intel 已通过：[macos-15-intel 任务](https://github.com/ljh12138164/folioforge/actions/runs/40141869813/job/121116174349)。图片引擎、HEIC / SVG、Web 构建及测试、Electron GUI、`PixelForge-darwin-x64` 打包和打包产物启动均成功。37 个 Vitest 及 52 个 Playwright 用例全部通过，浏览器用例约 4.6 分钟；路径安全检查 3 个通过。任务摘要及完整日志已保存至 `work/regression-2026-10-25/mac-intel-ci.json`。

CI 日志中存在虚拟执行器的 EGL 初始化提示及 macOS `.icns` 图标缺失提示，但实际 GUI 和打包产物功能检查均成功。签名、公证和发布资源完善仍属于单独的发布配套工作。

Linux 已通过：[ubuntu-24.04 任务](https://github.com/ljh12138164/folioforge/actions/runs/40141869813/job/121119509236)。37 个 Vitest、52 个 Playwright 用例全部通过，浏览器用例约 3.2 分钟；路径安全检查 3 个通过。在 Xvfb 中运行真实 Electron GUI，验证示例转换、PDF 页面预览、AVIF、参数交接、原生下载、ZIP、安全上下文、沙箱、路径穿越防护和外部网络拦截；`PixelForge-linux-x64` 打包后再次执行相同启动检查通过。Linux 沙箱辅助程序的权限配置步骤均成功。

Linux 日志有 CI 无桌面会话的 D-Bus 提示和依赖弃用提示，功能及打包产物断言均通过。任务摘要及完整日志保存在 `work/regression-2026-10-25/linux-ci.json`。

GitHub 不允许在同一工作流运行期间再单独重跑另一个任务，因此本轮先重跑 Mac Intel，再重跑 Linux。最终这两个目标任务均为 `success`；原工作流里未重跑的 Windows 任务仍为 `cancelled`，不能将整体工作流描述为全部绿色。Windows 的本机回归结果见[前一轮完整报告](REGRESSION-2026-10-25-FULL.md)。

## 边界

Docker 测试为 Linux Nginx 容器提供页面、Windows Chrome 执行浏览器场景；不能代替原生 Linux Electron 桌面测试。本次不覆盖 macOS 签名、公证、安装向导、自动更新或生产服务器部署。
