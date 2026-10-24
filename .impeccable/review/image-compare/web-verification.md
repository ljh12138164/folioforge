# 图片转换对照 Web 验收

2026-10-24，/convert/，生产静态构建，Microsoft Edge / Playwright。

- TypeScript 检查和生产构建通过；本地服务 http://127.0.0.1:43188/。
- 新增两个真实浏览器用例通过：真实原文件与 JPG 输出的像素尺寸、共享缩放/平移、Ctrl+滚轮、滑块鼠标/键盘、100% 与适应、原生全屏、310/390px 无横向溢出、深色主题。
- pointercancel、lostpointercapture、window blur 后释放手势，后续拖动恢复。QOI 实际编码后使用两侧引擎缩略预览，明确说明 100% 的预览像素边界；重新转换重置缩放及分界。
- 原图 2172×724、JPG 输出 800×267；实际原图 2.83 MB、输出 13.6 KB，显示减少 99.5%。不支持浏览器原生显示的格式不会冒充原图像素细节。
- 最终截图全部打开确认：desktop.png、detail-100.png、390.png、310.png、dark.png、fullscreen.png、fallback.png。两轮截图，中间集中修正窄屏工具栏与全局体积比例小数。
- 单次 detector 扫描 ImageComparison.tsx、image-comparison.css、App.tsx，无正则规则发现；这是源码正则扫描，未运行页面元素级 tiny-text / contrast 规则，不代表完整可访问性审计。
- 完整回归通过：28 单元测试、33 Web 测试（1.9 分钟），包含图片并行任务、持久化、ZIP 下载及 PDF 页面/OCR/压缩/离线回归；git diff --check 通过。

边界：没有运行 Electron 或实体触屏设备测试。设置仍需点击重新转换。未刷新用户原有 127.0.0.1 页面中的两张未保存图片；在独立 localhost 来源打开示例演示，不干扰原有队列锁。

## 内部拖动误导入回归

用户截图报告原图拖动触发上传遮罩。新增 image-drop.spec.mjs 使用真实鼠标拖动原图，在修复前稳定失败（期望无遮罩，实际出现一个）；修复后通过。页面内原生拖动被取消，导入层只响应 Files 类型，普通文本拖入不导入；外部双文件拖入仍准确新增两项。TypeScript、生产构建及相关 10 项 Web 测试通过（对照、拖放、并行转换、任务保存恢复），未刷新用户未保存任务。
