# 双面扫描重排验证

日期：2026-10-24，Windows / Edge，生产静态预览 http://127.0.0.1:43188/ 。

- `pnpm --filter @pixelforge/web test:unit`：24 项通过。新增实际 PDF 回读验证正反交错、旋转、页数不等、输入引用不被修改及全部页面保留。
- `pnpm check`：三个包通过。
- `pnpm --filter @pixelforge/web build`：生产静态构建通过，241 项离线资源，版本 352d25a0bf47ee4e。
- `PLAYWRIGHT_CHANNEL=msedge pnpm --filter @pixelforge/web exec playwright test test/pdf-duplex.spec.mjs test/pdf.spec.mjs test/pdf-extensions.spec.mjs --reporter=line`：13 项通过，含新增 3 项及原有 PDF 回归。
- 新增浏览器场景：单文档页数分界校验、真正导出页序回读、撤销重做、两份文件交错、切换正面文件、反转开关、正反数量不等不丢页、三个来源时拒绝双文件模式、离线冷重载后首次重排与下载。
- 工具目录搜索可打开新模式。桌面 1440px、390px、用户窄面板 310px、深色、应用成功、空任务截图各一张，保存在本目录，已逐一打开核对，无空白或未完成预览。手机没有横向溢出。
- 界面检测仅运行一次，结果 []，见 detector.json。
- 用户指定使用 Web 验证，本轮以以上浏览器结果验收。曾启动的 Electron 冒烟未完成并超时退出，不作为通过项；后续不继续桌面测试。

边界：测试采用带明确标记的本地合成 PDF；未宣称所有扫描仪/第三方 PDF 均兼容。重排分组按当前工作区顺序，重复应用会基于新页序计算。不会自动补空页、旋转背面或识别文字；原有静态 PDF 限制保留。示例是代码生成的文档内容，没有新增生成式图片资产。
