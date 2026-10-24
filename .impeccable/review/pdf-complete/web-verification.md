# PDF 清单收尾：Web 验证

2026-10-24，D:/code/pixelforge。按用户确认完成 PDF 清单；OCR / 压缩仅验证方案。不进行 Electron 验收。

## 构建与检查

- `rtk pnpm check`：三个包检查通过。
- `rtk pnpm --filter @pixelforge/web build`：静态生产构建通过，离线清单 241 个资源，版本 `357f32cef60fc30d`。
- `PLAYWRIGHT_CHANNEL=msedge pnpm --filter @pixelforge/web test`：27 项单元测试通过；完整 Web 回归 25 项通过，1 项在最后的撤销资源断言因测试误用 PDFDict.size() 报错。修正为 keys().length 后，以相同浏览器专项重跑签名用例，通过（1/1）。共 26 项浏览器用例已验证通过，产品构建未改变。
- 此前新增测试试跑还修正了 PDF.js loadingTask.destroy() 的清理调用；两个修正均为测试 API 用法，没有跳过断言或改变产品行为。

## 实际功能证据

- 空白页：合成白页、灰白页、已有文字、微小黑标、全黑页、浅红印章；文字层保护、灵敏度、候选预览、不自动勾选/删除、显式删除与撤销、实际导出回读。
- 外观签名 / 图片水印：手写指针轨迹、清空、无效图片反馈；PNG 图片定位、宽度与透明度；四种页面旋转、非零 CropBox 与 UserUnit=2 的输出红色像素中心回读在页面 80%/80%；原有文字保留；撤销导出后无图片 XObject。
- 视觉对比：不同尺寸以同一可见尺度渲染、同步翻页、滑块裁切、透明叠加、并排、同来源拒绝与缺页提示。
- 生产资源缓存后的离线冷重载，首次执行空白检测、图片应用与 PDF 导出、双来源对比，未请求外部来源。
- 旧有图片转换/任务恢复、PDF 整理导出、页码/中文水印、裁剪/A4/拼版、文字提取和双面重排回归通过。

## 界面证据

两轮截图，第一轮批量修正窄屏对比工具栏换行及过高页面预览，第二轮截图逐一打开核对。最终文件：

- blank-desktop.png：1440px，空白候选未勾选状态。
- stamp-desktop.png：1440px，图片定位与原文档页面。
- mobile.png：390px，设置移至页面工作区下方。
- user-310.png：310px，十二种模式三列四行，无水平溢出。
- stamp-dark.png：1440px，深色界面与白色文档表面。
- compare-desktop.png：1440px，滑块对比第三页。
- compare-overlay.png：1440px，透明叠加第三页。
- compare-side.png：1440px，左右并排第三页。
- compare-310.png：310px，并排视图窄屏上下排列，翻页与文件按钮可读。

夹具中的空白页、全黑页、红色矩形和倒置文字均是代码生成的测试内容，不是加载异常或真实用户签名。没有新增生成式栅格素材。没有批准效果图：本轮为现有 Operate 表面的代码扩展，沿用 DESIGN.md，不修改设计系统。

当前批次仅运行一次 Impeccable detector，目标 PdfApp.tsx / StampTools.tsx / PdfCompare.tsx / pdf.css / ToolsHome.tsx，结果 `[]`，见 detector.json。

## 调研边界

OCR 仅核查了官方版本、资源、离线加载路径与后续验收条件；没有运行中文 OCR。压缩以独立脚本完成合成夹具实验，结果不能外推真实文件。报告：docs/PDF-OCR-COMPRESSION-VALIDATION.md；清单：docs/PDF-CHECKLIST.md。两项均未作为产品入口发布。
