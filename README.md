# dsh-utodo

一个 DSH（DeepSeek Harness）插件：在左侧栏加一个「待办与想法」入口，用来记录待办事项和想法。

仓库：<https://github.com/HauWong/dsh-utodo>（私有）。

- **待办**：支持**无日期 / 指定某一天 / 指定一个日期区间**，自动按「逾期 · 今天 · 即将到来 · 未设日期 · 已完成」分组，区间进行中会显示剩余天数。
- **三种视图**（待办页顶部切换，一次只显示一种，数字是各自的条数）：
  - **全部待办**：按日期分组看所有事项；
  - **重要**：只看标记为重要的 —— 在待办行右侧点 ☆ 标记（新建时在输入框旁也能直接勾），未完成的排在前面，再按截止日排序；
  - **临期**：只看**未来 N 天内到期**的未完成事项，N 可点 2天 / 7天 / 30天 预设，也可在数字框里自定义（1–365）；这个值存在数据里，重启后保留。
- **想法**：随手记，可加任意多个标签；顶部标签栏按标签筛选并显示数量。
- **标签固定 6 色（莫兰迪）**：只用六种低饱和灰调色 —— 雾蓝 `#5c7893`、灰绿 `#67805e`、豆沙 `#966c6c`、藕紫 `#75618c`、驼杏 `#8b724a`、墨青 `#3d5f68`，两两色差 ΔE ≥ 16，浅色底上对比度 4.4:1 以上，彼此可区分。
  标签按**首次出现的顺序**领色，所以前 6 个标签的颜色一定各不相同；第 7 个起才会复用。配色记录在 `settings.tagTones` 中，所以同一个标签在输入区、筛选条和每张卡片上颜色一致，刷新/重启后也不变；在输入框里打出的新生标签也会立刻拿到它将来会用的那个颜色。
- 纯前端本地存储，数据保存在浏览器 `localStorage` 的 `dsh-utodo.v1` 键下，不联网、不上传。

## 安装（本机已完成）

插件以 `link:` 依赖装进了 desktop profile：

```
C:\Users\Whao\.dsh\profiles\desktop\node_modules\dsh-utodo -> D:\DeepSeek Harness\plugins\utodo
```

profile 的 `package.json` 中：

```json
"dependencies": { "dsh-utodo": "link:D:/DeepSeek Harness/plugins/utodo" },
"dsh": { "profile": { "bundles": [ "...", "dsh-utodo" ] } }
```

因为用的是 link，改这里的源码后**只需重启应用**即可看到变化，不用重新安装。

安装 / 卸载命令（在任意终端里，profile 名按需替换）：

```bash
dsh plugin --profile desktop add link:"D:/DeepSeek Harness/plugins/utodo"
dsh plugin --profile desktop remove dsh-utodo
```

> 注意：插件安装后需要**重启 DeepSeek Harness**。客户端模块图在应用启动时按已启用的 Loader 条目组装，重启后左侧栏才会出现「待办与想法」入口（默认已固定显示）。

## 目录结构

| 路径 | 作用 |
| --- | --- |
| `package.json` | npm 包描述 + `dsh.bundle` / `dsh.client` 清单 |
| `cordis.patch.yml` | 向 profile 注入 Loader 条目 `utodo` |
| `lib/index.js` | 宿主端（无逻辑，只保证条目启用、客户端模块可被加载） |
| `lib/client.js` | 全部界面：侧栏图标组件 + 主面板组件，手写 `window.__ModuleLoader__` bundle |
| `.recon/` | 开发期脚手架：asar 读取、无头冒烟测试、profile 备份，可整目录删除 |

## 实现要点

- 侧栏入口：`ctx.slots.inject('sidebar.panellist', …)` 注册 `{ id: 'utodo', order: 20, label: () => '待办与想法' }`，图标由 `sidebar.panel.icon` 工厂渲染。
- 主面板：`ctx.slots.inject('main', …)` 注册 `{ name: 'main', key: 'utodo' }`，点侧栏行时布局层用 `entryKey` 匹配到它。
- 样式在 bundle 内以 `<style>` 注入，颜色用半透明中性色 + 强调色 `#e0a15b`，深浅主题都可用。

## 自测

```bash
node --check lib/client.js
node .recon/smoke.mjs          # 用假 React 渲染待办页/想法面板，校验分组、区间文案、标签计数
node .recon/smoke-register.mjs # 用假 ctx.slots 跑 apply()，校验注册的槽位与形状
```

两个脚本都会打印 `problems`/`failures`，为空表示通过（`smoke.mjs` 会报一条已知误报：占位符是元素属性而非文本）。
