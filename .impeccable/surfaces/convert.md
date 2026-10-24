# 图片转换对照

模式：Operate。2026-10-24 用户要求 /convert/ 像 Squoosh 一样直接对照。

THESIS: 在同一坐标下查看真实原图与编码结果，用分界线、缩放和平移判断画质及体积取舍。
OWN-WORLD: 继承实际代码中的 FolioForge 靛蓝、明暗主题、共享字体与现有双栏设置；不替换系统或修改 DESIGN.md。旧 DESIGN.md 灰绿描述为既有漂移。
STORY: 导入 → 保留批量转换流程 → 真实输出后显示左右对照 → 缩放/平移核对 → 下载。设置变更需重新转换，不虚构实时结果。
FIRST VIEWPORT: 原图片工作区内替换旧小预览；对照工具栏、可拖动图像、双侧尺寸与体积和变化比例。右侧格式/质量/尺寸及下方文件队列保留。
FORM: 分割画布，原图在左，编码结果在右；共享变换，分界线可键盘操作，100% 与适应、放大缩小和原生全屏；窄屏工具栏换行。原生不支持的格式使用既有引擎预览并明确缩略边界。
FINISH: 在真实转换后验证桌面、390px、310px、深色和全屏截图；真实输入/输出字节、同步缩放、拖动取消恢复、切图、重新转换及格式回退有 Web 验收。独立审阅和设计记录完成后交付。

FINISHED EVIDENCE (2026-10-24): 七张完成截图（desktop、390、310、dark、detail-100、fullscreen、fallback）已打开核对；TypeScript、生产构建、28 单元及 33 Web 测试通过，详见 ../review/image-compare/web-verification.md。独立 finish-review.md 最终 disposition: ship，无 material fixes；设计记录见 ../review/image-compare/design-documentation.md。比较器继承实际靛蓝明暗主题、共享字体及原有设置/队列，保留真实结果与引擎缩略预览的像素边界、设置修改需重新转换。DESIGN.md 的既有灰绿漂移未改写；本次无系统替换或概念竞赛。未验证 Electron、实体触屏或完整页面级可访问性审计。
