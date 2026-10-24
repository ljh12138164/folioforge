# Web 完整回归记录

日期：2026-10-25。范围为当前工作区的图片/PDF Web 功能、Rust HEIC 编码器及桌面静态路径校验。使用 Windows 本机 Chrome 的独立测试上下文；不使用用户现有任务队列。

## 结果

| 检查 | 结果 |
| --- | --- |
| `pnpm exec turbo run check --force` | 5 个任务通过，无缓存跳过检查；Rust、TypeScript、桌面脚本语法检查通过 |
| `pnpm build` | 生产静态构建通过 |
| Vitest | 7 个文件、31 项通过 |
| Playwright 浏览器用例 | 分阶段覆盖 39 项：最新全量运行中 35 项非任务用例通过，最新任务用例 4 项补测全部通过；不是单轮 39 项全量通过 |
| 新增 SVG 实际转换用例 | 已包含在上述 35 项中；验证真实 SVG 导入、像素与透明度 |
| 图片引擎 smoke | 15 种格式编码→独立解码→PNG 全部通过 |
| Rust HEIC WASM | 1×1、31×17、257×145、颜色、画质/体积、输入校验、hvcC level 全部通过 |
| 桌面 asset-path 测试 | 3 项通过 |

## 覆盖范围

- 图片：HEIC 离线导出、预览、ZIP、任务恢复与 PNG 回读；真实输入/输出对照、缩放、平移、键盘分割线、全屏、移动端、拖放去重。
- SVG：31×17 含路径和透明区域的 SVG 实际导入并转 PNG；验证 PNG 尺寸、红色色块及透明像素；确认 SVG 没有被误开放为导出格式。
- 队列：实际并行、大图独占、低内存单任务、内存故障/引擎崩溃的有限重试、暂停续跑、转换中刷新、关闭浏览器恢复、多窗口临时工作区与持久化隔离、立即取消、存储失败与任务清理。
- PDF：合并、排序、旋转、选择、提取、拆分 ZIP、PNG/JPG 导出、图片转 PDF、撤销重做、页码、中文水印、裁剪、A4 适配、2/4 页拼版、文字提取/搜索/TXT。
- 扫描与比较：双面交错、空白候选检测、确认删除、不同旋转/UserUnit 下的图片签名、手写签名及定位、同步页面与多种视觉对比。
- OCR/压缩：真实中英文离线识别、TXT/可搜索 PDF、坐标、已有文字去重、范围/取消/模型失败恢复；矢量保留、扫描降采样、变大回退。
- Web 离线与界面：PDF 冷启动断网处理、页面版本更新、桌面/移动/窄屏/深浅主题、溢出检查及截图。

## 回归中修复的问题

首轮有 4 项在保存截图时失败，Windows 返回 `UNKNOWN: unknown error, open`，目标均为已有 `.impeccable/review/` 图片。没有修改功能断言或增加重试掩盖错误。

将 6 个截图测试文件的产物目录统一改为 `apps/web/work/test-results/visual/`。这也使成功用例的截图进入现有 CI 产物上传范围。保留了测试前的评审图片，再完整执行全部 35 项；4 项先前中断的用例和其余用例全部通过。

首轮诊断证据保存在忽略目录 `work/regression-20261025-first-run/`，最终 Web 产物在 `apps/web/work/test-results/`，新增 SVG 用例产物在 `apps/web/work/svg-test-results/`。

### 实时预览更新后的补充回归

测试期间图片工作台加入了实时预览及其新测试，因此重新构建并复测图片和任务队列。新测试暴露了实际缩放取整缺陷：请求 640px 最大宽度，输出可能为 639px；引擎级 320×180 → 最大宽度 159px 的新增用例同样复现为 158px。

修复 `convert.ts` 中重复等比适配的问题：用单一缩放比例计算最终整数尺寸，然后将计算结果直接交给 ImageMagick，避免其再执行一次边界适配。没有修改尺寸断言。新增 smoke 验证 159×89 的真实输出；实时预览用例还会检查下载字节、格式和真实图片宽度。

拖放用例也随新对照组件的可访问名称调整为“转换前的原图”，并等待实际结果就绪再拖动。后续完整回归结果以末尾补充记录为准。

## 重现

```powershell
pnpm exec turbo run check --force
pnpm build
pnpm --filter @pixelforge/heic-wasm test
pnpm --filter @pixelforge/image-engine test
node --test apps/desktop/test/asset-path.test.cjs
$env:PLAYWRIGHT_CHANNEL = 'chrome'
pnpm --filter @pixelforge/web test
```

### 最终补测记录

测试期间其他工作同时更新了实时预览、多窗口临时工作区和浏览器存储降级逻辑。最新全量运行收集 37 项，其中 35 项非任务用例全部通过，另一项浏览器重启恢复通过；余下一项因运行时测试文件更新、页面仍为旧构建而失败，因此没有将该轮记为全量通过。

确认新静态构建完成（`out/convert/index.html` 时间为本机 04:33:34）后，对最新 `tasks.spec.mjs` 的 4 项用例独立补测。补测先发现转换计数探针将批量结束后的自动预览也计入队列；将探针限定为界面处于批量转换状态，保留原来的 1～2 次队列转换断言。最终 4 项全部通过，覆盖持久化队列与取消/存储失败、原窗口关闭后的恢复、浏览器存储不可用时的临时工作区，以及浏览器退出后重新启动恢复。

因此最终分阶段覆盖 39 个不同浏览器用例（35 项非任务 + 4 项任务）；Vitest 31 项通过。补测产物位于 `apps/web/work/task-recheck-results/`，其 `.last-run.json` 为 `passed` 且无失败项。没有将分阶段结果表述为一次 39 项全量运行。

## 边界

本次未启动 Electron GUI、未制作/运行桌面安装包，也未执行远端 GitHub Actions 或 Firefox/Safari/系统原生 HEIC 阅读器验证。现有回归通过不能证明所有文件变体均可处理。SVG 矢量化尚未实现，方案见 [SVG 导出调研](SVG-EXPORT-RESEARCH.md)。

## SVG 实现后的整站回归

随后按用户要求实现了 VTracer WASM SVG 导出，以上为接入前的历史记录。接入后通过 `PLAYWRIGHT_CHANNEL=chrome pnpm web:test` 重新构建生产页面，在同一轮中通过 **31 项 Vitest 和 41 项 Playwright**，浏览器阶段约 2.4 分钟。包含原有图片/PDF/OCR/压缩/任务用例和 SVG 三项专项测试，不再仅依赖分阶段覆盖结论。

Rust、TypeScript 与桌面语法检查的无缓存 `turbo run check --force` 共 7 项通过；15 种位图编码回读和新增 SVG 真实路径输出通过，WASM 模块三种预设及边界检查通过。新增验证了 400 万像素拒绝与调整尺寸后的成功转换。SVG 的 1px 轮廓和黑白背景问题已修复并复测。首版能力及边界见 [SVG 实现与验收](SVG-EXPORT-RESEARCH.md#首版实现与验收)。

本轮仍未重新运行 Electron GUI/安装包或远端 CI；本机整站浏览器覆盖为 Chrome。
