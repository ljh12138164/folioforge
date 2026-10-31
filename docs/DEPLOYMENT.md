# FolioForge 上线流程

> CI 与自动部署已恢复（`.github/workflows/web-deploy.yml`；桌面工作流仍暂停）。main 提交通过验证后，由 Actions 依次发布 PDF 站（`folioforge`，回环端口 18085）和图片站（`pixelforge`，回环端口 18087）。首次切换前，管理员必须按下文「升级服务器发布脚本」重新安装脚本与 SSH gate，否则图片站发布步骤会被旧 gate 拒绝。实际配置与历史发布记录见 [域名切换与上线记录](PRODUCTION-DOMAINS.md)；两个应用的部署边界见 [架构说明](ARCHITECTURE.md)。

正式地址：`https://pdf.ljhboard.cn`。参考本机 `D:/code/tool`、`D:/code/site` 和 `D:/code/nextra-blog` 的 CI / Docker / 受限 SSH 流程，适配本项目的 Next 静态导出、Rust WASM、OCR 资源和 PDF 离线更新。

## 发布路径

1. PR 与 main 提交执行 `Web CI and Deploy`：安装固定 Node / pnpm / Rust，检查类型、运行引擎与 Web 测试、生成静态导出。
2. 将 `apps/pdf-web/out/` 包装成 Nginx 镜像，标签为 `folioforge:sha-<完整提交 SHA>`。用真实容器检查 3 个页面、全部 PDF 离线资源、MIME、缓存、重定向和 404。图片应用单独构建、测试与验证镜像，部署边界见 [架构说明](ARCHITECTURE.md)。
3. 只有 main、验证通过且**仓库变量** `ENABLE_PRODUCTION_DEPLOY=true` 才进入 production 发布。默认不开启。部署任务从同一提交重建并再次验证镜像，避免依赖 GitHub artifact 存储配额；不发布浮动 latest。
4. 镜像经 gzip + SSH 直接导入服务器。SSH 密钥只允许调用指定发布命令，不接收任意 shell；不会把上传的脚本或 Compose 配置作为 root 安装执行。
5. 服务器只操作 `/opt/stacks/folioforge` 的独立 Compose 项目，检查容器健康与 `/release.txt` 提交号；失败恢复之前的镜像标签。首次发布失败则停止失败服务。
6. Action 检查正式 HTTPS 地址的页面、资源与提交号。若容器健康但公网检查失败，Action 报错，需要检查 DNS、TLS 或 CDN；不把外部路由错误当成容器失败自动反复切换。

桌面工作流仍为 `desktop.yml.disabled`。部署任务依次导入并验证 `folioforge` 与 `pixelforge` 两个镜像，最后检查 `https://pdf.ljhboard.cn` 与 `https://img.ljhboard.cn` 的提交号。

## 首次服务器准备

需要 Linux x86-64、Docker Engine + Compose 插件、Nginx、bash、gzip、curl 和 flock。CI 使用 Linux x86-64 镜像；ARM 服务器需要另外构建匹配架构。

为本服务预留 `127.0.0.1:18085`。参考项目分别使用 18080–18083，但这不能证明目标服务器上 18085 空闲；管理员先用 `ss -ltnp` 检查。该端口只绑定回环，由宿主 Nginx 提供 HTTPS，不开放到公网。这里不需要数据库、应用环境密钥或上传目录。

在服务器上，从审核后的仓库副本安装配置（以下是 Linux 命令）：

```bash
sudo install -d -m 755 /opt/stacks/folioforge
sudo install -m 644 compose.yaml /opt/stacks/folioforge/compose.yaml
sudo install -m 755 deploy/server/deploy-folioforge /usr/local/sbin/deploy-folioforge
sudo install -m 755 deploy/server/folioforge-deploy-gate /usr/local/bin/folioforge-deploy-gate
sudo visudo -cf deploy/server/folioforge-deploy.sudoers
sudo install -m 440 deploy/server/folioforge-deploy.sudoers /etc/sudoers.d/folioforge-deploy
```

创建独立 `folioforge-deploy` 系统用户，登录 shell 为 `/bin/sh`，不要加入 docker / sudo 组。将该项目专用公钥写入其 `~/.ssh/authorized_keys`，权限目录 700、文件 600，公钥行加上：

```text
restrict,command="/usr/local/bin/folioforge-deploy-gate" ssh-ed25519 <项目专用公钥>
```

该用户不能写 `/opt/stacks/folioforge`、发布脚本或 sudoers。服务器首次没有 `.env` 是正常状态，发布脚本会写入标签。不要手工创建 `IMAGE_TAG=latest`。

配置 `pdf.ljhboard.cn` 的 DNS、HTTPS 证书及宿主反向代理。`deploy/host-nginx.conf.example` 是独立域名证书的示例，需按实际证书位置修改；如果继续使用其他站点的 Cloudflare for SaaS 源站接入，先在现有平台配置该自定义主机名并验证适用的源站证书，不能直接假设博客证书覆盖新域名。用 `nginx -t` 验证后再重载，保留其他站点配置。

CDN 不应对 HTML、`/pdf-sw.js`、`/release.txt` 强制覆盖源站缓存规则，也不要将不存在的资源回退为 HTTP 200 首页。Umami 沿用客户端直连 `analytics.ljhboard.cn`，无需新增统计反向代理。

## 升级服务器发布脚本（恢复 CI 前一次性操作）

发布脚本现在接收 `deploy sha-<SHA> [image]`：省略产品参数发布 PDF 站（`/opt/stacks/folioforge`），`image` 发布图片站（`/opt/stacks/pixelforge`，使用 `compose.image.yaml` 安装的 `compose.yaml`，端口 18087）。两个站点使用各自的锁文件。由管理员从审核后的仓库副本重新安装；sudoers 现有规则 `sha-*` 已覆盖附加的 `image` 参数：

```bash
sudo install -m 755 deploy/server/deploy-folioforge /usr/local/sbin/deploy-folioforge
sudo install -m 755 deploy/server/folioforge-deploy-gate /usr/local/bin/folioforge-deploy-gate
sudo test -f /opt/stacks/pixelforge/compose.yaml
```n
不需要新增 SSH 密钥或用户；确认 `/opt/stacks/pixelforge/.env` 中的 `IMAGE_TAG` 为 `sha-<40位SHA>` 格式（当前手动发布使用的就是该格式）。

## GitHub 配置

仓库为 `ljh12138164/folioforge`，默认分支为 `main`。创建 `production` Environment，限制部署分支为 main。先设置下列配置，再打开发布开关。

| 位置 | 名称 | 内容 |
| --- | --- | --- |
| Repository variable | `ENABLE_PRODUCTION_DEPLOY` | 准备完毕后设为 `true`，停发时设为 `false` |
| production variable | `DEPLOY_HOST` | 目标服务器 SSH 主机 |
| production variable | `DEPLOY_PORT` | 默认 22 |
| production variable | `DEPLOY_USER` | 默认 `folioforge-deploy` |
| production secret | `DEPLOY_SSH_KEY` | 项目专用 SSH 私钥 |
| production secret | `DEPLOY_KNOWN_HOSTS` | 经可信渠道核对指纹后的服务器 known_hosts 行 |

不关闭主机密钥检查，不使用其他项目的私钥副本，不把私钥放进仓库。各应用的公开域名与 Umami ID 分别在应用内提供默认值，可通过对应应用目录的 `.env.local` 或构建环境覆盖；两个应用分别使用自己的 Umami ID。修改配置需要新的构建。公开预览构建应使用 `NEXT_PUBLIC_SITE_INDEXABLE=false`，本 production 流程固定为 true。新域名配置和当前准备情况见 [域名切换准备](PRODUCTION-DOMAINS.md)。

main 提交会触发验证；只有 `ENABLE_PRODUCTION_DEPLOY=true` 时才发布。相同 SHA 已经部署时会拒绝覆盖已有标签，需要发布新提交。

## 本地验证与镜像

```powershell
pnpm build:pdf
pnpm --filter @pixelforge/pdf-web test
# 把下面的 SHA 换为待发布的完整提交号。
docker build --build-arg RELEASE_SHA=<40位SHA> -t folioforge:sha-<40位SHA> .
node scripts/test-runtime-image.mjs folioforge:sha-<40位SHA> <40位SHA>
```

Dockerfile 只包装已构建的静态产物，不在镜像内再次运行 Node/Rust 构建。Nginx 1.30.6 Alpine 基础镜像固定 manifest digest，升级时需重新验证。Docker context 使用白名单，只包含静态导出及 Nginx 配置，排除源码、Git、`.env`、测试文件和本机任务。运行镜像中没有 Node 转换服务，文件仍由浏览器本地处理。

Linux 执行 `bash scripts/test-deploy.sh`，覆盖发布成功、更新失败自动回滚、错误镜像提交号、首次发布失败和受限 SSH 命令；它在临时目录使用 Docker/HTTP 替身，不操作正式服务。

### 首次上线与验证（2026-10-25）

- Actionlint 1.7.12：工作流通过；ShellCheck 0.11.0：发布、SSH gate 与故障测试脚本通过。
- `docker compose config --quiet`：通过；Node 脚本语法通过。
- 发布脚本故障测试：成功发布、容器启动失败回滚、健康检查失败回滚、提交号不匹配、首次发布失败和命令限制通过。测试隔离了 Docker、HTTP、sleep 和 flock；不代表实际容器和并发锁实测。
- 官方 Nginx Windows 1.30.6：使用生产配置，仅替换静态文件路径和测试端口，语法与 HTTP 验证通过，覆盖 5 个页面、256 个 PDF 离线资源、MIME、缓存、重定向、404。
- 北京 ECS i-2ze77shgsxr3nwn6ghra 已实际构建固定基础镜像，容器健康检查通过，运行目录 /opt/stacks/folioforge，回环端口 18085；18084 已由监控服务占用。首次由 Workbench 上传静态发布包进行服务器初始化。
- Cloudflare 新增代理 A 记录至北京 ECS，宿主 Nginx 复用已核对 SAN 覆盖 *.ljhboard.cn 的 Origin 证书；正式 HTTPS 的 5 个页面、256 个离线资源、MIME、缓存、重定向和 404 验证通过。
- pnpm check、37 个 Vitest 用例和 52 个 Playwright 用例通过。
- 已创建 GitHub production 环境，仅允许 main；已配置独立受限 SSH 用户、加密环境 secrets 和部署变量，并启用发布开关。SSH 公钥认证与拒绝任意命令已实测。后续正式版本由 Web CI and Deploy 执行，具体执行记录见 GitHub Actions。

## 缓存与更新

- `/_next/static/` 的哈希文件缓存一年并标记 immutable。
- HTML、SEO 文件、公开的非哈希资源要求重新验证；PDF Worker `.mjs` 和 WASM 使用正确 MIME。
- `/pdf-sw.js` 不长期缓存，`/release.txt` 禁止缓存；PDF 离线缓存版本继续由实际应用资源内容生成。
- 发布后保持旧镜像，确认稳定前不要执行镜像 prune。打开中的旧页面若恰好跨版本加载缺失资源，可刷新使用新版本；已经完成的 PDF 离线缓存仍可使用。

## 回滚

服务器更新失败会自动恢复 `.env` 中之前的 SHA，检查旧服务后退出非零，让 Action 显示失败。脚本保留 `.env.previous`。线上发现业务问题时，管理员可以在该项目目录恢复旧标签：

```bash
cd /opt/stacks/folioforge
sudo cp .env.previous .env
sudo docker compose up -d --remove-orphans web
curl -fsS http://127.0.0.1:18085/release.txt
```

确认旧提交与期望一致，再检查 HTTPS 站点。该操作只切换静态站版本，不涉及用户浏览器文件或其他 Compose 项目。修改发布脚本或 Compose 配置时，应再次审核并由管理员安装；常规镜像发布不会替换宿主配置。

## 依据

- [Docker Compose service 配置](https://docs.docker.com/reference/compose-file/services/)
- [GitHub 部署环境](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [Nginx 响应头继承](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
