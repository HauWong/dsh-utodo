# dsh-utodo 界面规范（UI Guidelines）

这份文档管一件事：让「待办与想法」面板在后续任何一次改动后，看起来还是同一个产品。
所有视觉决定都以这里的 token 与配方为准；代码在 `lib/client.js` 顶部的 `CSS` 字符串里，
`.recon/ui-audit.mjs` 会机械地拒绝任何违反本规范的写法。

---

## 1. 设计意图

一个安静的工作台，不是仪表盘。

- **单一强调色**：琥珀 `#e0a15b` 只用来表达「可操作」和「当前状态」，一屏里出现面积很小。
- **中性为底**：面、线、文字全部由带 alpha 的中性灰构成，因此亮色与暗色主题是同一份样式，不写第二套。
- **两层投影就够**：静置用 `--ut-shadow-1`，浮起（toast）用 `--ut-shadow-2`；其余层级靠背景透明度与 1px 线。
- **节奏靠间距，不靠分割线**：分组之间用 32px 留白 + 一条极淡的线；卡片内部用 8/12px。
- **文字层级用透明度**：`--ut-o-2/3/4` 让次要文字在两种主题下都自然沉下去。
- **动效只做状态确认**：150ms、`--ut-ease`，只出现在 hover / 打开 / toast，不做装饰性动画。

参考截图：`.recon/shot-light.png`、`.recon/shot-dark.png`（由 `.recon/preview.mjs` 生成）。

---

## 2. 硬性约束

| # | 约束 | 检查方式 |
|---|---|---|
| 1 | 颜色字面量只能出现在 `--ut-*:` 声明行 | `ui-audit` 规则 1 |
| 2 | `font-size` 必须是 `var(--ut-fs-*)` | 规则 2 |
| 3 | `border-radius` 只能是 `var(--ut-r-*)`、`0`、`50%` | 规则 3 |
| 4 | 间距类属性里的 px 必须落在 4pt 标尺 | 规则 4 |
| 5 | 引用的 `var(--ut-*)` 必须已声明 | 规则 5 |
| 6 | JSX 里的类名必须在 CSS 里有规则，CSS 里的 `.utodo-*` 必须被用到 | 双向对齐检查 |
| 7 | 每个 `<button>` 显式写 `type` | 检查项 |
| 8 | 不引入构建步骤、不新增运行时依赖、不改 DSH 全局样式 | 人工 |

4pt 标尺（px）：`0 1 2 3 4 6 8 12 16 24 32 48 64 96`。
1/2/3px 只允许出现在 1px 边框、2px 焦点环、3px 这类光学微调上，不用于布局。

---

## 3. Token

全部定义在 `.utodo-root` 上，子元素直接 `var()` 取用。

### 3.1 颜色

| Token | 值 | 用途 |
|---|---|---|
| `--ut-accent` | `#e0a15b` | 强调色本体：填充按钮底、复选选中、星标点亮 |
| `--ut-accent-soft` | `rgba(224,161,91,.14)` | 强调色的浅底（选中行、is-on 按钮） |
| `--ut-accent-line` | `rgba(224,161,91,.44)` | 强调色的描边与焦点环 |
| `--ut-on-accent` | `#221a10` | 强调色填充上的文字 |
| `--ut-accent-ink` | `#a8702e` → `color-mix(... 62%, currentColor)` | **强调色当文字用时必须用它**（亮主题变深、暗主题变浅） |
| `--ut-danger` | `#c8574b` | 逾期、删除、错误 |
| `--ut-danger-soft` / `--ut-danger-line` | 同上 14% / 42% | 危险态底色 / 描边 |
| `--ut-line` | `rgba(128,128,128,.2)` | 常规 1px 边框、分组线 |
| `--ut-line-strong` | `rgba(128,128,128,.34)` | 输入框 focus、悬停描边、滚动条 |
| `--ut-tint` | `rgba(128,128,128,.06)` | 分段控件底、hover 底 |
| `--ut-tint-strong` | `rgba(128,128,128,.1)` | 选中条目底、图标按钮 hover |
| `--ut-toast-bg` / `--ut-toast-fg` | `rgba(38,36,33,.95)` / `#faf7f2` | toast |
| `--ut-option-bg` / `--ut-option-fg` | `#ffffff` / `#1b1b1b` | 原生 `<select>` 下拉项（系统弹层恒为浅色，不能跟随主题） |

标签色由数据驱动，走三个运行时变量 `--ut-tag-bg` / `--ut-tag-fg` / `--ut-tag-line`（见 `TAG_PALETTE`，六色莫兰迪）。

### 3.2 字号

`--ut-fs-xs` 11 · `sm` 12 · `md` 13 · `base` 14 · `lg` 15 · `xl` 18 · `2xl` 22

| 用途 | Token |
|---|---|
| 面板标题 | `2xl`（22px，字距 -0.01em） |
| 输入框、行标题、正文 | `base`（14px） |
| 副标题、元信息、提示 | `sm`（12px） |
| 分组标签、badge | `xs`（11px） |

正文行高 1.5；行标题 `line-height: 1.4`。

### 3.3 圆角

`--ut-r-xs` 6 · `sm` 8 · `md` 10 · `lg` 14 · `xl` 18 · `pill` 999

规矩：**小控件用 xs/sm，卡片用 md，面板用 lg，胶囊用 pill**。同一个组件内外层不要混用超过两级。

### 3.4 间距

`--ut-s1` 4 · `s2` 8 · `s3` 12 · `s4` 16 · `s5` 24 · `s6` 32 · `s7` 48

节奏：
- 面板左右内边距 `clamp(--ut-s4, 3.4vw, --ut-s6)`，底部留 96px 给最后一行滚动呼吸。
- 区块之间 32（`s6`），区块内部 12（`s3`），同一行元素之间 8（`s2`）。
- 分组之间：`border-top: 1px var(--ut-line)` + `padding-top: s3` + `margin-top: s6`。

### 3.5 文本层级与动效

| Token | 值 | 用途 |
|---|---|---|
| `--ut-o-2` | .68 | 次要信息（元信息、图标默认态） |
| `--ut-o-3` | .5 | 辅助说明、空态描述 |
| `--ut-o-4` | .36 | 已完成、占位级别的弱化 |
| `--ut-ease` / `--ut-dur` | `cubic-bezier(.2,.7,.3,1)` / 150ms | 所有 transition |
| `--ut-shadow-1` | `0 1px 2px rgba(0,0,0,.06)` | 静置浮起（主按钮） |
| `--ut-shadow-2` | `0 12px 32px rgba(0,0,0,.18)` | toast |

`prefers-reduced-motion: reduce` 时全部动画关闭。

---

## 4. 组件清单与规格

### 4.1 骨架

| 类 | 规格 |
|---|---|
| `.utodo-root` | 占满父容器、纵向滚动、顶部让出 `--dsh-frame-top-clearance` |
| `.utodo-shell` | `max-width: 760px`，水平居中，负责全部内边距 |
| `.utodo-head` | flex-wrap 横排；底部 1px 线；下边距 `s5`；标题块在左，`.utodo-head-tools` `margin-left: auto` |
| `.utodo-panel` | 卡片：1px `--ut-line`、`--ut-r-lg`、内边距 `s3`，底色用 `--ut-tint` |

### 4.2 分段控件（tabs / views / seg 共用一套配方）

外壳：`--ut-tint` 底 + 1px `--ut-line` + `--ut-r-md` + 2px 内边距。
条目：`.utodo-tab` / `.utodo-view` 高 28，`.utodo-seg-btn` 高 24（`.utodo-pin-range` 里 22）、`--ut-r-sm`、`opacity: var(--ut-o-2)`、hover 加 `--ut-tint`；
`.is-active` = `--ut-tint-strong` 底 + `inset 0 0 0 1px var(--ut-line-strong)` + 不透明。
计数徽标：`.utodo-tab-count` / `.utodo-view-count`，`--ut-fs-xs`、`--ut-o-3`。

### 4.3 按钮（只有三级）

| 类 | 高度 | 外观 | 何时用 |
|---|---|---|---|
| `.utodo-add` | 32 | accent 填充 + `--ut-on-accent` 文字 + `--ut-r-sm` + shadow-1；hover 去阴影、`brightness(1.05)` | 一屏一个主动作（添加、确认导入） |
| `.utodo-ghost` | 30 | 透明底 + 1px `--ut-line`；`.is-on` = `--ut-accent-ink` 文字 + `--ut-accent-soft` 底 + `--ut-accent-line` 边 | 次级动作（导入会话、完成） |
| `.utodo-icon-btn` | 28×28 | 透明、`--ut-r-xs`、图标 `--ut-o-2`；hover `--ut-tint-strong` 且不透明；`.is-danger` hover 文字转 `--ut-danger` | 行内图标动作（星标、删除） |
| `.utodo-quick-btn` | 26 | 胶囊、1px `--ut-line`；`.is-star` = accent 描边 + `--ut-accent-ink` | 快捷参数（今天/明天/重要/测试推送） |
| `.utodo-confirm` | 26 | accent 实心小按钮 | 行内编辑的「保存」 |

同一个视图里 `.utodo-add` 最多出现一次；两个并列主动作就说明信息架构有问题。

### 4.4 输入

`.utodo-input`（无边框的大输入，占满宽，`--ut-fs-base`）、`.utodo-textarea`（想法输入，最小 60px）、
`.utodo-date` / `.utodo-days` / `.utodo-select` / `.utodo-field-input` / `.utodo-inline-input`
共用配方：高 32、`--ut-r-sm`、1px `--ut-line`、底 `--ut-tint`（或无底）、focus 时边线转 `--ut-line-strong`。
天数框宽 48px。

`.utodo-remind`（提醒簇）：`inline-flex` + `gap s1`，里面只放提醒日（`.utodo-remind-date`，124px）和提醒时间（`.utodo-remind-time`，88px）两个输入。
每个输入自己带边框，绝不再给外层套一个共享输入框（旧版就是这么错位的）；簇本身同高 32。
提醒开关是 `.utodo-quick-btn.is-remind`，和 `.is-star` 用同一套强调色。

### 4.5 列表行

`.utodo-row`：flex、gap `s3`、内边距 `s2`/`s3`、`--ut-r-md`，描边默认透明；hover 时加 `--ut-tint` 底 + `--ut-line` 边（不位移）。
- `.utodo-check`：18×18 圆环，`.is-done` 时 accent 填充 + 勾；
- `.utodo-row-title` 14px/1.55，`.is-done` 时加删除线并降到 `--ut-o-4`；
- `.utodo-meta` 12px `--ut-o-3`，用 `·` 分隔；
- `.utodo-row-actions` 默认 `opacity: 0`，行 hover / focus-within 才出现（键盘可达）。
- 多选：`.is-selectable` 显示 `.utodo-selectbox`（18×18 方框）、隐藏 `.utodo-row-actions`、`.is-selected` 用 `--ut-accent-soft` 底 + accent 边。

### 4.6 Badge

`.utodo-badge`：高 18、`--ut-r-pill`、`--ut-fs-xs`、1px 边。
变体：`.is-star`/`.is-remind`（accent-soft 底 + `--ut-accent-ink`）、`.is-danger`（danger-soft 底 + `--ut-danger`）、`.is-accent`（实心 accent）。

### 4.7 分组与面板

- `.utodo-group-head`：标签 `--ut-fs-xs`、大写间距 `letter-spacing: .08em`、`.is-today` 用 `--ut-accent-ink`、`.is-overdue` 用 `--ut-danger`；计数 `--ut-o-3`。
- `.utodo-pin`（重要 / 即将到期容器）：无底，只用左侧 2px `--ut-line-strong` 竖条 + 左内边距 `s3` 收拢一组行；加上 `.utodo-panel` 后才变成卡片（1px 线 + `--ut-r-lg` + `s3` 内边距），`.is-important` 的竖条换成 accent。

### 4.8 想法卡

`.utodo-ideas`：`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`、gap `s3`。
`.utodo-idea`：`--ut-r-lg`、1px `--ut-line`、`--ut-tint` 底、内边距 `s3`，hover 时边线转 `--ut-line-strong`、底转 `--ut-tint-strong`；
`.utodo-idea-text` 14px/1.65；`.utodo-idea-foot` 放标签、时间、删除，`--ut-spacer` 撑开。

### 4.9 标签

`.utodo-chip`：胶囊、`--ut-fs-xs`、颜色取自 `--ut-tag-bg/fg/line`；`.utodo-chip-x` 是文字型的 × 按钮（`--ut-fs-sm`，`--ut-o-3`，hover 不透明）；`.utodo-chip-add` 是 20px 高的虚线胶囊。
`.utodo-filter`：与 chip 同形，`.is-active` 时实底并加 `inset` 边框。

### 4.10 设置卡

`<details class="utodo-settings">`：1px `--ut-line`、`--ut-r-lg`、`--ut-tint` 底。
`.utodo-settings-summary` 高 44、`list-style: none`、`::after` 画 6px 的 chevron（`[open]` 旋转 -135°）。
`.utodo-settings-body` gap `s3`；`.utodo-field` 纵排、`.is-check` 横排（复选 + 文案）。
`.utodo-hint` 12px `--ut-o-3`。

### 4.11 Toast 与空态

`.utodo-toast`：固定在底部中央、深底胶囊、`--ut-shadow-2`、`utodo-rise` 入场动画、3.2s 自动消失；`.is-warn` 用 danger 底。
`.utodo-empty`：虚线边框 + 居中说明，`.is-compact` 去掉大高度；标题 14px、说明 12px `--ut-o-3`。

---

## 5. 状态约定

| 状态 | 表达方式 |
|---|---|
| hover | 只加 `--ut-tint` / `--ut-tint-strong`，不改布局、不加位移（列表行除外：不位移） |
| active（按下） | 不加额外样式，避免抖动 |
| focus | 统一 `:focus-visible` 2px `--ut-accent-line` 外环，offset 2px |
| 选中 | accent-soft 底 + accent-line 边，或 accent 填充（复选、实心 badge） |
| 禁用 | `opacity: var(--ut-o-4)` + `cursor: default`，不改颜色 |
| 错误 | `--ut-danger` 文字或 danger-soft 底，不用红色大块 |

---

## 6. Do / Don't

**Do**
- 先用现有配方：新控件优先从「分段控件 / 按钮三级 / 输入 / badge / 卡片」里挑一个复用。
- 新 token 先加进 `.utodo-root` 的 token 块，再在规则里引用。
- 用 `--ut-accent-ink` 写任何强调色文字。
- 改完跑 `node .recon/ui-audit.mjs` 与 `node .recon/preview.mjs`，看一眼两种主题。
- 中文界面里字距保持 0（除分组标签的 0.08em），行高 ≥1.5。

**Don't**
- 不写 `#fff`/`#000`/`rgba(0,0,0,x)` 之外的临时颜色，不加第三层投影。
- 不为亮/暗主题各写一套规则（除非原生控件无法继承，如 `<select>` 的选项）。
- 不新增字号（11–22 的七级够用），不新增圆角档位。
- 不在行内放超过两个图标动作；更多动作进「更多」或设置。
- 不用 emoji 当图标（图标是内联 SVG，`currentColor` 描边 1.3–1.4）。
- 不用 `!important` 覆盖 DSH 全局样式，只在 `.utodo-root` 作用域内工作。

---

## 7. 新增一个控件的流程

1. 在 `UI-GUIDELINES.md` 里确认它属于哪一类配方（表格 4.1–4.11）；能复用就不新建。
2. 需要新 token 时加进 `.utodo-root` 的 token 块，并在第 3 节补一行说明。
3. 在 `lib/client.js` 的 `CSS` 字符串里，紧挨同类规则添加样式（文件内已有分节注释）。
4. 在 `.recon/preview-body.html` 里加上该控件的一个静态实例（默认态 + 关键状态）。
5. 跑 `node .recon/ui-audit.mjs`（必须 clean）→ `node --check lib/client.js` → `node .recon/smoke.mjs`。
6. `node .recon/preview.mjs` 后截图核对亮/暗两套：

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=900,2000 \
  --screenshot="$PWD/.recon/shot-light.png" "file:///$PWD/.recon/preview-light.html"
```

7. 更新 `screenshots/todo.png`（真实界面截图）并在 README 里保持描述一致。

---

## 8. 与主题的关系

面板不自己判断深色/浅色：所有中性色都是带 alpha 的灰，强调色文字用 `color-mix` 与 `currentColor` 混出对比度。
唯一例外是原生 `<select>` 的弹出选项——系统弹层固定浅色，因此显式给 `--ut-option-bg/fg`。
新增颜色时先问：它在 `#fbfaf8` 和 `#1c1b1a` 两种底上都能读吗？不能就说明它不该是固定值。
