# PDF 扩展设计核对

日期：2026-10-24。结论：沿用既有视觉系统。本轮为页码、中文图片水印、裁剪、A4 适配、2/4 页拼版和文字提取/搜索的普通功能扩展。保留根目录 DESIGN.md，不生成 `.impeccable/design.json`；没有新增视觉方向或全局设计规则。此记录不修改应用代码。

## 已核对的证据

- 方向与产品：`PRODUCT.md`、`DESIGN.md`、`.impeccable/surfaces/pdf.md`；上一轮设计记录 `.impeccable/review/pdf/design-documentation.md` 仍保留。
- 实现：`apps/web/src/styles.css`、`apps/web/src/pdf/pdf.css`、`apps/web/src/pdf/EditTools.tsx`、`apps/web/src/pdf/PdfApp.tsx`、`apps/web/src/tools/ToolsHome.tsx`、`apps/web/src/tools/tools.css`。核对共用颜色与字体、字段和主按钮、页面选中/完成状态、文字搜索与预览，以及桌面和窄屏布局。
- 交付记录：本目录 `finish-review.md` 的 disposition 为 ship，`detector.json` 为 `[]`；`web-verification.md` 记录类型检查、构建、23 项单元测试、10 项真实浏览器测试、桌面测试与断网冷重载。本记录读取这些结果，未重新运行功能测试或 detector。
- 直接逐一打开九张截图：本目录 `desktop.png`、`dark-desktop.png`、`mobile.png`、`user-310.png`、`watermark-preview.png`、`layout.png`、`text.png`，以及 `../pdf/home-desktop.png`、`../pdf/home-mobile.png`。页面顶部、主题、设置分组、应用后的真实水印/拼版、搜索命中和 TXT 下载与源码相符；390px 和 310px 画面中设置下移、模式四列两行，内容没有可见横向截断。

## 五行系统摘要

1. 配色：共享浅灰绿画布、白色工作区、深绿主操作与选择、棕红错误色；深色主题沿用相同语义层级。搜索命中复用既有 warning 色，不另建色系。
2. 字体：沿用系统无衬线栈和 14px 正文、12px 辅助层级；PDF 标题为桌面 32px、窄屏 26px，新增字段为 12px、文字结果为 13px；数字信息使用等宽数字。
3. 布局规则：页面为主、设置为辅；PDF 右栏 324px，761–1040px 为 285px，760px 及以下下移。新设置沿用分组分隔线，成对数字字段并排；目录维持桌面双列、窄屏单列条目。
4. 控件规则：复用共享主按钮、描边与圆角、Lucide 线性图标、键盘焦点和禁用状态；绿色应用完成提示与生成/下载路径一致，处理可撤销，真实页面承担效果预览。
5. 内容与动态规则：实际文档为视觉主体；搜索结果按页排列并可打开原页，命中以语义色标记。短控件过渡与处理旋转图标遵循既有 reduced-motion 覆盖；不增加装饰性素材或动效。

## 保留的表面行为与素材事实

八种模式共用工作区和设置栏；添加页码、水印、裁剪/排版先应用到真实页面，再生成 PDF。文字模式以逐页文本替换缩略图区，保留页码、原页预览和下载状态。首页十四个已实现入口使用同一组行分隔条目，没有扩展成另一种卡片语言。

水印图片是用户文字在本机生成的文档内容，预览图片是实际 PDF 的渲染；PDF 示例由代码生成，文字结果可见 SYNTHETIC SAMPLE 标识。本轮没有新增生成式图片素材或需补充来源的装饰栅格。

## 未固化或修复的既有漂移

沿用上一轮已记录的差异：DESIGN.md 的 340px 设置栏说明与共用工作台 CSS 的 348px 不一致，且旧文档没有当前格式的 frontmatter；继承的径向渐变、等宽元数据字体和控件过渡比旧文档的纹理/字体/动态描述更宽。上一轮还记录了旧 design-extension.md 的过时颜色/标题/首页描述及缺少 sidecar。这些不是本轮批准的系统改版；保留原事实，不将其写成新的系统规则，也不在本次功能扩展中修补。PDF 的 324px 设置栏是已存在的表面尺寸，不改变全局规范。
