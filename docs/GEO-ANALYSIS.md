# FolioForge SEO / GEO 实施记录

日期：2026-10-25。正式 origin：`https://folioforge.ljhboard.cn`。验证对象为本机生产静态导出；本轮不包含 DNS、线上部署或搜索平台账户配置。

## 已完成

| 范围 | 实现与证据 |
| --- | --- |
| 页面元信息 | 首页、PDF、图片转换、图片示例、指南共 5 页有独立标题、描述、canonical、OG 和 Twitter 信息。工作台查询参数不形成额外 canonical URL。 |
| 抓取入口 | 静态生成 robots.txt、5 个 URL 的 sitemap.xml、llms.txt。站点地图只列实际页面，不加入查询组合或虚构更新时间。 |
| 结构化数据 | WebSite、WebPage、BreadcrumbList；PDF 与图片工作台额外提供 WebApplication。没有虚构评分、认证、作者或社交账户。 |
| 可读取正文 | 关闭 JavaScript 后仍可读取全部页面标题、介绍及指南。原页面已有静态正文，本次补充独立使用指南、内部链接和明确的支持限制。 |
| GEO 内容 | 指南包含产品定义、操作步骤、OCR 与文字提取区别、压缩代价、格式表、SVG 尺寸示例、离线条件、保存与统计说明。内容与现有实现对应。 |
| 分享与图片 | 1200×630 本地分享图、可抓取 SVG 图标；图片示例增加固有宽高，减少加载时布局变化。分享图由 Pillow 排版生成。 |
| 部署配置 | origin、index/noindex 和统计参数为构建时环境变量，纳入 Turbo 构建缓存键。预览配置输出 noindex 和空 sitemap，仍允许抓取 noindex 指令。 |
| Umami | 使用用户提供的实例和 Website ID；仅对应 HTTPS 正式主机加载，排除查询参数与片段，尊重 Do Not Track。工具不发送文件内容或自定义文件事件。 |

## 验证方法

- `pnpm --filter @pixelforge/web check`：TypeScript 通过。
- `pnpm --filter @pixelforge/web test:unit`：8 文件、37 用例通过，包含域名一致性、预览 noindex 和非法 origin 配置。
- `pnpm --filter @pixelforge/web build`：静态导出成功，PDF 离线清单成功生成。
- 完整 Playwright Web 回归：51 / 51 通过，包含原有 PDF、OCR、压缩、HEIC、SVG、图像对照、拖动排序与任务恢复。
- `test/seo.spec.mjs`：真实 Chromium 验证无 JS 正文、5 页唯一元信息与 JSON-LD、canonical、抓取资源、图片尺寸、指南链接、310px 布局，以及 Umami 本地禁用 / 正式域名启用 / 脚本故障不阻塞页面。正式域名通过本机构建映射，统计脚本使用拦截替身，避免污染实际数据。
- 实例脚本只读请求返回 HTTP 200；脚本包含 exclude-search、exclude-hash、do-not-track 配置支持。此请求不执行脚本、不发送访问事件。
- 已人工查看指南桌面、310px 手机及深色截图；Impeccable 检测器对指南、导航和样式未返回问题。截图和采集 JSON 保存在忽略的 `.seo-cache/`。

## GEO 与线上状态的边界

本机 robots 规则允许所有 crawler，未单独屏蔽 AI 抓取。llms.txt 已输出，属于补充机器可读介绍；Google 的 AI 搜索仍依赖正常索引和可用正文，没有额外文件或 Schema 能保证被引用。

GEO 总分及 Google AI / ChatGPT / Perplexity 分数：**未测量**。品牌外部提及、反向链接、真实搜索索引、AI 引用和线上 Core Web Vitals：**未测量**。没有使用任意内部打分代替这些实际结果。

正式地址本次只读访问返回连接重置，无法据此确认 DNS、TLS、线上页面、线上 robots 或线上统计收数。上线仍需将选定子域名指向托管服务、配置 HTTPS 和唯一域名重定向，部署完整产物，再检查站点地图与 canonical，向搜索平台提交 sitemap。统计代码已完成接入，实际收数需正式站部署后验证。

## 技能安装

使用 [AgriciDaniel/codex-seo](https://github.com/AgriciDaniel/codex-seo)，固定 `v1.9.6-codex.5`。保留已有 SEO 技能，补齐 23 个缺失子技能、共享资源与 24 个 agent 配置。核心 Python 环境校验 `core_ready=true`。可选 Python 浏览器、PDF 报告和 Google API 依赖未配置；本次浏览器验证使用项目已有 Playwright，不依赖这些可选服务。

## 主要参考

- [Google：AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- [Google：Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Umami：Tracker configuration](https://docs.umami.is/docs/tracker-configuration)
- [Umami：Collect data](https://docs.umami.is/docs/collect-data)
- 项目实际安装的 Next.js 文档：metadata、robots、sitemap、JSON-LD、静态导出和 Script。
