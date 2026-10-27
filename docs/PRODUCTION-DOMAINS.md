# 独立站点上线与 Umami 配置

2026-10-27（北京时间）：两套独立 Web 应用已上线。Electron 和 CI 保持暂停，合并 PR 不会触发已停用的工作流。

| 项目 | PDF | 图片 |
| --- | --- | --- |
| 正式地址 | `https://pdf.ljhboard.cn` | `https://img.ljhboard.cn` |
| 应用 | `apps/pdf-web` | `apps/image-web` |
| Umami Website ID | `350c6cc1-ffe6-4b67-bc0a-4a31831dd4e8` | `69bf35a5-ccf1-4dca-b709-d128d73aa44f` |
| 静态产物 | `apps/pdf-web/out/` | `apps/image-web/out/` |
| Compose | `compose.yaml` | `compose.image.yaml` |
| 源站回环端口 | `18085` | `18087` |
| 宿主配置模板 | `deploy/host-nginx.conf.example` | `deploy/host-nginx.image.conf.example` |

两个站点加载同一脚本 `https://analytics.ljhboard.cn/script.js`，使用独立 Website ID。脚本设置 `defer`，在 hydration 后加载，不阻塞工作台；只在对应正式 HTTPS 主机名启用，排除 URL 查询参数和片段，尊重 Do Not Track，不上传文件名、文件内容或转换结果。统计服务不可用时工作台仍可使用。

应用默认值、`.env.example`、canonical、Open Graph、JSON-LD、sitemap、robots、llms.txt、分享图和部署检查均已切换到新域名。构建环境如设置了旧的 `NEXT_PUBLIC_SITE_URL` 或 Umami ID，需要同步清除或覆盖；静态产物无法通过容器运行时变量修改这些配置。

## 实际发布

- 应用发布提交：`1590c56ecf189eb2fab6f0d0932ff0656d928b8e`。后续提交只补充 DNS 声明、部署检查的连接重试和上线记录，应用产物未变。
- PDF 镜像 `folioforge:sha-1590c56ecf189eb2fab6f0d0932ff0656d928b8e`，容器 `folioforge-web-1`，Compose 位于 `/opt/stacks/folioforge/compose.yaml`。
- 图片镜像 `pixelforge:sha-1590c56ecf189eb2fab6f0d0932ff0656d928b8e`，容器 `pixelforge-web-1`，Compose 位于 `/opt/stacks/pixelforge/compose.yaml`。两个容器均为 healthy。
- 已安装 `pdf.ljhboard.cn.conf`、`img.ljhboard.cn.conf` 和旧域名跳转配置到 `/www/server/panel/vhost/nginx/`。`nginx -t` 通过后完成平滑重载。
- Cloudflare 的两条代理 A 记录均已创建并回读确认，源站 `60.205.171.159`，自动 TTL。可复核的 DNS 声明见 `deploy/dns-records.json`。
- 旧域名 `folioforge.ljhboard.cn` 的 `/convert`、`/images` 路径 301 到图片站，其余路径 301 到 PDF 站，保留路径和查询参数。

本次通过 Workbench 上传已在本地真实 Docker 容器中验证的双镜像发布包。服务更新使用 `docker compose up -d --wait --wait-timeout 60 web` 等待健康检查，避免启动瞬间的连接重置被误判为发布失败。

发布包位于 `/tmp/folioforge-split-1590c56.tar.gz`，SHA-256 为 `5e38bf4e0638ff74f58c19a36cd02c5adee5012b6391e3a285d9868ac8f23ae3`，上传后在服务器核验一致。解包与备份目录为 `/opt/stacks/folioforge/releases/1590c56ecf189eb2fab6f0d0932ff0656d928b8e/`；保留 `pdf.env.before`、`pdf.compose.before.yaml`、`legacy.nginx.before.conf` 和旧镜像 `folioforge:sha-5a73431da2bc710468e5bf7e3d4b34d570d77bbe`。PDF 临时验证容器已清理。

### 公网验证

两个域名均经过正常证书校验访问 Cloudflare HTTPS，没有跳过公网 TLS 校验：

- PDF：3 个页面、249 个离线资源，以及 MIME、缓存、404、重定向、SEO 和 `/release.txt` 提交号全部通过。
- 图片：4 个页面、引擎许可证与示例资源，以及 MIME、缓存、404、重定向、SEO 和发布提交号全部通过。
- 在真实公网页面进行浏览器检查，两站 JavaScript 初始化、主题切换和各自 Umami ID 均正确。统计脚本请求被测试拦截，没有向 Umami 发送测试访问。
- 旧域名的 PDF、图片与转换路径跳转正确，查询参数保留。

复核命令：

```sh
node scripts/verify-deployment.mjs https://pdf.ljhboard.cn 1590c56ecf189eb2fab6f0d0932ff0656d928b8e pdf
node scripts/verify-deployment.mjs https://img.ljhboard.cn 1590c56ecf189eb2fab6f0d0932ff0656d928b8e image
```

本机直连 Cloudflare 曾出现连接重置和超时；通过本机已有 HTTP 代理完成 PDF 全量检查与浏览器检查。部署检查只对连接异常重试，HTTP 状态、资源、缓存或提交号错误仍立即失败。

## 本地验证

- `pnpm build`、`pnpm check` 和 `pnpm check:architecture --built` 通过。
- `pnpm test:unit`：43 项通过。
- 两个应用分别运行 `playwright test test/seo.spec.mjs`：共 16 项通过。覆盖新域名的 canonical、爬虫资源、统计脚本 URL、`defer` 和各自 Website ID；统计脚本被阻止时页面仍可交互；本地预览、另一产品域名与旧域名均不加载当前统计账号。

这些测试使用本地静态产物和模拟正式域名，没有向生产 Umami 发送访问数据。

## 上线前检查

以下是部署前的核对结果；实际变更以上面的发布记录为准。目标为北京 ECS `i-2ze77shgsxr3nwn6ghra`。

- 旧聚合站仍由 `/opt/stacks/folioforge` 的容器监听 `127.0.0.1:18085`，原域名为 `folioforge.ljhboard.cn`。
- `18087` 当前没有监听服务，`/opt/stacks/pixelforge` 不存在。
- 宿主 Nginx 主配置为 `/www/server/nginx/conf/nginx.conf`；站点配置目录为 `/www/server/panel/vhost/nginx/`。旧站配置为 `folioforge.ljhboard.cn.conf`，两个新域名配置均不存在。
- 当前源站证书 `/www/server/panel/vhost/cert/ai.ljhboard.cn/fullchain.pem` 的 SAN 包含 `*.ljhboard.cn` 和 `ljhboard.cn`，有效期至 2041-08-16，覆盖新域名。未读取私钥内容。
- Cloudflare 公共 DNS 查询中，两个新域名的 A 和 CNAME 查询均返回 NXDOMAIN。登录后的管理 API 查询也确认两个新域名均没有记录。
- Cloudflare CLI 已完成 OAuth 登录，`cf auth whoami` 确认 `authenticated: true`、`tokenValid: true`，具备 DNS 读取与编辑权限。
- 管理 API 确认 `ljhboard.cn` 区域为 active；旧站 `folioforge.ljhboard.cn` 为代理开启的 A 记录，真实源站地址为 `60.205.171.159`，TTL 为自动。尚未修改 DNS。

## 上线步骤

1. 保持两套独立构建，先验证静态导出和各自 Umami ID。构建与验证命令见架构说明。
2. Cloudflare 登录及源站核对已完成。新容器与宿主配置就绪后，创建 `pdf`、`img` 指向 `60.205.171.159` 的代理 A 记录，使用自动 TTL。不能把公共 DNS 返回的 Cloudflare 边缘 IP 当成源站 IP。
3. 分别上传验证后的静态产物或镜像，准备两个容器。PDF 使用现有 18085 端口；图片在独立 Compose 项目监听 18087。保留旧镜像用于回退。
4. 在宿主站点配置目录安装两份新域名配置，先运行 `/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf` 检查，再安排重载。使用现有 Cloudflare Origin CA 证书时，DNS 必须保持代理，并使用 Full (strict)。[Cloudflare Origin CA 官方说明](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)。
5. 分别运行公网验证：`node scripts/verify-deployment.mjs https://pdf.ljhboard.cn <SHA> pdf` 与 `node scripts/verify-deployment.mjs https://img.ljhboard.cn <SHA> image`，确认页面、资源、canonical、重定向与提交号。
6. 浏览器核对两个站点分别加载正确 Website ID，并到 Umami 确认访问数据。需要保留旧链接时，再单独安排旧域名 `/convert/`、`/images/` 到图片站点、其余路径到 PDF 站点的跳转，保留查询参数。

两个 `.yml.disabled` 工作流保持禁用。旧聚合域名已按 `deploy/host-nginx.legacy.conf.example` 保留路径和查询参数：`/convert`、`/images` 前往图片站，其余路径前往 PDF 站。

## 回滚本次 PDF 替换

需要恢复旧聚合站时，在服务器执行：

```sh
release=/opt/stacks/folioforge/releases/1590c56ecf189eb2fab6f0d0932ff0656d928b8e
cp -p "$release/pdf.env.before" /opt/stacks/folioforge/.env
cp -p "$release/pdf.compose.before.yaml" /opt/stacks/folioforge/compose.yaml
docker compose --project-directory /opt/stacks/folioforge up -d --wait --wait-timeout 60 web
cp -p "$release/legacy.nginx.before.conf" /www/server/panel/vhost/nginx/folioforge.ljhboard.cn.conf
/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf
/www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf
```

这会恢复旧域名的聚合站与原镜像；独立图片容器继续运行。新域名的 DNS 和 Nginx 配置应根据回滚范围单独调整。
