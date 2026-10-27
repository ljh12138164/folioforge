# 新域名与 Umami 配置

2026-10-27。用户已授权上线两套独立 Web 应用并创建 PR；Electron 和 CI 保持暂停。部署完成后在本文记录实际发布提交和公网验证结果。

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

## 本地验证

- `pnpm build`、`pnpm check` 和 `pnpm check:architecture --built` 通过。
- `pnpm test:unit`：43 项通过。
- 两个应用分别运行 `playwright test test/seo.spec.mjs`：共 16 项通过。覆盖新域名的 canonical、爬虫资源、统计脚本 URL、`defer` 和各自 Website ID；统计脚本被阻止时页面仍可交互；本地预览、另一产品域名与旧域名均不加载当前统计账号。

这些测试使用本地静态产物和模拟正式域名，没有向生产 Umami 发送访问数据。

## 现网只读检查

目标为北京 ECS `i-2ze77shgsxr3nwn6ghra`。

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

两个 `.yml.disabled` 工作流保持禁用。旧聚合域名按 `deploy/host-nginx.legacy.conf.example` 保留路径和查询参数：`/convert`、`/images` 前往图片站，其余路径前往 PDF 站。仅在两个新站点验证通过后启用。
