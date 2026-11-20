# dsh-utodo

> 常驻在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 左侧栏的待办清单与想法速记本 —— 不离开当前窗口，随手记下，随时找回。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![DeepSeek Harness plugin](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4f46e5.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![Node](https://img.shields.io/badge/node-%3E%3D20-informational.svg)](package.json)

**English** → [README.md](README.md)

## 为什么做这个

待办和灵感通常散落在另一个 App 里，于是离它所属的工作越来越远。`dsh-utodo` 在 DeepSeek Harness 侧栏放一块轻量、可全键盘操作的面板：不用切窗口就能记一条待办或一个念头，用日期或标签把它组织起来，需要时再翻出来。数据只存在本机浏览器存储里 —— 没有账号、没有服务端、没有埋点。

## 功能

### 待办

- **灵活的时间设置**：不设日期、指定某一天，或指定一个**日期区间**。区间进行中会显示剩余天数，并且按**截止日**判定状态。
- **自动分组**：逾期 / 今天 / 即将到来 / 未设日期 / 已完成。
- **重要标记**：点 ☆ 即可标记，在「重要」视图里集中查看。
- **临期窗口**：列出未来 *N* 天内到期的未完成事项，*N* 可选 `2 / 7 / 30` 天预设，也可自定义 1–365 任意值，并会持久保存。
- **三个可切换视图**（各自带实时条数）：全部待办、重要、临期。
- **快速录入**：输入标题，回车即可。

### 想法

- 随手记，可加**任意多个标签**。
- 顶部标签栏按标签筛选，并显示每个标签的条数。
- 回车或逗号添加标签，点 × 或退格删除。

### 标签配色

只用六种低饱和莫兰迪色，按首次出现顺序分配，所以前六个标签一定彼此可辨：

| 色名 | 色值 | 白底对比度 |
| --- | --- | --- |
| 雾蓝 | `#5c7893` | 4.60 |
| 灰绿 | `#67805e` | 4.35 |
| 豆沙 | `#966c6c` | 4.51 |
| 藕紫 | `#75618c` | 5.46 |
| 驼杏 | `#8b724a` | 4.56 |
| 墨青 | `#3d5f68` | 6.92 |

两两之间 CIELAB 色差 ΔE ≥ 16，明显高于这个尺寸下颜色开始难以分辨的约 10 这一阈值。配色记录在 `settings.tagTones` 里，所以同一个标签在输入区、筛选条和每张卡片上颜色一致，重启后也不变；在输入框里刚打出的新标签，预览色就是它保存后会得到的颜色。

## 环境要求

- **DeepSeek Harness** 桌面端（开发与验证基于 `0.2.2-rc.3`）。插件依赖客户端插槽 API（`ctx.slots`）和 `__ModuleLoader__` bundle 格式。
- **Node.js ≥ 20** —— 仅用于跑自检脚本；插件本身没有构建步骤，除了平台提供的 `react` 之外没有运行时依赖。

## 安装

插件没有发布到 npm，直接从 GitHub 安装即可（包名由仓库里的 manifest 解析）：

```bash
dsh plugin --profile desktop add "github:HauWong/dsh-utodo"
```

或者克隆后以 link 方式装入，开发时建议这样做：

```bash
git clone https://github.com/HauWong/dsh-utodo.git
dsh plugin --profile desktop add link:"/absolute/path/to/dsh-utodo"
```

`dsh plugin` 会把参数转发给 profile 目录下的 `pnpm`，并根据包内的 `cordis.patch.yml` 同步 `dsh.profile.bundles`，不需要手工改配置文件。

> **安装或更新后请重启 DeepSeek Harness。** 客户端模块图在应用启动时按已启用的 Loader 条目组装，重启后侧栏才会出现「待办与想法」入口（该面板默认已固定显示）。

卸载：

```bash
dsh plugin --profile desktop remove dsh-utodo
```

## 使用

在左侧栏打开 **待办与想法**。

| 操作 | 方式 |
| --- | --- |
| 新建待办 | 在输入框输入标题，回车 |
| 设置日期 | `单日` 选一天，`区间` 选一段，或用快捷项（今天 / 明天 / 下周一） |
| 标记重要 | 点行右侧的 ☆（新建时也可在输入框旁切换） |
| 修改待办 | 双击标题，标题与日期都能就地编辑 |
| 删除 | 点删除键，需要再点一次确认 |
| 切换待办视图 | 顶部标签页：全部待办 / 重要 / 临期 |
| 调整临期窗口 | 点 `2 / 7 / 30` 预设，或在数字框里自定义 |
| 记录想法 | 输入内容、加标签，`Ctrl/Cmd + Enter` 保存 |
| 按标签筛选 | 点列表上方的标签条 |
| 修改想法 | 双击正文 |

## 数据与隐私

全部状态存放在 WebView 的 `localStorage` 中，键名为 `dsh-utodo.v1`。没有任何网络请求、统计或账号体系，数据不会离开本机。

```jsonc
{
  "todos": [{ "id": "…", "title": "…", "start": "2026-11-20", "end": "2026-11-24", "done": false, "important": true, "createdAt": 0 }],
  "ideas": [{ "id": "…", "text": "…", "tags": ["dsh"], "createdAt": 0 }],
  "settings": { "soonDays": 2, "tagTones": { "dsh": 0 } }
}
```

日期统一是 ISO `YYYY-MM-DD`；`end` 为空表示单日事项。旧版本写入的数据会在加载时自动迁移：缺字段会补齐，标签配色会自动分配。

因为是本地存储，清除应用的站点数据会一并清空清单。目前还没有导入 / 导出功能，但上面就是完整的数据格式，手动备份这个键即可。

## 实现说明

一个 DSH 插件分为两部分：宿主入口（Cordis 插件）和可选的 Web 客户端 bundle。

| 路径 | 作用 |
| --- | --- |
| `package.json` | 包信息，以及 `dsh.bundle` / `dsh.client` 清单 |
| `cordis.patch.yml` | 向 profile 注入 Loader 条目 `utodo` |
| `lib/index.js` | 宿主端 —— 有意留空（`inject = []`，空 `apply`），作用只是让条目处于启用状态、并让客户端 bundle 能被提供 |
| `lib/client.js` | 全部界面：侧栏图标与主面板，手写的 `window.__ModuleLoader__` bundle |

客户端注册两个插槽：

```js
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
  { name: 'sidebar.panellist', id: 'utodo', order: 20, label: () => '待办与想法' },
  PanelIcon,
))

ctx.slots.inject('main', () => ctx.slots.register(
  { name: 'main', key: 'utodo' },
  UtodoPage,
))
```

`sidebar.panellist` 提供侧栏那一行，图标通过 `sidebar.panel.icon` 工厂渲染；`main` 由布局层在选中该行时按 `key` 匹配。样式是 bundle 内注入的单个 `<style>` 元素，使用半透明中性色加一个强调色（`#e0a15b`），深浅主题下都可读。项目没有打包器：这个文件就是被 loader 包了一层的普通 ESM，方便审阅和快速修补。

## 开发

```bash
node --check lib/client.js          # 仅语法检查
node .recon/smoke.mjs               # 用假 React 渲染面板，校验分组、区间、视图、标签配色
node .recon/smoke-register.mjs      # 用假 ctx.slots 跑 apply()，校验注册的插槽
```

两个脚本都会打印 `failures` / `problems` 列表，为空即通过。`smoke.mjs` 会报一条已知误报，原因是占位符是元素属性而非文本。

`.recon/` 还包含研究宿主时用的工具：asar 索引 / 读取 / 搜索脚本。它们是开发脚手架，删除不影响插件本身。

## 已知限制

- 未发布到 npm，需从 GitHub 安装或本地 link。
- 仅本地存储 —— 不支持同步、导入导出和多设备。
- 安装或更新后需要重启应用，因为客户端模块图在启动时组装。
- 针对 DSH `0.2.2-rc.3` 的插槽命名开发，宿主未来若调整渲染机制可能需要跟进。

## 参与贡献

欢迎提 Issue 和 PR。请保持项目依赖的几条约束：

- `lib/client.js` 不引入构建步骤和运行时依赖，只用平台提供的 `react` / `react/jsx-runtime`。
- 提交 PR 前跑完上面三条检查，保持冒烟断言为绿。
- 延续现有视觉语言：中性表面、单一强调色、六色莫兰迪标签板，不用 emoji 充当图标。

## 许可证

MIT © 2026 HauWong —— 见 [LICENSE](LICENSE)。
