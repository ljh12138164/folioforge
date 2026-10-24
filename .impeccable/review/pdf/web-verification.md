# Web 验证记录

验证日期：2026-10-24；生产静态构建，Windows Edge（Playwright msedge）与 Codex 内置浏览器。预览地址 http://127.0.0.1:43188/。

## 结果

- `pnpm check`：三个包检查通过。
- `pnpm --filter @pixelforge/web test:unit`：18 项通过，包含真实 PDF 页序、旋转与提取回读，以及损坏、加密、交互表单、超限文档的拒绝检查。
- `playwright test test/pdf.spec.mjs`：5 项通过。覆盖目录分类/搜索、合并/排序/旋转/删除/撤销重做、大图预览、页码范围、提取、拆分 ZIP、PNG 像素尺寸、JPG 文件头、真实 PNG 回转 A4 PDF、无效文件后继续导入。
- 离线测试：生产资源缓存完成后断网冷重载，再首次加载 PDF 处理与渲染引擎；合成示例、真实缩略图、PDF 导出、图片 ZIP 导出均通过。
- `playwright test test/tasks.spec.mjs test/parallel.spec.mjs`：原有图片 Web 流程 7 项通过，包含转换、并行、恢复、暂停、取消、故障与存储失败处理。
- `pnpm --filter @pixelforge/desktop test`：工具目录、原有图片示例、AVIF 与 ZIP 原生下载、协议及隔离回归通过。
- 生产构建通过，导出 `/`、`/images/`、`/convert/`、`/pdf/` 四条路由。

## 内置浏览器操作

从工具目录搜索「提取」，进入提取模式，导入三页合成示例；旋转第一页，输入无效范围 `0-9` 并看到具体校验信息；输入 `1,3` 生成两页 PDF，点击下载；切换 JPG，生成三页图片 ZIP 并点击下载。页面显示处理完成与离线资源已就绪。截图 `browser-tested.png` 保留真实操作后的结果卡。

## 响应式与设计

检查 1440px 桌面、390px 手机、310px 窄屏、深浅主题、PDF 预览弹窗；没有横向溢出。`detector.json` 无检测项。独立 UI 审阅结论为 `ship`，见 `finish-review.md`；此结论针对沿用既有视觉系统的功能扩展。

## 修复与边界

断网测试发现专用 Worker 位于 `/_next/static/`，原 `/pdf/` 作用域无法覆盖它；已把离线脚本改为根作用域 `/pdf-sw.js`，仍仅处理应用资源清单与 PDF 页面导航，并用冷重载测试验证。修复了全选改变后旧结果失效及 Worker 失败后再次请求悬挂的问题。

离线保证覆盖 PDF 工作台，目录和图片工具暂不保证离线。PDF 文档只在内存中，刷新关闭会清空。未验证 Safari、Firefox 或实际移动设备；不据响应式截图宣称这些浏览器已通过功能测试。未部署到外网。
