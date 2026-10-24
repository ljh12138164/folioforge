---
name: FolioForge 页匠
description: 本地 PDF 页面处理与 15 种图片格式批量互转工作台
colors:
  primary: "#c2451b"
  primary-hover: "#a63813"
  primary-dark: "#c84b20"
  accent: "#b83f17"
  accent-soft: "#fbece6"
  accent-dark: "#f0825b"
  accent-soft-dark: "#38221a"
  canvas: "#f7f3ec"
  surface: "#efe9df"
  panel: "#ffffff"
  ink: "#26201b"
  muted: "#6c5f56"
  line: "#e6ddd1"
  control-line: "#d2c4b4"
  canvas-dark: "#161311"
  surface-dark: "#1f1b18"
  panel-dark: "#25201c"
  ink-dark: "#f5efe9"
  muted-dark: "#a89b90"
  line-dark: "#352e29"
  success: "#216e47"
  success-soft: "#eaf5ee"
  warning: "#965912"
  warning-soft: "#fdf3e4"
  error: "#b93829"
typography:
  display:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif'
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif'
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif'
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: '"Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Cascadia Mono", "SFMono-Regular", ui-monospace, Consolas, monospace'
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
---

# Design System: FolioForge 页匠

## Overview

**Creative North Star: "温润单色焦点台 (Action-Only Warm Workbench)"**

FolioForge 是一套专为文档工坊与像素处理打造的高专注度桌面与网页 UI 系统。拒绝喧宾夺主的营销横幅、五彩斑斓的 SaaS 状态徽章以及层层嵌套的 1px 细线灰框；以温润的暖雪花石底色、纯白实体工作台纸面以及克制的浓缩咖啡墨色为基调，将唯一的柿红暖陶焦点色（Terracotta）严格收敛于关键行动（Primary Action）与当前聚焦状态。

页面由 54px 紧凑工作室顶栏统领，在 PDF 工作台采用「三栏工坊拓扑」（左侧 14 项工具架构导轨 + 中央物理纸张舞台 + 右侧即时参数巡检栏），在首页采用「非对称左导轨 + 细线分割索引账页」，使 21 个工具入口与复杂操作流程层次分明、触手可及。

**Key Characteristics:**
- **温润底色与物理升起**：暖雪花石粉质底色（#f7f3ec），操作区通过柔软的环境漫反射投影与纯白物理纸面建立层次，不靠嵌套线条。
- **Action-Only 单焦点**：全站仅保留柿红暖陶（#c2451b / #f0825b）作为唯一主操作焦点，禁用在装饰、图标背景或普通标签上。
- **桌面级工作台拓扑**：54px 顶栏整合分段胶囊路由与主题切换；PDF 采用 204px 左导轨 + 舞台 + 324px 检视栏的三栏专业布局。
- **双向深浅同质映射**：深色模式映射为深焙浓缩咖啡色（#161311 底色 / #25201c 纸面 / #f0825b 焦点），明暗对比与色温完全对称。

## Colors

全站遵循「温润暖调单色台底 + 单一柿红行动色」原则，辅助状态色仅在具体语义发生时出现。

### Primary
- **柿红暖陶 Action Terracotta** (#c2451b / 深色 #c84b20): 专用于主按钮（生成 PDF、重新转换、打开工作台）与活跃选区边框。悬停态加深至 #a63813 / #da592d。

### Secondary
- **柿红柔润底色 Accent Soft** (#fbece6 / 深色 #38221a): 用于选中态导轨胶囊、激活模式徽章与文本选择高亮（::selection），对比度满足 WCAG AA ≥ 5.6:1。

### Neutral
- **暖雪花石底色 Alabaster Canvas** (#f7f3ec / 深色 #161311): 页面基底，温润舒展。
- **燕麦控制面 Oat Surface** (#efe9df / 深色 #1f1b18): 次级容器、滑块轨道与分段胶囊槽。
- **纯白工坊纸面 Pure Paper Panel** (#ffffff / 深色 #25201c): 页面卡片、检视面板与浮起工作区。
- **浓缩咖啡墨色 Espresso Ink** (#26201b / 深色 #f5efe9): 一级标题与主要操作文字。
- **暖石次要文字 Warm Stone Muted** (#6c5f56 / 深色 #a89b90): 辅助说明、页码与参数标注。
- **温润分割线 Subtle Line** (#e6ddd1 / 深色 #352e29): 容器与分栏分割线。

### Semantic
- **森林深绿 Forest Success** (#216e47 / 深色 #5ec28a): 用于完成标记、体积节省百分比与引擎联机指示。
- **琥珀暖黄 Amber Warning** (#965912 / 深色 #edb155): 用于有损降采样提醒与差异比对缺失提示。
- **绯红警示 Crimson Error** (#b93829 / 深色 #f27c6d): 错误信息与无效范围提示。

### Named Rules
**The Action-Only Rule.** 柿红色仅允许出现在全屏当前最关键的一个执行按钮、当前选中的工具胶囊或活跃输入焦点上。任何纯展示卡片、未激活状态或非行动区严禁使用柿红色。
**The Ground Integrity Rule.** 底色必须保持暖调雪花石色（#f7f3ec），严禁回退至刺眼的纯白（#ffffff）或工业冷灰（#f3f4f6）。

## Typography

**Display / Headline / Body Font:** `"Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif`  
**Label / Data Mono Font:** `"Cascadia Mono", "SFMono-Regular", ui-monospace, Consolas, "Liberation Mono", monospace`

**Character:** 界面文字严谨克制，西文笔画骨架清晰，中文字形平整；数据与文件尺寸统一使用等宽数字（tabular-nums），保证多行数字垂直对齐。

### Hierarchy
- **Display** (600, 28px, line-height 1.2, tracking -0.03em): 首页及子页面顶级标题。
- **Headline** (600, 17px, line-height 1.3, tracking -0.02em): 工作室状态栏标题、模态框标题。
- **Title** (600, 13.5px, line-height 1.4): 工具卡片名称、检视栏分区标题。
- **Body** (400, 13px, line-height 1.6): 操作说明与工具描述，行长控制在 65–75ch。
- **Label / Data** (500, 11px, 等宽字体): 尺寸、页码、字节数、快捷键与格式标签。

### Named Rules
**The Tabular Data Rule.** 所有文件体积、页面序号、百分比与像素尺寸必须声明 `tabular-nums`，禁止由于数字宽度变化产生界面跳动。
**The No-Kicker Rule.** 标题上方严禁添加任何 Eyebrow 或 Kicker 小标签。标题自具分量，由字号、字重与上下文直接传达。

## Layout

**Spatial Model:** 居中 1340px 主流容器，54px 固定 studio 顶栏。
- **/pdf/ 拓扑:** `204px` 左侧 14 模式导轨 + `minmax(0, 1fr)` 纸张工坊舞台 + `324px` 右侧检视面板。
- **/ 首页拓扑:** 2 栏非对称架构导轨：左侧 `220px` 类别导航 + 右侧 2 列细线分割的白底索引账页。
- **响应式断点:**
  - `1040px`: 导轨转为 4 列横向网格置顶，检视面板下移堆叠。
  - `900px`: 工作台与首页目录降为单栏堆叠。
  - `760px`: 顶栏自动折叠，导航胶囊平铺，网格降为单列。
  - `360px / 310px`: 移除辅助文字，控制紧凑间距，确保 310px 屏幕零水平溢出（scrollWidth <= innerWidth）。

## Elevation & Depth

以物理纸面的升起感与微弱暖色环境光投影（Ambient Diffuse Shadows）为主，避免生硬的纯黑阴影或无模糊的像素块阴影。

### Shadow Vocabulary
- **Card Shadow** (`0 1px 2px rgba(38, 32, 27, 0.04), 0 8px 24px -8px rgba(38, 32, 27, 0.06)`): 用于主操作卡片、设置面板与索引账页。
- **Sheet Shadow** (`0 1px 3px rgba(38, 32, 27, 0.07), 0 6px 16px -6px rgba(38, 32, 27, 0.09)`): 用于单个 PDF 纸张物理预览缩略图。
- **Pill Shadow** (`0 1px 2px rgba(38, 32, 27, 0.06), 0 2px 6px rgba(38, 32, 27, 0.04)`): 用于顶栏胶囊、选中工具标签与次级按钮。

### Named Rules
**The Ambient Depth Rule.** 阴影颜色取自浓缩咖啡墨色（rgba(38, 32, 27, ...)），在暖底上形成温和自然的漫反射晕染，严禁使用灰色或中性黑。

## Shapes

- **圆角策略:**
  - 模态框与主工作台卡片: 16px–20px (`rounded-2xl`)
  - 缩略图与子面板: 12px (`rounded-xl`)
  - 按钮与输入框: 9px–10px (`rounded-[10px]`)
  - 状态胶囊与计数器: 全圆角 (`rounded-full`)
- **边框规范:** 统一采用 1px 细线边框（Light: `#e6ddd1`, Dark: `#352e29`），在白底与雪花石底色之间提供细腻区分。

## Components

### Buttons
- **Primary:** 柿红背景（#c2451b），纯白文字，10px 圆角，内发光光晕与微弱投影；仅用于主执行动作。
- **Secondary:** 白底灰线（border-line），墨色文字，悬停浅灰背景。
- **Action Tabs:** 导轨按钮，默认文字墨色，激活状态呈 #fbece6 暖底、#b83f17 粗体柿红字与柿红图标。

### Sheets & Index
- **Studio Index Sheet:** 首页统一采用白底大卡片，内嵌细线分割（-mb-px -mr-px），单元格悬停微亮，杜绝 21 个分散浮动卡片。
- **Page Preview Sheet:** PDF 纸张缩略图具备 1px 物理纸张白边与微弱立体投影，悬停显示边框高亮，禁止通过 hover 动画位移内部缩略图。

### Navigation
- 54px 紧凑顶栏，左侧品牌印记，中央居中分段路由胶囊（首页 / PDF 工具 / 图片转换），右侧辅助操作与浅深色切换器。

## Do's and Don'ts

### Do:
- **Do** 严格保持暖雪花石底色（#f7f3ec）与纯白纸面（#ffffff）的双层工作台物理隐喻。
- **Do** 仅在全屏最高优先级执行动作（如「生成 PDF」、「重新转换」）使用柿红主色（#c2451b）。
- **Do** 对所有文件大小、页码、百分比与坐标等数字应用 `font-mono` 与 `tabular-nums`。
- **Do** 在 310px 超窄视口下保持工具栏与面板标题单行不折行（whitespace-nowrap）。

### Don't:
- **Don't** 在标题上方添加任何 eyebrow / kicker 辅助装饰标签。
- **Don't** 将页面做成同质化图标+标题+描述的大量独立悬浮卡片墙（Cards as lazy containers）。
- **Don't** 在悬停卡片时对内部缩略图片施加位移动画（Never animate an image on hover through its parent）。
- **Don't** 使用未经软化处理的纯冷灰、纯黑投影或多色 SaaS 彩色徽章。
