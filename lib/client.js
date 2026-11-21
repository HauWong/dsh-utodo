/**
 * dsh-utodo, browser half.
 *
 * Registers one left-sidebar entry (`sidebar.panellist`) and the global panel
 * (`main`, keyed by the same id) it opens: todos with an optional single date or
 * date range, and ideas with tags. Data lives in this client's storage.
 */
window.__ModuleLoader__.load({
  id: "dsh-utodo",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const h = React.createElement;
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useMemo = React.useMemo;
    const useRef = React.useRef;

    /** The id shared by the sidebar entry and the panel it opens. */
    const PANEL_ID = "utodo";
    const PANEL_LABEL = "待办与想法";
    const STORAGE_KEY = "dsh-utodo.v1";

    const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

    const CSS = `
/* ==========================================================================
   dsh-utodo — 唯一设计层
   --------------------------------------------------------------------------
   颜色 / 间距 / 圆角 / 字号 / 文本层级 全部来自 .utodo-root 上的 --ut-* token；
   .recon/ui-audit.mjs 会拒绝任何绕过它们的硬编码值。改样式前请先读
   UI-GUIDELINES.md（人类）与 AGENTS.md（代理入口）。
   ========================================================================== */

.utodo-root {
  /* 颜色 —— 面料与线条用带 alpha 的中性灰，亮/暗主题自动适配 */
  --ut-accent: #e0a15b;
  --ut-accent-soft: rgba(224, 161, 91, 0.14);
  --ut-accent-line: rgba(224, 161, 91, 0.44);
  --ut-on-accent: #221a10;
  /* accent used as text needs to be darker on light themes and lighter on dark
     ones, so it is mixed with the inherited ink instead of being used raw */
  --ut-accent-ink: #a8702e;
  --ut-accent-ink: color-mix(in srgb, var(--ut-accent) 62%, currentColor);
  --ut-danger: #c8574b;
  --ut-danger-soft: rgba(207, 98, 87, 0.14);
  --ut-danger-line: rgba(207, 98, 87, 0.42);
  --ut-line: rgba(128, 128, 128, 0.2);
  --ut-line-strong: rgba(128, 128, 128, 0.34);
  --ut-tint: rgba(128, 128, 128, 0.06);
  --ut-tint-strong: rgba(128, 128, 128, 0.1);
  --ut-toast-bg: rgba(38, 36, 33, 0.95);
  --ut-toast-fg: #faf7f2;
  --ut-option-bg: #ffffff;
  --ut-option-fg: #1b1b1b;

  /* 字号 */
  --ut-fs-xs: 11px;
  --ut-fs-sm: 12px;
  --ut-fs-md: 13px;
  --ut-fs-base: 14px;
  --ut-fs-lg: 15px;
  --ut-fs-xl: 18px;
  --ut-fs-2xl: 22px;

  /* 圆角 */
  --ut-r-xs: 6px;
  --ut-r-sm: 8px;
  --ut-r-md: 10px;
  --ut-r-lg: 14px;
  --ut-r-xl: 18px;
  --ut-r-pill: 999px;

  /* 间距 */
  --ut-s1: 4px;
  --ut-s2: 8px;
  --ut-s3: 12px;
  --ut-s4: 16px;
  --ut-s5: 24px;
  --ut-s6: 32px;
  --ut-s7: 48px;

  /* 文本层级（透明度，随主题自动反转） */
  --ut-o-2: 0.68;
  --ut-o-3: 0.5;
  --ut-o-4: 0.36;

  /* 动效 */
  --ut-ease: cubic-bezier(0.2, 0.7, 0.3, 1);
  --ut-dur: 150ms;

  /* 投影：只有两级 */
  --ut-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.06);
  --ut-shadow-2: 0 12px 32px rgba(0, 0, 0, 0.18);

  position: relative;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-top: var(--dsh-frame-top-clearance, 0px);
  font-family: inherit;
  color: inherit;
  -webkit-font-smoothing: antialiased;
}

.utodo-root * { box-sizing: border-box; }
.utodo-root button { font: inherit; color: inherit; }
.utodo-root :focus-visible { outline: 2px solid var(--ut-accent-line); outline-offset: 2px; }
.utodo-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.utodo-root ::-webkit-scrollbar-thumb {
  background: var(--ut-line-strong);
  border-radius: var(--ut-r-pill);
  border: 2px solid transparent;
  background-clip: content-box;
}

/* ---------------------------------------------------------------- 骨架 */

.utodo-shell {
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(var(--ut-s5), 3vw, var(--ut-s6)) clamp(var(--ut-s4), 3.4vw, var(--ut-s6)) 96px;
}

.utodo-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ut-s3);
  padding-bottom: var(--ut-s4);
  border-bottom: 1px solid var(--ut-line);
  margin-bottom: var(--ut-s5);
}
.utodo-head > div:first-child { flex: 1 1 220px; min-width: 0; }
.utodo-title {
  margin: 0;
  font-size: var(--ut-fs-2xl);
  font-weight: 640;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.utodo-sub {
  margin: var(--ut-s1) 0 0;
  font-size: var(--ut-fs-sm);
  line-height: 1.5;
  opacity: var(--ut-o-3);
}
.utodo-head-tools { display: inline-flex; align-items: center; gap: var(--ut-s2); margin-left: auto; }

/* ------------------------------------------------------- 分段控件（统一） */

.utodo-tabs,
.utodo-views,
.utodo-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--ut-r-md);
  background: var(--ut-tint);
  border: 1px solid var(--ut-line);
}

.utodo-tab,
.utodo-view,
.utodo-seg-btn {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--ut-s1);
  font-size: var(--ut-fs-sm);
  line-height: 1;
  height: 28px;
  padding: 0 var(--ut-s3);
  border-radius: var(--ut-r-sm);
  opacity: var(--ut-o-2);
  white-space: nowrap;
  transition: background-color var(--ut-dur) var(--ut-ease), opacity var(--ut-dur) var(--ut-ease);
}
.utodo-tab:hover,
.utodo-view:hover,
.utodo-seg-btn:hover { opacity: 1; background: var(--ut-tint); }

.utodo-tab.is-active,
.utodo-view.is-active,
.utodo-seg-btn.is-active {
  opacity: 1;
  background: var(--ut-tint-strong);
  box-shadow: inset 0 0 0 1px var(--ut-line-strong);
}

.utodo-tab-count,
.utodo-view-count {
  font-size: var(--ut-fs-xs);
  font-variant-numeric: tabular-nums;
  opacity: var(--ut-o-3);
}
.utodo-tab.is-active .utodo-tab-count,
.utodo-view.is-active .utodo-view-count { opacity: var(--ut-o-2); }

.utodo-seg-btn { height: 24px; padding: 0 var(--ut-s2); font-size: var(--ut-fs-xs); }

/* ------------------------------------------------------------- 输入区 */

.utodo-composer {
  display: flex;
  flex-direction: column;
  gap: var(--ut-s3);
  border: 1px solid var(--ut-line);
  border-radius: var(--ut-r-lg);
  background: var(--ut-tint);
  padding: var(--ut-s3);
  transition: border-color var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease);
}
.utodo-composer:focus-within {
  border-color: var(--ut-line-strong);
  background: var(--ut-tint-strong);
}

.utodo-input,
.utodo-textarea {
  width: 100%;
  background: transparent;
  border: 0;
  outline: none;
  font: inherit;
  font-size: var(--ut-fs-base);
  line-height: 1.6;
  padding: 2px;
  color: inherit;
}
.utodo-input::placeholder,
.utodo-textarea::placeholder { color: inherit; opacity: var(--ut-o-4); }
.utodo-textarea { min-height: 64px; max-height: 220px; resize: vertical; }

.utodo-composer-row { display: flex; align-items: center; gap: var(--ut-s2); flex-wrap: wrap; }
.utodo-spacer { flex: 1 1 auto; }

.utodo-date,
.utodo-days,
.utodo-select,
.utodo-field-input,
.utodo-inline-input {
  background: transparent;
  border: 1px solid var(--ut-line);
  border-radius: var(--ut-r-sm);
  height: 32px;
  padding: 0 var(--ut-s2);
  font: inherit;
  font-size: var(--ut-fs-sm);
  color: inherit;
  outline: none;
  transition: border-color var(--ut-dur) var(--ut-ease);
}
.utodo-date:focus,
.utodo-days:focus,
.utodo-select:focus,
.utodo-field-input:focus,
.utodo-inline-input:focus { border-color: var(--ut-line-strong); }
.utodo-select { cursor: pointer; }
.utodo-select option { color: var(--ut-option-fg); background: var(--ut-option-bg); }
.utodo-days { width: 48px; text-align: center; padding: 0 var(--ut-s1); }
/* The reminder cluster: a date plus a time, both the same height as every other
   field so the composer row cannot shear. */
.utodo-remind { display: inline-flex; align-items: center; gap: var(--ut-s1); }
.utodo-remind-date { width: 124px; }
.utodo-remind-time { width: 88px; }
.utodo-inline-input { flex: 1 1 auto; min-width: 0; font-size: var(--ut-fs-base); }
.utodo-dash { opacity: var(--ut-o-4); font-size: var(--ut-fs-sm); }
.utodo-time-label {
  font-size: var(--ut-fs-xs);
  opacity: var(--ut-o-3);
  white-space: nowrap;
}

.utodo-quick { display: inline-flex; gap: var(--ut-s1); }
.utodo-quick-btn {
  appearance: none;
  border: 1px solid var(--ut-line);
  background: transparent;
  border-radius: var(--ut-r-pill);
  height: 26px;
  padding: 0 var(--ut-s2);
  font-size: var(--ut-fs-xs);
  cursor: pointer;
  opacity: var(--ut-o-2);
  transition: opacity var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease), border-color var(--ut-dur) var(--ut-ease), color var(--ut-dur) var(--ut-ease);
}
.utodo-quick-btn:hover { opacity: 1; background: var(--ut-tint); }
.utodo-quick-btn:disabled { opacity: var(--ut-o-4); cursor: default; background: transparent; }
.utodo-quick-btn.is-star,
.utodo-quick-btn.is-remind {
  color: var(--ut-accent-ink);
  border-color: var(--ut-accent-line);
  background: var(--ut-accent-soft);
  opacity: 1;
}

/* --------------------------------------------------------------- 按钮 */

.utodo-add {
  appearance: none;
  border: 0;
  border-radius: var(--ut-r-sm);
  height: 32px;
  padding: 0 var(--ut-s4);
  font-size: var(--ut-fs-md);
  font-weight: 560;
  cursor: pointer;
  background: var(--ut-accent);
  color: var(--ut-on-accent);
  box-shadow: var(--ut-shadow-1);
  transition: filter var(--ut-dur) var(--ut-ease), opacity var(--ut-dur) var(--ut-ease), box-shadow var(--ut-dur) var(--ut-ease);
}
.utodo-add:hover { filter: brightness(1.05); box-shadow: none; }
.utodo-add:disabled { opacity: 0.4; cursor: default; filter: none; box-shadow: none; }

.utodo-ghost {
  appearance: none;
  border: 1px solid var(--ut-line);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: var(--ut-fs-sm);
  line-height: 1;
  height: 30px;
  padding: 0 var(--ut-s3);
  border-radius: var(--ut-r-sm);
  opacity: var(--ut-o-2);
  transition: opacity var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease), border-color var(--ut-dur) var(--ut-ease), color var(--ut-dur) var(--ut-ease);
}
.utodo-ghost:hover { opacity: 1; background: var(--ut-tint); }
.utodo-ghost.is-on {
  opacity: 1;
  border-color: var(--ut-accent-line);
  color: var(--ut-accent-ink);
  background: var(--ut-accent-soft);
}

.utodo-icon-btn {
  appearance: none;
  border: 0;
  background: transparent;
  width: 28px;
  height: 28px;
  border-radius: var(--ut-r-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: var(--ut-o-3);
  transition: opacity var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease), color var(--ut-dur) var(--ut-ease);
}
.utodo-icon-btn:hover { opacity: 1; background: var(--ut-tint-strong); }
.utodo-icon-btn.is-danger:hover { color: var(--ut-danger); background: var(--ut-danger-soft); }
.utodo-star.is-on { color: var(--ut-accent-ink); opacity: 1; }

.utodo-confirm {
  appearance: none;
  border: 1px solid var(--ut-danger-line);
  background: var(--ut-danger-soft);
  color: var(--ut-danger);
  border-radius: var(--ut-r-xs);
  font-size: var(--ut-fs-xs);
  height: 26px;
  padding: 0 var(--ut-s2);
  cursor: pointer;
  white-space: nowrap;
}

/* ------------------------------------------------- 多选条与多选态 */

.utodo-selectbar {
  position: sticky;
  top: var(--ut-s2);
  z-index: 6;
  display: flex;
  align-items: center;
  gap: var(--ut-s2);
  margin: var(--ut-s4) 0 var(--ut-s1);
  padding: var(--ut-s2) var(--ut-s3);
  border: 1px solid var(--ut-accent-line);
  border-radius: var(--ut-r-md);
  background: var(--ut-accent-soft);
  backdrop-filter: blur(8px);
  box-shadow: var(--ut-shadow-1);
  font-size: var(--ut-fs-sm);
}
.utodo-selectbar-count { font-variant-numeric: tabular-nums; opacity: var(--ut-o-2); }

.utodo-selectbox {
  appearance: none;
  border: 1.5px solid var(--ut-line-strong);
  background: transparent;
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 2px;
  padding: 0;
  border-radius: var(--ut-r-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease);
}
.utodo-selectbox:hover { border-color: var(--ut-accent-ink); }
.utodo-selectbox.is-on { background: var(--ut-accent); border-color: var(--ut-accent-ink); }
.utodo-selectbox svg { opacity: 0; transition: opacity var(--ut-dur) var(--ut-ease); }
.utodo-selectbox.is-on svg { opacity: 1; }

/* ------------------------------------------------------------ 分组标题 */

.utodo-group { margin-top: var(--ut-s6); }
.utodo-group-head {
  display: flex;
  align-items: baseline;
  gap: var(--ut-s2);
  margin: 0 0 var(--ut-s2);
  padding: 0 var(--ut-s1);
}
.utodo-group-label {
  font-size: var(--ut-fs-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: var(--ut-o-3);
}
.utodo-group-count {
  font-size: var(--ut-fs-xs);
  opacity: var(--ut-o-4);
  font-variant-numeric: tabular-nums;
}
.utodo-group.is-overdue .utodo-group-label { color: var(--ut-danger); opacity: 1; }
.utodo-group.is-today .utodo-group-label { color: var(--ut-accent-ink); opacity: 1; }
.utodo-group + .utodo-group { border-top: 1px solid var(--ut-line); padding-top: var(--ut-s3); }

/* -------------------------------------------------------------- 视图区 */

.utodo-view-body { margin-top: var(--ut-s5); }
.utodo-panel { margin-top: var(--ut-s5); }

.utodo-pin {
  border-left: 2px solid var(--ut-line-strong);
  padding-left: var(--ut-s3);
}
.utodo-pin.utodo-panel {
  border: 1px solid var(--ut-line);
  border-left-width: 2px;
  border-radius: var(--ut-r-lg);
  background: var(--ut-tint);
  padding: var(--ut-s3) var(--ut-s4);
}
.utodo-pin.utodo-panel .utodo-pin-head { margin-bottom: var(--ut-s2); }
.utodo-pin.utodo-panel .utodo-row { padding: var(--ut-s2); }
.utodo-pin.is-important { border-left-color: var(--ut-accent-ink); }
.utodo-pin.is-soon { border-left-color: var(--ut-accent-line); }
.utodo-pin-head {
  display: flex;
  align-items: center;
  gap: var(--ut-s2);
  margin: 0 0 var(--ut-s2);
  flex-wrap: wrap;
  padding: 0 var(--ut-s1);
}
.utodo-pin-label {
  font-size: var(--ut-fs-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: var(--ut-s1);
  opacity: var(--ut-o-2);
}
.utodo-pin-label svg { flex: 0 0 auto; }
.utodo-pin.is-important .utodo-pin-label { color: var(--ut-accent-ink); opacity: 1; }
.utodo-pin-count { font-size: var(--ut-fs-xs); opacity: var(--ut-o-4); font-variant-numeric: tabular-nums; }
.utodo-pin-note { font-size: var(--ut-fs-xs); opacity: var(--ut-o-3); }
.utodo-pin-range { display: inline-flex; align-items: center; gap: var(--ut-s1); margin-left: auto; }
.utodo-pin-range .utodo-seg-btn { height: 22px; }

/* ---------------------------------------------------------------- 列表 */

.utodo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ut-s1);
}

.utodo-row {
  display: flex;
  align-items: flex-start;
  gap: var(--ut-s3);
  padding: var(--ut-s2) var(--ut-s3);
  border-radius: var(--ut-r-md);
  border: 1px solid transparent;
  transition: background-color var(--ut-dur) var(--ut-ease), border-color var(--ut-dur) var(--ut-ease);
}
.utodo-row:hover { background: var(--ut-tint); border-color: var(--ut-line); }
.utodo-row.is-selectable { cursor: pointer; }
.utodo-row.is-selected { background: var(--ut-accent-soft); border-color: var(--ut-accent-line); }

.utodo-check {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  padding: 0;
  border-radius: var(--ut-r-pill);
  border: 1.5px solid var(--ut-line-strong);
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease);
}
.utodo-check:hover { border-color: var(--ut-accent-ink); }
.utodo-check.is-done { background: var(--ut-accent); border-color: var(--ut-accent-ink); }
.utodo-check svg { opacity: 0; transition: opacity var(--ut-dur) var(--ut-ease); }
.utodo-check.is-done svg { opacity: 1; }

.utodo-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.utodo-row-title { font-size: var(--ut-fs-base); line-height: 1.55; word-break: break-word; cursor: text; }
.utodo-row.is-done .utodo-row-title { text-decoration: line-through; opacity: var(--ut-o-4); }

.utodo-meta {
  display: inline-flex;
  align-items: center;
  gap: var(--ut-s1);
  font-size: var(--ut-fs-xs);
  line-height: 1.5;
  opacity: var(--ut-o-3);
  font-variant-numeric: tabular-nums;
}
.utodo-meta-dot { width: 3px; height: 3px; border-radius: var(--ut-r-pill); background: currentColor; opacity: var(--ut-o-2); }

.utodo-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border-radius: var(--ut-r-pill);
  height: 18px;
  padding: 0 var(--ut-s2);
  font-size: var(--ut-fs-xs);
  background: var(--ut-tint-strong);
}
.utodo-badge.is-accent,
.utodo-badge.is-star,
.utodo-badge.is-remind { background: var(--ut-accent-soft); color: var(--ut-accent-ink); }
.utodo-badge.is-danger { background: var(--ut-danger-soft); color: var(--ut-danger); }

.utodo-row-actions {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--ut-s1);
  opacity: 0;
  transition: opacity var(--ut-dur) var(--ut-ease);
}
.utodo-row:hover .utodo-row-actions,
.utodo-row:focus-within .utodo-row-actions,
.utodo-row.is-selected .utodo-row-actions { opacity: 1; }

.utodo-inline-editor { display: flex; flex-direction: column; gap: var(--ut-s2); padding: var(--ut-s1) 0; }

/* ---------------------------------------------------------- 空状态 */

.utodo-empty {
  margin-top: var(--ut-s6);
  padding: var(--ut-s6) var(--ut-s5);
  border: 1px dashed var(--ut-line);
  border-radius: var(--ut-r-lg);
  text-align: center;
}
.utodo-empty-title { margin: 0; font-size: var(--ut-fs-base); font-weight: 560; opacity: var(--ut-o-2); }
.utodo-empty-text {
  margin: var(--ut-s2) auto 0;
  max-width: 42ch;
  font-size: var(--ut-fs-sm);
  line-height: 1.6;
  opacity: var(--ut-o-3);
}
.utodo-empty.is-compact {
  margin-top: var(--ut-s4);
  padding: var(--ut-s4) var(--ut-s3);
  border-radius: var(--ut-r-md);
}
.utodo-empty.is-compact .utodo-empty-title { font-size: var(--ut-fs-md); }
.utodo-empty.is-compact .utodo-empty-text { font-size: var(--ut-fs-sm); margin-top: var(--ut-s1); }

/* ---------------------------------------------------------------- 想法 */

.utodo-ideas {
  list-style: none;
  margin: var(--ut-s4) 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--ut-s3);
}

.utodo-idea {
  display: flex;
  flex-direction: column;
  gap: var(--ut-s2);
  border: 1px solid var(--ut-line);
  border-radius: var(--ut-r-lg);
  background: var(--ut-tint);
  padding: var(--ut-s3);
  transition: border-color var(--ut-dur) var(--ut-ease), background-color var(--ut-dur) var(--ut-ease);
}
.utodo-idea:hover { border-color: var(--ut-line-strong); background: var(--ut-tint-strong); }
.utodo-idea.is-selectable { display: flex; flex-direction: row; align-items: flex-start; cursor: pointer; }
.utodo-idea.is-selected { background: var(--ut-accent-soft); border-color: var(--ut-accent-line); }
.utodo-idea-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: var(--ut-s2); }
.utodo-idea-text {
  margin: 0;
  font-size: var(--ut-fs-base);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
.utodo-idea-foot { display: flex; align-items: center; gap: var(--ut-s2); flex-wrap: wrap; }

.utodo-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--ut-s1);
  border-radius: var(--ut-r-pill);
  height: 20px;
  padding: 0 var(--ut-s2);
  font-size: var(--ut-fs-xs);
  font-weight: 500;
  background: var(--ut-tag-bg, var(--ut-accent-soft));
  color: var(--ut-tag-fg, var(--ut-accent-ink));
  box-shadow: inset 0 0 0 1px var(--ut-tag-line, transparent);
}
.utodo-chip-x {
  appearance: none;
  border: 0;
  background: transparent;
  padding: 0;
  margin-left: 1px;
  cursor: pointer;
  color: inherit;
  opacity: var(--ut-o-3);
  font-size: var(--ut-fs-sm);
  line-height: 1;
}
.utodo-chip-x:hover { opacity: 1; }
.utodo-chip-add {
  appearance: none;
  border: 1px dashed var(--ut-line-strong);
  background: transparent;
  border-radius: var(--ut-r-pill);
  height: 20px;
  padding: 0 var(--ut-s2);
  font-size: var(--ut-fs-xs);
  cursor: pointer;
  opacity: var(--ut-o-3);
  transition: opacity var(--ut-dur) var(--ut-ease), border-color var(--ut-dur) var(--ut-ease);
}
.utodo-chip-add:hover { opacity: 1; border-color: var(--ut-accent-line); }

.utodo-tagbox { display: flex; align-items: center; gap: var(--ut-s1); flex-wrap: wrap; flex: 1 1 auto; }
.utodo-tag-input {
  flex: 0 0 auto;
  width: 112px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--ut-line);
  border-radius: var(--ut-r-pill);
  outline: none;
  font: inherit;
  font-size: var(--ut-fs-sm);
  color: inherit;
  padding: 0 var(--ut-s2);
  transition: border-color var(--ut-dur) var(--ut-ease);
}
.utodo-tag-input:focus { border-color: var(--ut-line-strong); }
.utodo-tag-input::placeholder { color: inherit; opacity: var(--ut-o-4); }

.utodo-filters { display: flex; align-items: center; gap: var(--ut-s1); flex-wrap: wrap; margin-top: var(--ut-s4); }
.utodo-filter {
  appearance: none;
  border: 1px solid var(--ut-tag-line, var(--ut-line));
  background: transparent;
  border-radius: var(--ut-r-pill);
  height: 24px;
  padding: 0 var(--ut-s2);
  font-size: var(--ut-fs-xs);
  cursor: pointer;
  opacity: var(--ut-o-2);
  color: var(--ut-tag-fg, inherit);
  transition: opacity var(--ut-dur) var(--ut-ease), border-color var(--ut-dur) var(--ut-ease), color var(--ut-dur) var(--ut-ease);
}
.utodo-filter:hover { opacity: 1; }
.utodo-filter.is-active {
  opacity: 1;
  font-weight: 500;
  border-color: var(--ut-tag-line, var(--ut-accent-line));
  color: var(--ut-tag-fg, var(--ut-accent-ink));
  background: var(--ut-tag-bg, var(--ut-accent-soft));
}

/* ------------------------------------------------------------ 设置卡片 */

.utodo-settings {
  margin-top: var(--ut-s6);
  border: 1px solid var(--ut-line);
  border-radius: var(--ut-r-lg);
  background: var(--ut-tint);
  padding: 0 var(--ut-s4);
}
.utodo-settings[open] { padding-bottom: var(--ut-s4); }
.utodo-settings-summary {
  display: flex;
  align-items: center;
  gap: var(--ut-s2);
  height: 44px;
  font-size: var(--ut-fs-sm);
  opacity: var(--ut-o-2);
  cursor: pointer;
  list-style: none;
}
.utodo-settings-summary::-webkit-details-marker { display: none; }
.utodo-settings-summary::after {
  content: "";
  width: 6px;
  height: 6px;
  margin-left: auto;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  transition: transform var(--ut-dur) var(--ut-ease);
  opacity: var(--ut-o-3);
}
.utodo-settings[open] .utodo-settings-summary::after { transform: rotate(-135deg); }
.utodo-settings-body { display: flex; flex-direction: column; gap: var(--ut-s3); }

.utodo-field { display: flex; flex-direction: column; gap: 6px; }
.utodo-field.is-check {
  flex-direction: row;
  align-items: center;
  gap: var(--ut-s2);
  font-size: var(--ut-fs-sm);
  opacity: var(--ut-o-2);
  cursor: pointer;
}
.utodo-field.is-check input { accent-color: var(--ut-accent-ink); width: 14px; height: 14px; margin: 0; }
.utodo-field-label { font-size: var(--ut-fs-xs); opacity: var(--ut-o-3); }
.utodo-field-input { width: 100%; font-size: var(--ut-fs-base); }
.utodo-hint { margin: 0; font-size: var(--ut-fs-sm); line-height: 1.6; opacity: var(--ut-o-3); }

/* ------------------------------------------------------------ 页脚与提示 */

.utodo-foot {
  margin-top: var(--ut-s6);
  font-size: var(--ut-fs-xs);
  opacity: var(--ut-o-4);
  text-align: center;
  line-height: 1.6;
}

.utodo-toast {
  position: fixed;
  left: 50%;
  bottom: var(--ut-s5);
  transform: translateX(-50%);
  z-index: 20;
  max-width: min(560px, calc(100vw - 48px));
  padding: var(--ut-s2) var(--ut-s4);
  border-radius: var(--ut-r-pill);
  background: var(--ut-toast-bg);
  color: var(--ut-toast-fg);
  box-shadow: var(--ut-shadow-2);
  font-size: var(--ut-fs-sm);
  line-height: 1.5;
  animation: utodo-rise var(--ut-dur) var(--ut-ease);
}
.utodo-toast.is-warn { background: var(--ut-danger); color: var(--ut-toast-fg); }

@keyframes utodo-rise {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 560px) {
  .utodo-head { flex-direction: column; align-items: stretch; }
  .utodo-head-tools { margin-left: 0; }
  .utodo-shell { padding: var(--ut-s5) var(--ut-s4) var(--ut-s7); }
}

@media (prefers-reduced-motion: reduce) {
  .utodo-root *,
  .utodo-root *::after { transition-duration: 0ms; animation-duration: 0ms; }
}
`;

    function injectStyle() {
      if (typeof document === "undefined") return;
      if (document.getElementById("dsh-utodo-style")) return;
      const el = document.createElement("style");
      el.id = "dsh-utodo-style";
      el.textContent = CSS;
      document.head.appendChild(el);
    }

    /* ---------------------------------------------------------------- dates */

    const pad2 = n => (n < 10 ? "0" + n : String(n));

    function isoOf(date) {
      return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
    }

    function todayISO() {
      return isoOf(new Date());
    }

    function parseISO(value) {
      const parts = String(value).split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    function isISO(value) {
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function shiftISO(value, days) {
      const date = parseISO(value);
      date.setDate(date.getDate() + days);
      return isoOf(date);
    }

    function diffDays(a, b) {
      return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000);
    }

    function nextMonday() {
      const today = todayISO();
      const weekday = parseISO(today).getDay();
      return shiftISO(today, ((8 - weekday) % 7) || 7);
    }

    function shortDate(value) {
      const date = parseISO(value);
      return date.getMonth() + 1 + "月" + date.getDate() + "日";
    }

    function weekdayOf(value) {
      return "周" + WEEKDAYS[parseISO(value).getDay()];
    }

    function rangeLabel(start, end) {
      const from = shortDate(start);
      const to = shortDate(end);
      const sameMonth = start.slice(0, 7) === end.slice(0, 7);
      const tail = sameMonth ? to.slice(to.indexOf("月") + 1) : to;
      return sameMonth ? from + " – " + tail : from + " – " + to;
    }

    /** Everything the row meta line says about the schedule. */
    function scheduleOf(todo, today) {
      const start = isISO(todo.start) ? todo.start : null;
      const end = isISO(todo.end) && todo.end !== start ? todo.end : null;
      if (!start) return { kind: "none", label: "未设日期", badge: "someday" };
      if (end) {
        if (today < start) {
          return { kind: "upcoming", label: rangeLabel(start, end), badge: "range", span: diffDays(end, start) + 1 };
        }
        if (today > end) {
          return { kind: "overdue", label: "已结束 · " + rangeLabel(start, end), badge: "overdue" };
        }
        const left = diffDays(end, today);
        return {
          kind: "current",
          label: rangeLabel(start, end),
          badge: "active-range",
          note: left === 0 ? "今天截止" : "剩余 " + left + " 天",
        };
      }
      const delta = diffDays(start, today);
      if (delta === 0) return { kind: "current", label: shortDate(start) + " · 今天", badge: "today" };
      if (delta === 1) return { kind: "upcoming", label: shortDate(start) + " · 明天", badge: "upcoming" };
      if (delta === -1) return { kind: "overdue", label: "昨天 · " + shortDate(start), badge: "overdue" };
      if (delta < -1) return { kind: "overdue", label: shortDate(start) + " · 逾期 " + -delta + " 天", badge: "overdue" };
      if (delta <= 7) return { kind: "upcoming", label: shortDate(start) + " · " + weekdayOf(start), badge: "upcoming" };
      return { kind: "upcoming", label: shortDate(start) + " · " + weekdayOf(start), badge: "upcoming" };
    }

    /* -------------------------------------------------------------- storage */

    const DEFAULT_SETTINGS = { soonDays: 2 };

    function emptyData() {
      return {
        todos: [],
        ideas: [],
        settings: Object.assign({}, DEFAULT_SETTINGS, { tagTones: {}, push: normalizePush(null) }),
      };
    }

    const PUSH_CHANNELS = ["wecom", "serverchan", "pushplus", "custom"];

    /* Where a reminder goes. The address is user-supplied: this plugin ships no
       token and talks to no server of its own. */
    function normalizePush(raw) {
      const push = { enabled: false, channel: "wecom", target: "", desktop: false };
      if (!raw || typeof raw !== "object") return push;
      if (raw.enabled === true) push.enabled = true;
      if (typeof raw.channel === "string" && PUSH_CHANNELS.indexOf(raw.channel) !== -1) push.channel = raw.channel;
      if (typeof raw.target === "string") push.target = raw.target.trim();
      if (raw.desktop === true) push.desktop = true;
      return push;
    }

    function normalizeSettings(raw) {
      const settings = Object.assign({}, DEFAULT_SETTINGS, { tagTones: normalizeToneMap(raw && raw.tagTones) });
      settings.push = normalizePush(raw && raw.push);
      if (!raw || typeof raw !== "object") return settings;
      const days = Math.round(Number(raw.soonDays));
      if (Number.isFinite(days) && days >= 1) settings.soonDays = Math.min(365, days);
      return settings;
    }

    function normalizeTodo(raw) {
      if (!raw || typeof raw !== "object") return null;
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (!title) return null;
      const start = isISO(raw.start) ? raw.start : null;
      let end = isISO(raw.end) && raw.end !== start ? raw.end : null;
      if (start && end && end < start) end = null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
        title: title,
        done: raw.done === true,
        important: raw.important === true,
        start: start,
        end: end,
        /* Every todo can remind. The firing day is one concrete date clamped to
           the todo's last day; a todo without dates reminds on the day the
           reminder was set. */
        remind: isTime(raw.remind) ? raw.remind : null,
        remindDay: isTime(raw.remind) ? clampRemindDay(raw.remindDay, start, end) : null,
        remindSent: typeof raw.remindSent === "string" ? raw.remindSent : null,
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
      };
    }

    function normalizeTags(raw) {
      if (!Array.isArray(raw)) return [];
      const seen = [];
      for (const item of raw) {
        const tag = cleanTag(item);
        if (tag && seen.indexOf(tag) === -1) seen.push(tag);
      }
      return seen;
    }

    function normalizeIdea(raw) {
      if (!raw || typeof raw !== "object") return null;
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      if (!text) return null;
      return {
        id: typeof raw.id === "string" && raw.id ? raw.id : newId(),
        text: text,
        tags: normalizeTags(raw.tags),
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
      };
    }

    function normalizeData(raw) {
      const data = emptyData();
      if (!raw || typeof raw !== "object") return data;
      if (Array.isArray(raw.todos)) {
        for (const item of raw.todos) {
          const todo = normalizeTodo(item);
          if (todo) data.todos.push(todo);
        }
      }
      if (Array.isArray(raw.ideas)) {
        for (const item of raw.ideas) {
          const idea = normalizeIdea(item);
          if (idea) data.ideas.push(idea);
        }
      }
      data.settings = normalizeSettings(raw.settings);
      assignTagTones(data);
      return data;
    }

    function loadData() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? normalizeData(JSON.parse(raw)) : emptyData();
      } catch (error) {
        return emptyData();
      }
    }

    function saveData(data) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          todos: data.todos,
          ideas: data.ideas,
          settings: data.settings,
        }));
      } catch (error) {
        /* storage may be unavailable; the panel keeps working in memory. */
      }
    }

    /* ---------------------------------------------------------- reminders */

    /* A reminder fires at a wall-clock time on one concrete day. Six hours of
       grace covers a laptop that was asleep or a panel that was closed at the
       minute itself; anything older is marked quietly instead of pushed late. */
    const REMIND_GRACE_MS = 6 * 60 * 60 * 1000;

    function isTime(value) {
      return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    }

    /* The last day a todo covers: the end of a range, otherwise its date. */
    function lastDayOf(start, end) {
      if (isISO(end)) return end;
      if (isISO(start)) return start;
      return null;
    }

    /* A reminder may be pulled earlier than the todo starts, but never pushed
       past its last day. A todo with no dates reminds on the day it was set. */
    function clampRemindDay(day, start, end) {
      const cap = lastDayOf(start, end);
      if (!isISO(day)) return cap || todayISO();
      return cap && day > cap ? cap : day;
    }

    function remindDay(todo) {
      if (!todo || !isTime(todo.remind)) return null;
      return clampRemindDay(todo.remindDay, todo.start, todo.end);
    }

    /* The identity of one firing: the day+time pair, so moving a todo's dates
       or its reminder re-arms it. */
    function remindKey(todo) {
      const day = remindDay(todo);
      return day ? day + "T" + todo.remind : null;
    }

    function remindAt(todo) {
      const key = remindKey(todo);
      if (!key) return null;
      const at = new Date(key + ":00").getTime();
      return Number.isFinite(at) ? at : null;
    }

    function pushMessage(todo) {
      const title = "待办提醒：" + todo.title;
      const lines = [title];
      if (isISO(todo.start)) {
        const range = isISO(todo.end) && todo.end !== todo.start;
        lines.push("日期：" + (range ? todo.start + " 至 " + todo.end : todo.start));
      }
      if (isTime(todo.remind)) lines.push("提醒：" + remindDay(todo) + " " + todo.remind);
      if (todo.important === true) lines.push("标记：重要");
      lines.push("来自 DSH 待办与想法");
      return { title: title, content: lines.join("\n") };
    }

    const PUSH_CHANNEL_OPTIONS = [
      { value: "wecom", label: "企业微信群机器人" },
      { value: "serverchan", label: "Server酱" },
      { value: "pushplus", label: "PushPlus" },
      { value: "custom", label: "自定义 Webhook" },
    ];

    const PUSH_CHANNEL_HINTS = {
      wecom: "粘贴群机器人 Webhook 地址：https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=…",
      serverchan: "粘贴 SendKey，或完整的 …/SCT….send 地址",
      pushplus: "粘贴 pushplus.plus 的 token",
      custom: "粘贴任意接收 JSON {title, content} 的 Webhook 地址",
    };

    /* One request per channel, kept pure so a test push and a scheduled push
       cannot drift apart. */
    function pushRequest(push, message) {
      const target = String(push && push.target || "").trim();
      if (!target) return null;
      const channel = push.channel || "wecom";
      if (channel === "serverchan") {
        const base = /^https?:\/\//i.test(target) ? target : "https://sctapi.ftqq.com/" + encodeURIComponent(target) + ".send";
        const url = base + (base.indexOf("?") === -1 ? "?" : "&")
          + "title=" + encodeURIComponent(message.title)
          + "&desp=" + encodeURIComponent(message.content);
        return { method: "GET", url: url, body: null };
      }
      if (channel === "pushplus") {
        return {
          method: "POST",
          url: "https://www.pushplus.plus/send",
          body: { token: target, title: message.title, content: message.content, template: "txt" },
        };
      }
      if (channel === "wecom") {
        return {
          method: "POST",
          url: target,
          body: { msgtype: "text", text: { content: message.title + "\n" + message.content } },
        };
      }
      return { method: "POST", url: target, body: { title: message.title, content: message.content } };
    }

    async function sendRequest(request) {
      const body = request.method === "POST" ? JSON.stringify(request.body) : undefined;
      try {
        const response = await fetch(request.url, request.method === "POST"
          ? { method: "POST", headers: { "content-type": "application/json" }, body: body }
          : { method: "GET" });
        return { ok: response.ok, status: response.status };
      } catch (error) {
        /* A third-party webhook rarely answers the CORS preflight, so the
           readable request fails after the browser already sent it. Retrying as
           an opaque simple request still delivers; only the reply is unreadable. */
        try {
          await fetch(request.url, request.method === "POST"
            ? { method: "POST", mode: "no-cors", body: body }
            : { method: "GET", mode: "no-cors" });
          return { ok: true, opaque: true };
        } catch (error2) {
          return { ok: false, error: String(error2 && error2.message || error2) };
        }
      }
    }

    async function deliverPush(push, message) {
      const request = pushRequest(push, message);
      if (!request) return { ok: false, error: "还没有填写推送地址" };
      return sendRequest(request);
    }

    /* The system notification is a courtesy, never the transport: a browser that
       refuses it must not stop the webhook from firing. */
    function desktopNotify(message) {
      try {
        if (typeof Notification === "undefined") return false;
        if (Notification.permission === "granted") {
          new Notification(message.title, { body: message.content });
          return true;
        }
        if (Notification.permission === "default") Notification.requestPermission();
      } catch (error) {
        /* notifications are optional */
      }
      return false;
    }

    /* ------------------------------------------------------------ importing */

    /* The block one import hands to the conversation: a plain Markdown list,
       because the composer is the reader and the model is the audience. */
    function buildImportText(data, selected) {
      const todos = data.todos.filter(todo => selected["todo:" + todo.id] === true);
      const ideas = data.ideas.filter(idea => selected["idea:" + idea.id] === true);
      if (todos.length === 0 && ideas.length === 0) return "";
      const lines = ["以下内容来自「待办与想法」面板，请结合它们继续："];
      if (todos.length > 0) {
        lines.push("");
        lines.push("**待办**");
        for (const todo of todos) {
          let when = "";
          if (isISO(todo.start)) {
            when = isISO(todo.end) && todo.end !== todo.start
              ? "（" + todo.start + " → " + todo.end + "）"
              : "（" + todo.start + "）";
          }
          const remind = isTime(todo.remind) ? " 提醒 " + remindDay(todo) + " " + todo.remind : "";
          const mark = todo.important === true ? "（重要）" : "";
          lines.push("- [" + (todo.done ? "x" : " ") + "] " + todo.title + when + remind + mark);
        }
      }
      if (ideas.length > 0) {
        lines.push("");
        lines.push("**想法**");
        for (const idea of ideas) {
          const tags = idea.tags.map(tag => "#" + tag).join(" ");
          lines.push("- " + idea.text + (tags ? " " + tags : ""));
        }
      }
      return lines.join("\n");
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (error) {
        /* fall through to the textarea route */
      }
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        return ok;
      } catch (error) {
        return false;
      }
    }

    /* The bridge into the conversation surface is installed by apply(); a panel
       rendered outside the app (a smoke test, an editor preview) simply has none. */
    let sessionBridge = null;

    function serviceOf(ctx, name) {
      try {
        return (typeof ctx.get === "function" ? ctx.get(name) : undefined) || undefined;
      } catch (error) {
        return undefined;
      }
    }

    /* The panel is root-scoped, so the platform never hands it a session id. The
       sources below are ranked: the live right-sidebar seat (when its plugin is
       loaded), then the last conversation header this plugin saw mount, then the
       most recently updated conversation. */
    let lastSessionId = null;

    function noteSession(sessionId) {
      if (typeof sessionId === "string" && sessionId) lastSessionId = sessionId;
    }

    function mountedSession(ctx) {
      const right = serviceOf(ctx, "sidebarRight");
      try {
        const mounted = right && right.mounted;
        const value = mounted && typeof mounted.getSnapshot === "function" ? mounted.getSnapshot() : undefined;
        if (typeof value === "string" && value) return value;
      } catch (error) {
        /* the seat is optional */
      }
      if (lastSessionId) return lastSessionId;
      const sessions = serviceOf(ctx, "sessions");
      try {
        const list = sessions && sessions.list.getSnapshot();
        const ids = list && list.ids;
        if (Array.isArray(ids) && ids.length > 0) return ids[0];
      } catch (error) {
        /* no list yet */
      }
      return null;
    }

    function createBridge(ctx) {
      return {
        currentSession: () => mountedSession(ctx),
        /* Append the block to whatever the composer already holds, then bring the
           conversation back on screen with the caret in it. */
        importToSession: async text => {
          const sessions = serviceOf(ctx, "sessions");
          const sessionId = mountedSession(ctx);
          if (!sessions || !sessionId) return { ok: false, reason: "no-session" };
          let scoped = null;
          try {
            scoped = sessions.scope(sessionId);
          } catch (error) {
            scoped = null;
          }
          const conversation = scoped && typeof scoped.get === "function" ? scoped.get("conversation") : undefined;
          const resolver = conversation && conversation.input;
          if (!resolver || typeof resolver.for !== "function") return { ok: false, reason: "no-input", sessionId: sessionId };
          let input = null;
          try {
            input = resolver.for(scoped);
          } catch (error) {
            input = null;
          }
          if (!input) return { ok: false, reason: "no-input", sessionId: sessionId };
          let draft = "";
          try {
            const state = input.state && typeof input.state.getSnapshot === "function" ? input.state.getSnapshot() : null;
            draft = state && typeof state.draft === "string" ? state.draft : "";
          } catch (error) {
            draft = "";
          }
          try {
            input.setDraft(draft.trim() ? draft.replace(/\s+$/, "") + "\n\n" + text : text);
          } catch (error) {
            return { ok: false, reason: "blocked", sessionId: sessionId };
          }
          try {
            const layout = serviceOf(ctx, "layout");
            if (layout && typeof layout.selectPanel === "function") layout.selectPanel("conversation");
          } catch (error) {
            /* the panel switch is a nicety; the draft already landed */
          }
          try {
            input.focus();
          } catch (error) {
            /* focus is a nicety */
          }
          return { ok: true, sessionId: sessionId };
        },
      };
    }

    /** The header probe: one invisible registrant that reports which conversation
        the platform just mounted, because a root-scoped panel is never told. */
    function SessionProbe(props) {
      useEffect(() => {
        noteSession(props.sessionId);
      }, [props.sessionId]);
      return null;
    }
    function newId() {
      const cryptoObj = typeof crypto !== "undefined" ? crypto : undefined;
      if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
      return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }

    function cleanTag(value) {
      return String(value == null ? "" : value).replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, 24);
    }

    /* Six muted Morandi tones. A tag's colour is picked by a stable hash of its
       label, so the same tag looks identical in the composer, the filter row and
       every card, stays stable across reloads, and needs no extra stored state —
       while the palette itself never grows past six clearly distinguishable hues. */
    const TAG_PALETTE = [
      { name: "雾蓝", fg: "#5c7893", bg: "rgba(124, 156, 184, 0.16)", line: "rgba(124, 156, 184, 0.42)" },
      { name: "灰绿", fg: "#67805e", bg: "rgba(134, 158, 124, 0.16)", line: "rgba(134, 158, 124, 0.42)" },
      { name: "豆沙", fg: "#966c6c", bg: "rgba(186, 142, 142, 0.17)", line: "rgba(186, 142, 142, 0.42)" },
      { name: "藕紫", fg: "#75618c", bg: "rgba(150, 130, 178, 0.17)", line: "rgba(150, 130, 178, 0.44)" },
      { name: "驼杏", fg: "#8b724a", bg: "rgba(180, 154, 110, 0.18)", line: "rgba(180, 154, 110, 0.44)" },
      { name: "墨青", fg: "#3d5f68", bg: "rgba(110, 148, 158, 0.16)", line: "rgba(110, 148, 158, 0.42)" },
    ];

    function hashTag(tag) {
      const text = String(tag);
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      return hash;
    }

    /* The tone a tag holds, or would hold: an unassigned tag previews the next free
       tone, which is exactly the one assignTagTones gives it. */
    function toneForTag(tag, tones) {
      const map = tones && typeof tones === "object" ? tones : {};
      if (Number.isInteger(map[tag])) return map[tag];
      const used = new Set(Object.keys(map).map(key => map[key]));
      for (let i = 0; i < TAG_PALETTE.length; i += 1) {
        if (!used.has(i)) return i;
      }
      return hashTag(tag) % TAG_PALETTE.length;
    }

    /* Tags take the tones in order of first appearance (see assignTagTones), so the
       first six tags always own six different colours; only beyond six tags does a
       tone have to be reused. */
    function tagColor(tag, tones) {
      const tone = TAG_PALETTE[toneForTag(tag, tones)] || TAG_PALETTE[0];
      return {
        "--ut-tag-fg": tone.fg,
        "--ut-tag-bg": tone.bg,
        "--ut-tag-line": tone.line,
      };
    }

    function normalizeToneMap(raw) {
      const map = {};
      if (!raw || typeof raw !== "object") return map;
      for (const key of Object.keys(raw)) {
        const tone = Math.round(Number(raw[key]));
        if (key && Number.isInteger(tone) && tone >= 0 && tone < TAG_PALETTE.length) map[key] = tone;
      }
      return map;
    }

    /* Assign a still-unused tone to every tag that has none yet, in the order the
       tags first appear, then persist that map in settings so a tag keeps its
       colour for good - even if it is removed from an idea and comes back later. */
    function assignTagTones(data) {
      const tones = Object.assign({}, data.settings && data.settings.tagTones);
      const seen = new Set();
      const order = [];
      for (const idea of data.ideas) {
        for (const tag of idea.tags) {
          if (!seen.has(tag)) { seen.add(tag); order.push(tag); }
        }
      }
      for (const tag of order) {
        if (Number.isInteger(tones[tag])) continue;
        tones[tag] = toneForTag(tag, tones);
      }
      data.settings = Object.assign({}, data.settings, { tagTones: tones });
      return tones;
    }

    /* ------------------------------------------------------------- grouping */

    function groupTodos(todos, today) {
      const groups = {
        overdue: [],
        current: [],
        upcoming: [],
        someday: [],
        done: [],
      };
      for (const todo of todos) {
        if (todo.done) {
          groups.done.push(todo);
          continue;
        }
        const schedule = scheduleOf(todo, today);
        if (schedule.kind === "overdue") groups.overdue.push(todo);
        else if (schedule.kind === "current") groups.current.push(todo);
        else if (schedule.kind === "upcoming") groups.upcoming.push(todo);
        else groups.someday.push(todo);
      }
      const keyOf = todo => (todo.end && todo.end !== todo.start ? todo.end : todo.start) || "9999-12-31";
      groups.overdue.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
      groups.current.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
      groups.upcoming.sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
      groups.someday.sort((a, b) => b.createdAt - a.createdAt);
      groups.done.sort((a, b) => b.createdAt - a.createdAt);
      return groups;
    }

    /* The date a todo is judged against: a range counts by its deadline. */
    function dueOf(todo) {
      if (isISO(todo.end) && todo.end !== todo.start) return todo.end;
      return isISO(todo.start) ? todo.start : null;
    }

    /* 重要事项: every starred todo, open ones first, then by deadline. */
    function pickImportant(todos) {
      return todos.filter(todo => todo.important === true).sort((a, b) => {
        if (!!a.done !== !!b.done) return a.done ? 1 : -1;
        return (dueOf(a) || "9999-12-31").localeCompare(dueOf(b) || "9999-12-31") || b.createdAt - a.createdAt;
      });
    }

    /* 临期事项: open todos whose deadline falls in today..today+days. */
    function pickSoon(todos, today, days) {
      const span = Math.max(1, Math.round(Number(days) || 1));
      return todos.filter(todo => {
        if (todo.done) return false;
        const due = dueOf(todo);
        if (!due) return false;
        const left = diffDays(due, today);
        return left >= 0 && left <= span;
      }).sort((a, b) => dueOf(a).localeCompare(dueOf(b)));
    }

    const GROUP_ORDER = [
      { key: "overdue", label: "逾期", className: "is-overdue" },
      { key: "current", label: "今天", className: "is-today" },
      { key: "upcoming", label: "即将到来", className: "" },
      { key: "someday", label: "未设日期", className: "" },
      { key: "done", label: "已完成", className: "is-done" },
    ];

    /* ------------------------------------------------------------ components */

    function IconCheck(props) {
      return h(
        "svg",
        { width: props && props.size ? props.size : 10, height: props && props.size ? props.size : 10, viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false" },
        h("path", { d: "M1.4 5.2 3.7 7.5 8.6 2.6", fill: "none", stroke: "#221a10", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }),
      );
    }

    function IconTrash() {
      return h(
        "svg",
        { width: 13, height: 13, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false" },
        h("path", { d: "M3.2 4.4h9.6M6.4 4.4V3.2c0-.5.4-.9.9-.9h1.4c.5 0 .9.4.9.9v1.2M4.6 4.4l.5 8c0 .5.4.9.9.9h4c.5 0 .9-.4.9-.9l.5-8", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round", strokeLinejoin: "round" }),
      );
    }

    function IconStar(props) {
      const size = props && props.size ? props.size : 13;
      return h(
        "svg",
        { width: size, height: size, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false" },
        h("path", {
          d: "M8 2.2l1.75 3.55 3.9.57-2.82 2.75.67 3.9L8 11.13l-3.5 1.84.67-3.9L2.35 6.32l3.9-.57z",
          fill: props && props.filled ? "currentColor" : "none",
          stroke: "currentColor",
          strokeWidth: 1.2,
          strokeLinejoin: "round",
        }),
      );
    }

    function IconX(props) {
      const size = props && props.size ? props.size : 12;
      return h(
        "svg",
        { width: size, height: size, viewBox: "0 0 12 12", "aria-hidden": "true", focusable: "false" },
        h("path", { d: "M2.5 2.5l7 7M9.5 2.5l-7 7", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" }),
      );
    }

    /** The sidebar's entry glyph; the sidebar owns the button around it. */
    function PanelIcon(props) {
      const size = props && props.size ? props.size : 16;
      return h(
        "svg",
        { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", focusable: "false" },
        h("rect", { x: 2.4, y: 1.9, width: 11.2, height: 12.2, rx: 2.6, stroke: "currentColor", strokeWidth: 1.2 }),
        h("path", { d: "M4.9 5.5l1 1 1.9-1.9", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" }),
        h("path", { d: "M9.3 5.9h1.9", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" }),
        h("path", { d: "M4.9 10l1 1 1.9-1.9", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" }),
        h("path", { d: "M9.3 10.4h1.9", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" }),
      );
    }

    /** Single date, date range, or no date at all. */
    function DateFields(props) {
      const value = props.value || { start: null, end: null };
      const compact = props.compact === true;
      const start = isISO(value.start) ? value.start : null;
      const end = isISO(value.end) && value.end !== start ? value.end : null;
      const mode = !start ? "none" : end ? "range" : "single";

      function setMode(next) {
        if (next === "none") return props.onChange({ start: null, end: null });
        if (next === "single") return props.onChange({ start: start || todayISO(), end: null });
        const from = start || todayISO();
        return props.onChange({ start: from, end: end && end >= from ? end : shiftISO(from, 2) });
      }

      function setStart(next) {
        if (!isISO(next)) return;
        if (mode === "range") {
          const to = end && end >= next ? end : next;
          return props.onChange({ start: next, end: to });
        }
        return props.onChange({ start: next, end: null });
      }

      function setEnd(next) {
        if (!isISO(next)) return;
        const from = start || todayISO();
        return props.onChange({ start: from, end: next < from ? from : next });
      }

      const nodes = [
        h(
          "div",
          { key: "seg", className: "utodo-seg" },
          h("button", { type: "button", className: "utodo-seg-btn" + (mode === "none" ? " is-active" : ""), onClick: () => setMode("none"), "aria-pressed": mode === "none" }, "无日期"),
          h("button", { type: "button", className: "utodo-seg-btn" + (mode === "single" ? " is-active" : ""), onClick: () => setMode("single"), "aria-pressed": mode === "single" }, "单日"),
          h("button", { type: "button", className: "utodo-seg-btn" + (mode === "range" ? " is-active" : ""), onClick: () => setMode("range"), "aria-pressed": mode === "range" }, "区间"),
        ),
      ];

      if (mode === "single") {
        nodes.push(h("input", {
          key: "single",
          type: "date",
          className: "utodo-date",
          value: start || "",
          onChange: event => setStart(event.target.value),
          "aria-label": "日期",
        }));
        if (!compact) {
          nodes.push(h(
            "div",
            { key: "quick", className: "utodo-quick" },
            h("button", { type: "button", className: "utodo-quick-btn", onClick: () => setStart(todayISO()) }, "今天"),
            h("button", { type: "button", className: "utodo-quick-btn", onClick: () => setStart(shiftISO(todayISO(), 1)) }, "明天"),
            h("button", { type: "button", className: "utodo-quick-btn", onClick: () => setStart(nextMonday()) }, "下周一"),
          ));
        }
      } else if (mode === "range") {
        nodes.push(h("input", {
          key: "from",
          type: "date",
          className: "utodo-date",
          value: start || "",
          onChange: event => setStart(event.target.value),
          "aria-label": "开始日期",
        }));
        nodes.push(h("span", { key: "dash", className: "utodo-dash" }, "→"));
        nodes.push(h("input", {
          key: "to",
          type: "date",
          className: "utodo-date",
          value: end || "",
          onChange: event => setEnd(event.target.value),
          "aria-label": "结束日期",
        }));
      }

      return h("div", { className: "utodo-composer-row" }, nodes);
    }

    function TodoComposer(props) {
      const [title, setTitle] = useState("");
      const [date, setDate] = useState({ start: null, end: null });
      const [important, setImportant] = useState(false);
      const [remind, setRemind] = useState("");
      const [wantRemind, setWantRemind] = useState(false);
      const [remindDayInput, setRemindDayInput] = useState("");
      const inputRef = useRef(null);
      /* The reminder fires on one day: it may be earlier than the todo starts,
         never later than its last day. Without dates it fires on the day set. */
      const lastDay = lastDayOf(date.start, date.end);
      const capDay = lastDay || todayISO();
      const remindDayValue =
        isISO(remindDayInput) && remindDayInput <= capDay ? remindDayInput : capDay;

      function toggleRemind() {
        const next = !wantRemind;
        setWantRemind(next);
        if (next && !isTime(remind)) setRemind("09:00");
      }

      function submit(event) {
        event.preventDefault();
        const text = title.trim();
        if (!text) return;
        const start = isISO(date.start) ? date.start : null;
        const end = isISO(date.end) && date.end !== date.start ? date.end : null;
        props.onAdd({
          id: newId(),
          title: text,
          done: false,
          important: important,
          start: start,
          end: end,
          remind: wantRemind && isTime(remind) ? remind : null,
          remindDay: wantRemind && isTime(remind) ? remindDayValue : null,
          createdAt: Date.now(),
        });
        setTitle("");
        setDate({ start: null, end: null });
        setImportant(false);
        setRemind("");
        setWantRemind(false);
        setRemindDayInput("");
        if (inputRef.current) inputRef.current.focus();
      }

      return h(
        "form",
        { className: "utodo-composer", onSubmit: submit },
        h("input", {
          ref: inputRef,
          className: "utodo-input",
          value: title,
          placeholder: "添加一条待办，回车即可…",
          onChange: event => setTitle(event.target.value),
          "aria-label": "待办内容",
        }),
        h(
          "div",
          { className: "utodo-composer-row" },
          h(
            "button",
            {
              type: "button",
              className: "utodo-quick-btn" + (important ? " is-star" : ""),
              "aria-pressed": important,
              title: important ? "取消重要" : "标记为重要",
              onClick: () => setImportant(!important),
            },
            h(IconStar, { filled: important, size: 11 }),
            h("span", { style: { marginLeft: "4px" } }, "重要"),
          ),
          h(DateFields, { value: date, onChange: setDate }),
          h(
            "button",
            {
              type: "button",
              className: "utodo-quick-btn" + (wantRemind ? " is-remind" : ""),
              "aria-pressed": wantRemind,
              title: wantRemind ? "取消提醒" : "到点后推送到微信",
              onClick: toggleRemind,
            },
            "提醒",
          ),
          wantRemind
            ? h(
                "span",
                { className: "utodo-remind" },
                h("input", {
                  type: "date",
                  className: "utodo-date utodo-remind-date",
                  value: remindDayValue,
                  max: capDay,
                  onChange: event => {
                    const next = event.target.value;
                    /* never let the firing day drift past the todo's last day */
                    setRemindDayInput(isISO(next) && next > capDay ? capDay : next);
                  },
                  "aria-label": "提醒日期",
                }),
                h("input", {
                  type: "time",
                  className: "utodo-date utodo-remind-time",
                  value: remind,
                  onChange: event => setRemind(event.target.value),
                  "aria-label": "提醒时间",
                }),
                lastDay
                  ? h("span", { className: "utodo-time-label" }, "最晚 " + shortDate(lastDay))
                  : null,
              )
            : null,
          h("span", { className: "utodo-spacer" }),
          h("button", { type: "submit", className: "utodo-add", disabled: !title.trim() }, "添加"),
        ),
      );
    }

    function DeleteControl(props) {
      const [confirming, setConfirming] = useState(false);
      useEffect(() => {
        if (!confirming) return undefined;
        const timer = window.setTimeout(() => setConfirming(false), 2600);
        return () => window.clearTimeout(timer);
      }, [confirming]);
      if (confirming) {
        return h("button", { type: "button", className: "utodo-confirm", onClick: () => { setConfirming(false); props.onDelete(); } }, "确认删除");
      }
      return h(
        "button",
        {
          type: "button",
          className: "utodo-icon-btn is-danger",
          title: props.label || "删除",
          "aria-label": props.label || "删除",
          onClick: () => setConfirming(true),
        },
        h(IconTrash),
      );
    }

    function SelectBox(props) {
      return h(
        "button",
        {
          type: "button",
          className: "utodo-selectbox" + (props.checked ? " is-on" : ""),
          "aria-pressed": props.checked === true,
          "aria-label": props.checked ? "取消选择" : "选择",
          onClick: event => {
            if (event) event.stopPropagation();
            props.onToggle();
          },
        },
        props.checked ? h(IconCheck, { size: 9 }) : null,
      );
    }

    /* The push card. Everything here is local: the address is the user's own
       webhook or token, and the panel never calls a server of its own. */
    function PushSettings(props) {
      const push = props.push;
      const [busy, setBusy] = useState(false);
      const [status, setStatus] = useState("");
      const patch = extra => props.onChange(Object.assign({}, push, extra));

      async function test() {
        if (busy) return;
        setBusy(true);
        setStatus("");
        const result = await deliverPush(push, {
          title: "DSH 待办测试推送",
          content: "如果你在微信里看到这条消息，推送配置已经生效。",
        });
        setBusy(false);
        if (result.ok) setStatus(result.opaque ? "已发送；该渠道不返回可读回执，请到微信里确认" : "已发送，请到微信里确认");
        else setStatus("发送失败：" + (result.error || "请检查地址与网络"));
      }

      return h(
        "details",
        { className: "utodo-settings" },
        h("summary", { className: "utodo-settings-summary" }, "提醒推送设置"),
        h(
          "div",
          { className: "utodo-settings-body" },
          h(
            "label",
            { className: "utodo-field is-check" },
            h("input", {
              type: "checkbox",
              checked: push.enabled === true,
              onChange: event => patch({ enabled: event.target.checked }),
            }),
            h("span", null, "待办到点后自动推送"),
          ),
          h(
            "label",
            { className: "utodo-field" },
            h("span", { className: "utodo-field-label" }, "推送渠道"),
            h(
              "select",
              {
                className: "utodo-field-input utodo-select",
                value: push.channel,
                onChange: event => patch({ channel: event.target.value }),
              },
              PUSH_CHANNEL_OPTIONS.map(option => h("option", { key: option.value, value: option.value }, option.label)),
            ),
          ),
          h(
            "label",
            { className: "utodo-field" },
            h("span", { className: "utodo-field-label" }, "密钥 / 地址"),
            h("input", {
              className: "utodo-field-input",
              value: push.target,
              placeholder: PUSH_CHANNEL_HINTS[push.channel] || "",
              spellCheck: false,
              onChange: event => patch({ target: event.target.value }),
            }),
          ),
          h("p", { className: "utodo-hint" }, PUSH_CHANNEL_HINTS[push.channel] || ""),
          h(
            "div",
            { className: "utodo-composer-row" },
            h(
              "button",
              {
                type: "button",
                className: "utodo-quick-btn",
                disabled: busy || !String(push.target || "").trim(),
                onClick: test,
              },
              busy ? "发送中…" : "发送测试推送",
            ),
            h(
              "label",
              { className: "utodo-field is-check" },
              h("input", {
                type: "checkbox",
                checked: push.desktop === true,
                onChange: event => patch({ desktop: event.target.checked }),
              }),
              h("span", null, "同时发系统通知"),
            ),
          ),
          status ? h("p", { className: "utodo-hint" }, status) : null,
          h(
            "p",
            { className: "utodo-hint" },
            "提醒只在 DSH 页面打开时投递；页面关着时到点的提醒，会在下次打开后的 6 小时内补发一次，更早的只做静默标记。",
          ),
        ),
      );
    }
    function TodoRow(props) {
      const todo = props.todo;
      const schedule = scheduleOf(todo, props.today);
      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(todo.title);
      const [draftDate, setDraftDate] = useState({ start: todo.start, end: todo.end });

      function beginEdit() {
        setDraft(todo.title);
        setDraftDate({ start: todo.start, end: todo.end });
        setEditing(true);
      }

      function commit() {
        const text = draft.trim();
        if (!text) return setEditing(false);
        props.onUpdate(todo.id, {
          title: text,
          start: isISO(draftDate.start) ? draftDate.start : null,
          end: isISO(draftDate.end) && draftDate.end !== draftDate.start ? draftDate.end : null,
        });
        setEditing(false);
      }

      const badgeClass = schedule.kind === "overdue"
        ? "utodo-badge is-danger"
        : schedule.kind === "current"
          ? "utodo-badge is-accent"
          : "utodo-badge";

      if (editing) {
        return h(
          "li",
          { className: "utodo-row" },
          h(
            "div",
            { className: "utodo-inline-editor", style: { flex: "1 1 auto" } },
            h("input", {
              className: "utodo-inline-input",
              value: draft,
              autoFocus: true,
              onChange: event => setDraft(event.target.value),
              onKeyDown: event => {
                if (event.key === "Enter") { event.preventDefault(); commit(); }
                if (event.key === "Escape") { event.preventDefault(); setEditing(false); }
              },
              "aria-label": "编辑待办",
            }),
            h(DateFields, { value: draftDate, onChange: setDraftDate, compact: true }),
            h(
              "div",
              { className: "utodo-composer-row" },
              h("button", { type: "button", className: "utodo-add", onClick: commit }, "保存"),
              h("button", { type: "button", className: "utodo-quick-btn", onClick: () => setEditing(false) }, "取消"),
            ),
          ),
        );
      }

      const selectMode = props.selectMode === true;
      const selected = props.selected === true;

      return h(
        "li",
        {
          className: "utodo-row" + (todo.done ? " is-done" : "") + (selectMode ? " is-selectable" : "") + (selected ? " is-selected" : ""),
          onClick: selectMode ? () => props.onSelect(todo.id) : undefined,
        },
        selectMode
          ? h(SelectBox, { checked: selected, onToggle: () => props.onSelect(todo.id) })
          : h(
              "button",
              {
                type: "button",
                className: "utodo-check" + (todo.done ? " is-done" : ""),
                onClick: () => props.onToggle(todo.id),
                "aria-pressed": todo.done,
                "aria-label": todo.done ? "标记为未完成" : "标记为已完成",
              },
              h(IconCheck),
            ),
        h(
          "div",
          { className: "utodo-row-main" },
          h("span", { className: "utodo-row-title", onDoubleClick: beginEdit, title: "双击编辑" }, todo.title),
          h(
            "span",
            { className: "utodo-meta" },
            todo.important ? h("span", { className: "utodo-badge is-star" }, "重要") : null,
            isTime(todo.remind)
              ? h(
                  "span",
                  {
                    className: "utodo-badge is-remind",
                    title: "提醒 " + remindDay(todo) + " " + todo.remind,
                  },
                  "提醒 " + (
                    remindDay(todo) === lastDayOf(todo.start, todo.end)
                      ? todo.remind
                      : shortDate(remindDay(todo)) + " " + todo.remind
                  ),
                )
              : null,
            h("span", { className: badgeClass }, schedule.label),
            schedule.note ? h("span", { className: "utodo-meta-dot" }) : null,
            schedule.note ? h("span", null, schedule.note) : null,
          ),
        ),
        selectMode ? null : h(
          "div",
          { className: "utodo-row-actions" },
          h(
            "button",
            {
              type: "button",
              className: "utodo-icon-btn utodo-star" + (todo.important ? " is-on" : ""),
              title: todo.important ? "取消重要" : "标记为重要",
              "aria-pressed": todo.important === true,
              "aria-label": todo.important ? "取消重要" : "标记为重要",
              onClick: () => props.onUpdate(todo.id, { important: todo.important !== true }),
            },
            h(IconStar, { filled: todo.important === true }),
          ),
          h("button", { type: "button", className: "utodo-icon-btn", title: "编辑", "aria-label": "编辑", onClick: beginEdit }, h("svg", { width: 13, height: 13, viewBox: "0 0 16 16", "aria-hidden": "true" }, h("path", { d: "M11.1 2.9l2 2-8 8H3.1v-2l8-8z", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinejoin: "round" }))),
          h(DeleteControl, { label: "删除待办", onDelete: () => props.onDelete(todo.id) }),
        ),
      );
    }

    function TodoList(props) {
      const groups = props.groups;
      const nodes = [];
      for (const meta of GROUP_ORDER) {
        const items = groups[meta.key];
        if (!items || items.length === 0) continue;
        nodes.push(h(
          "section",
          { key: meta.key, className: "utodo-group " + meta.className },
          h(
            "div",
            { className: "utodo-group-head" },
            h("span", { className: "utodo-group-label" }, meta.label),
            h("span", { className: "utodo-group-count" }, String(items.length)),
          ),
          h(
            "ul",
            { className: "utodo-list" },
            items.map(todo => h(TodoRow, {
              key: todo.id,
              todo: todo,
              today: props.today,
              onToggle: props.onToggle,
              onDelete: props.onDelete,
              onUpdate: props.onUpdate,
              selectMode: props.selectMode,
              selected: props.selected && props.selected["todo:" + todo.id] === true,
              onSelect: props.onSelect,
            })),
          ),
        ));
      }
      return h("div", null, nodes);
    }

    /* The todo tab holds three switchable views: the dated groups, the starred
       todos, and the ones due inside a user-defined window. */
    const SOON_PRESETS = [2, 7, 30];

    const TODO_VIEWS = [
      { key: "all", label: "全部待办" },
      { key: "important", label: "重要" },
      { key: "soon", label: "临期" },
    ];

    function TodoViewTabs(props) {
      return h(
        "div",
        { className: "utodo-views", role: "tablist", "aria-label": "待办视图" },
        TODO_VIEWS.map(view => h(
          "button",
          {
            key: view.key,
            type: "button",
            role: "tab",
            "aria-selected": props.view === view.key,
            className: "utodo-view" + (props.view === view.key ? " is-active" : ""),
            onClick: () => props.onSelect(view.key),
          },
          h("span", null, view.label),
          h("span", { className: "utodo-view-count" }, String(props.counts[view.key] || 0)),
        )),
      );
    }

    function pinRowProps(props) {
      return item => ({
        key: item.id,
        todo: item,
        today: props.today,
        onToggle: props.onToggle,
        onUpdate: props.onUpdate,
        onDelete: props.onDelete,
        selectMode: props.selectMode,
        selected: props.selected && props.selected["todo:" + item.id] === true,
        onSelect: props.onSelect,
      });
    }

    function ImportantPanel(props) {
      const items = pickImportant(props.todos);
      return h(
        "section",
        { className: "utodo-pin is-important utodo-panel" },
        h(
          "div",
          { className: "utodo-pin-head" },
          h("span", { className: "utodo-pin-label" }, h(IconStar, { filled: true, size: 11 }), "重要事项"),
          h("span", { className: "utodo-pin-count" }, String(items.length)),
        ),
        items.length === 0
          ? h(
              "div",
              { className: "utodo-empty is-compact" },
              h("p", { className: "utodo-empty-title" }, "还没有重要事项"),
              h("p", { className: "utodo-empty-text" }, "在任意待办右侧点 ☆ 标记重要，它们会集中出现在这里。"),
            )
          : h("ul", { className: "utodo-list" }, items.map(item => h(TodoRow, pinRowProps(props)(item)))),
      );
    }

    function SoonPanel(props) {
      const soon = pickSoon(props.todos, props.today, props.soonDays);
      const custom = SOON_PRESETS.indexOf(props.soonDays) === -1;
      return h(
        "section",
        { className: "utodo-pin is-soon utodo-panel" },
        h(
          "div",
          { className: "utodo-pin-head" },
          h("span", { className: "utodo-pin-label" }, "临期事项"),
          h("span", { className: "utodo-pin-count" }, String(soon.length)),
          h("span", { className: "utodo-pin-note" }, "未来 " + props.soonDays + " 天内到期"),
          h(
            "div",
            { className: "utodo-pin-range", role: "group", "aria-label": "临期范围" },
            SOON_PRESETS.map(days => h(
              "button",
              {
                key: days,
                type: "button",
                className: "utodo-seg-btn" + (props.soonDays === days ? " is-active" : ""),
                onClick: () => props.onSoonDays(days),
              },
              days + "天",
            )),
            h("input", {
              className: "utodo-days",
              type: "number",
              min: 1,
              max: 365,
              value: String(props.soonDays),
              onChange: event => {
                const days = Math.round(Number(event.target.value));
                if (Number.isFinite(days) && days >= 1) props.onSoonDays(Math.min(365, days));
              },
              "aria-label": "自定义临期天数",
            }),
            h("span", { className: "utodo-pin-note" }, custom ? "天（自定义）" : "天"),
          ),
        ),
        soon.length === 0
          ? h(
              "div",
              { className: "utodo-empty is-compact" },
              h("p", { className: "utodo-empty-title" }, "未来 " + props.soonDays + " 天内没有到期的事项"),
              h("p", { className: "utodo-empty-text" }, "换个范围试试，或者给待办加上日期。"),
            )
          : h("ul", { className: "utodo-list" }, soon.map(item => h(TodoRow, pinRowProps(props)(item)))),
      );
    }

    function TagInput(props) {
      const [value, setValue] = useState("");
      function commit(extra) {
        const tag = cleanTag(extra == null ? value : extra);
        setValue("");
        if (tag && props.tags.indexOf(tag) === -1) props.onAdd(tag);
      }
      return h("input", {
        className: props.className || "utodo-tag-input",
        value: value,
        placeholder: props.placeholder || "加标签，回车确认",
        onChange: event => {
          const next = event.target.value;
          if (next.indexOf(",") !== -1 || next.indexOf("，") !== -1) {
            commit(next.replace(/[,，]/g, ""));
            return;
          }
          setValue(next);
        },
        onKeyDown: event => {
          if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); commit(); }
          if (event.key === "Backspace" && !value && props.onRemoveLast) { event.preventDefault(); props.onRemoveLast(); }
        },
        onBlur: () => { if (value.trim()) commit(); },
        "aria-label": props.label || "标签",
      });
    }

    function IdeaCard(props) {
      const idea = props.idea;
      const [adding, setAdding] = useState(false);
      const [editing, setEditing] = useState(false);
      const [draft, setDraft] = useState(idea.text);

      function save() {
        const text = draft.trim();
        if (text && text !== idea.text) props.onUpdate(idea.id, { text: text });
        setEditing(false);
      }

      const createdAt = new Date(idea.createdAt);
      const stamp = createdAt.getFullYear() === new Date().getFullYear()
        ? (createdAt.getMonth() + 1) + "月" + createdAt.getDate() + "日"
        : createdAt.getFullYear() + "年" + (createdAt.getMonth() + 1) + "月" + createdAt.getDate() + "日";

      if (props.selectMode === true) {
        const picked = props.selected === true;
        return h(
          "li",
          {
            className: "utodo-idea is-selectable" + (picked ? " is-selected" : ""),
            onClick: () => props.onSelect(idea.id),
          },
          h(SelectBox, { checked: picked, onToggle: () => props.onSelect(idea.id) }),
          h(
            "div",
            { className: "utodo-idea-body" },
            h("p", { className: "utodo-idea-text" }, idea.text),
            h(
              "div",
              { className: "utodo-idea-foot" },
              idea.tags.map(tag => h(
                "span",
                { key: tag, className: "utodo-chip", style: tagColor(tag, props.tones) },
                "#" + tag,
              )),
              h("span", { className: "utodo-spacer" }),
              h("time", { className: "utodo-meta" }, stamp),
            ),
          ),
        );
      }

      return h(
        "li",
        { className: "utodo-idea" },
        editing
          ? h(
              "div",
              { className: "utodo-inline-editor" },
              h("textarea", {
                className: "utodo-textarea",
                value: draft,
                autoFocus: true,
                onChange: event => setDraft(event.target.value),
                onKeyDown: event => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); save(); }
                  if (event.key === "Escape") { event.preventDefault(); setEditing(false); }
                },
                "aria-label": "编辑想法",
              }),
              h(
                "div",
                { className: "utodo-composer-row" },
                h("button", { type: "button", className: "utodo-add", onClick: save }, "保存"),
                h("button", { type: "button", className: "utodo-quick-btn", onClick: () => setEditing(false) }, "取消"),
              ),
            )
          : h("p", { className: "utodo-idea-text", onDoubleClick: () => { setDraft(idea.text); setEditing(true); } }, idea.text),
        h(
          "div",
          { className: "utodo-idea-foot" },
          idea.tags.map(tag => h(
            "span",
            { key: tag, className: "utodo-chip", style: tagColor(tag, props.tones) },
            "#" + tag,
            h("button", {
              type: "button",
              className: "utodo-chip-x",
              title: "移除标签",
              "aria-label": "移除标签 " + tag,
              onClick: () => props.onUpdate(idea.id, { tags: idea.tags.filter(item => item !== tag) }),
            }, h(IconX, { size: 9 })),
          )),
          adding
            ? h(TagInput, {
                tags: idea.tags,
                onAdd: tag => { props.onUpdate(idea.id, { tags: idea.tags.concat([tag]) }); setAdding(false); },
                label: "为想法添加标签",
              })
            : h("button", { type: "button", className: "utodo-chip-add", onClick: () => setAdding(true) }, "+ 标签"),
          h("span", { className: "utodo-spacer" }),
          h("time", { className: "utodo-meta" }, stamp),
          h(DeleteControl, { label: "删除想法", onDelete: () => props.onDelete(idea.id) }),
        ),
      );
    }

    function IdeaComposer(props) {
      const [text, setText] = useState("");
      const [tags, setTags] = useState([]);

      function submit(event) {
        if (event) event.preventDefault();
        const body = text.trim();
        if (!body) return;
        props.onAdd({ id: newId(), text: body, tags: tags.slice(), createdAt: Date.now() });
        setText("");
        setTags([]);
      }

      return h(
        "form",
        { className: "utodo-composer", onSubmit: submit },
        h("textarea", {
          className: "utodo-textarea",
          value: text,
          placeholder: "记下一个想法…",
          onChange: event => setText(event.target.value),
          onKeyDown: event => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit(); }
          },
          "aria-label": "想法内容",
        }),
        h(
          "div",
          { className: "utodo-composer-row" },
          h(
            "div",
            { className: "utodo-tagbox" },
            tags.map(tag => h(
              "span",
              { key: tag, className: "utodo-chip", style: tagColor(tag, props.tones) },
              "#" + tag,
              h("button", {
                type: "button",
                className: "utodo-chip-x",
                title: "移除标签",
                "aria-label": "移除标签 " + tag,
                onClick: () => setTags(tags.filter(item => item !== tag)),
              }, h(IconX, { size: 9 })),
            )),
            h(TagInput, {
              tags: tags,
              placeholder: tags.length === 0 ? "加标签，回车确认" : "继续添加",
              onAdd: tag => {
                setTags(tags.concat([tag]));
                if (props.onTagAdded) props.onTagAdded(tag);
              },
              onRemoveLast: () => setTags(tags.slice(0, -1)),
              label: "新想法的标签",
            }),
          ),
          h("span", { className: "utodo-spacer" }),
          h("button", { type: "submit", className: "utodo-add", disabled: !text.trim() }, "保存"),
        ),
      );
    }

    function IdeasPanel(props) {
      const ideas = props.ideas;
      const [activeTag, setActiveTag] = useState(null);

      const tagCounts = useMemo(() => {
        const counts = new Map();
        for (const idea of ideas) {
          for (const tag of idea.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
        }
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      }, [ideas]);

      useEffect(() => {
        if (activeTag && !tagCounts.some(entry => entry[0] === activeTag)) setActiveTag(null);
      }, [activeTag, tagCounts]);

      const visible = activeTag ? ideas.filter(idea => idea.tags.indexOf(activeTag) !== -1) : ideas;

      const nodes = [
        h(IdeaComposer, { key: "composer", onAdd: props.onAdd, tones: props.tones, onTagAdded: props.onTagAdded }),
      ];

      if (tagCounts.length > 0) {
        nodes.push(h(
          "div",
          { key: "filters", className: "utodo-filters" },
          h("button", { type: "button", className: "utodo-filter" + (activeTag ? "" : " is-active"), onClick: () => setActiveTag(null) }, "全部"),
          tagCounts.map(entry => h(
            "button",
            {
              key: entry[0],
              type: "button",
              className: "utodo-filter" + (activeTag === entry[0] ? " is-active" : ""),
              onClick: () => setActiveTag(activeTag === entry[0] ? null : entry[0]),
              style: tagColor(entry[0], props.tones),
            },
            "#" + entry[0] + " " + entry[1],
          )),
        ));
      }

      if (visible.length === 0) {
        nodes.push(h(
          "div",
          { key: "empty", className: "utodo-empty" },
          h("p", { className: "utodo-empty-title" }, activeTag ? "这个标签下还没有想法" : "还没有想法"),
          h("p", { className: "utodo-empty-text" }, "随手记下一个念头，给它打上标签，之后按标签找回来。"),
        ));
      } else {
        nodes.push(h(
          "ul",
          { key: "list", className: "utodo-ideas" },
          visible.map(idea => h(IdeaCard, {
            key: idea.id,
            idea: idea,
            tones: props.tones,
            onUpdate: props.onUpdate,
            onDelete: props.onDelete,
            selectMode: props.selectMode,
            selected: props.selected && props.selected["idea:" + idea.id] === true,
            onSelect: props.onSelect,
          })),
        ));
      }

      return h("div", null, nodes);
    }

    function UtodoPage() {
      const [data, setData] = useState(loadData);
      const [tab, setTab] = useState("todos");
      const [view, setView] = useState("all");
      const [selectMode, setSelectMode] = useState(false);
      const [selected, setSelected] = useState({});
      const [toast, setToast] = useState(null);

      useEffect(() => {
        saveData(data);
      }, [data]);

      const selectedCount = Object.keys(selected).filter(key => selected[key] === true).length;

      const toggleSelected = key => setSelected(current => {
        const map = Object.assign({}, current);
        if (map[key]) delete map[key];
        else map[key] = true;
        return map;
      });

      const leaveSelectMode = () => {
        setSelectMode(false);
        setSelected({});
      };

      /* The bridge writes the block into the live composer; when there is no
         conversation to write into, the same text goes to the clipboard so the
         selection is never lost. */
      const importSelected = async () => {
        const text = buildImportText(data, selected);
        if (!text) return;
        const bridge = sessionBridge;
        const result = bridge ? await bridge.importToSession(text) : { ok: false, reason: "no-bridge" };
        if (result.ok) {
          setToast({ kind: "ok", text: "已导入 " + selectedCount + " 项到当前会话草稿" });
          leaveSelectMode();
          return;
        }
        const copied = await copyText(text);
        setToast({
          kind: copied ? "ok" : "warn",
          text: copied ? "当前没有可写入的会话，内容已复制到剪贴板" : "当前没有可写入的会话，请手动复制",
        });
        if (copied) leaveSelectMode();
      };

      useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 3200);
        return () => clearTimeout(timer);
      }, [toast]);

      const today = todayISO();
      const groups = useMemo(() => groupTodos(data.todos, today), [data.todos, today]);
      const openCount = data.todos.filter(todo => !todo.done).length;
      const doneCount = data.todos.length - openCount;
      const importantCount = useMemo(() => pickImportant(data.todos).length, [data.todos]);
      const soonCount = useMemo(
        () => pickSoon(data.todos, today, data.settings.soonDays).length,
        [data.todos, today, data.settings.soonDays],
      );

      /* every mutation keeps the untouched collections - settings included - and
         hands any newly used tag its own palette tone */
      const next = (current, patch) => {
        const merged = Object.assign({}, current, patch);
        if (patch && patch.ideas) assignTagTones(merged);
        return merged;
      };
      const addTodo = todo => setData(current => next(current, { todos: current.todos.concat([todo]) }));
      const toggleTodo = id => setData(current => next(current, {
        todos: current.todos.map(todo => (todo.id === id ? Object.assign({}, todo, { done: !todo.done }) : todo)),
      }));
      const updateTodo = (id, patch) => setData(current => next(current, {
        todos: current.todos.map(todo => (todo.id === id ? Object.assign({}, todo, patch) : todo)),
      }));
      const removeTodo = id => setData(current => next(current, { todos: current.todos.filter(todo => todo.id !== id) }));
      const addIdea = idea => setData(current => next(current, { ideas: [idea].concat(current.ideas) }));
      /* a tag typed into the composer claims its tone right away, so the chip does
         not change colour between composing and saving */
      const ensureTagTone = tag => setData(current => {
        const tones = Object.assign({}, current.settings.tagTones);
        if (Number.isInteger(tones[tag])) return current;
        tones[tag] = toneForTag(tag, tones);
        return Object.assign({}, current, { settings: Object.assign({}, current.settings, { tagTones: tones }) });
      });
      const updateIdea = (id, patch) => setData(current => next(current, {
        ideas: current.ideas.map(idea => (idea.id === id ? Object.assign({}, idea, patch) : idea)),
      }));
      const removeIdea = id => setData(current => next(current, { ideas: current.ideas.filter(idea => idea.id !== id) }));
      const setSoonDays = days => setData(current => next(current, {
        settings: Object.assign({}, current.settings, { soonDays: days }),
      }));
      const setPush = push => setData(current => next(current, {
        settings: Object.assign({}, current.settings, { push: push }),
      }));

      /* One sweep per half minute: fire what has come due, remember that it fired,
         and quietly retire anything older than the grace window. The stamp is
         written before the request so a slow network cannot cause a second send. */
      useEffect(() => {
        const sweep = () => {
          const push = data.settings.push;
          const now = Date.now();
          const due = [];
          const marked = new Map();
          for (const todo of data.todos) {
            /* a done todo stays quiet, and a deleted one has already left the
               list — neither can still be waiting for its minute */
            if (todo.done) continue;
            const key = remindKey(todo);
            if (!key || todo.remindSent === key) continue;
            const at = remindAt(todo);
            if (at === null || now < at) continue;
            marked.set(todo.id, key);
            if (now - at <= REMIND_GRACE_MS) due.push({ todo: todo, push: push });
          }
          if (marked.size === 0) return;
          setData(current => Object.assign({}, current, {
            todos: current.todos.map(todo => (
              marked.has(todo.id) ? Object.assign({}, todo, { remindSent: marked.get(todo.id) }) : todo
            )),
          }));
          for (const entry of due) {
            const message = pushMessage(entry.todo);
            if (entry.push && entry.push.desktop === true) desktopNotify(message);
            const configured = entry.push && entry.push.enabled === true && String(entry.push.target || "").trim();
            if (!configured) continue;
            deliverPush(entry.push, message).then(result => {
              if (result.ok) setToast({ kind: "ok", text: "已推送提醒：" + entry.todo.title });
              else setToast({ kind: "warn", text: "推送失败：" + (result.error || "请检查推送设置") });
            });
          }
        };
        sweep();
        const timer = setInterval(sweep, 30000);
        return () => clearInterval(timer);
      }, [data.todos, data.settings.push]);

      const subtitle = data.todos.length === 0 && data.ideas.length === 0
        ? "先记下第一件事，或者一个念头。"
        : openCount + " 条待办进行中" + (doneCount > 0 ? " · " + doneCount + " 条已完成" : "") + " · " + data.ideas.length + " 个想法";

      return h(
        "div",
        { className: "utodo-root" },
        h(
          "div",
          { className: "utodo-shell" },
          h(
            "header",
            { className: "utodo-head" },
            h(
              "div",
              null,
              h("h1", { className: "utodo-title" }, PANEL_LABEL),
              h("p", { className: "utodo-sub" }, subtitle),
            ),
            h(
              "div",
              { className: "utodo-tabs", role: "tablist", "aria-label": "视图" },
              h(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": tab === "todos",
                  className: "utodo-tab" + (tab === "todos" ? " is-active" : ""),
                  onClick: () => setTab("todos"),
                },
                "待办",
                h("span", { className: "utodo-tab-count" }, String(openCount)),
              ),
              h(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": tab === "ideas",
                  className: "utodo-tab" + (tab === "ideas" ? " is-active" : ""),
                  onClick: () => setTab("ideas"),
                },
                "想法",
                h("span", { className: "utodo-tab-count" }, String(data.ideas.length)),
              ),
            ),
            h(
              "div",
              { className: "utodo-head-tools" },
              h(
                "button",
                {
                  type: "button",
                  className: "utodo-ghost" + (selectMode ? " is-on" : ""),
                  onClick: () => (selectMode ? leaveSelectMode() : setSelectMode(true)),
                  title: "选择待办或想法，导入到当前会话",
                },
                selectMode ? "完成" : "导入会话",
              ),
            ),
          ),
          selectMode
            ? h(
                "div",
                { className: "utodo-selectbar" },
                h("span", { className: "utodo-selectbar-count" }, "已选 " + selectedCount + " 项"),
                h("span", { className: "utodo-spacer" }),
                h("button", { type: "button", className: "utodo-quick-btn", onClick: leaveSelectMode }, "取消"),
                h(
                  "button",
                  {
                    type: "button",
                    className: "utodo-add",
                    disabled: selectedCount === 0,
                    onClick: importSelected,
                  },
                  "导入到当前会话",
                ),
              )
            : null,
          tab === "todos"
            ? h(
                "div",
                null,
                h(TodoComposer, { onAdd: addTodo }),
                data.todos.length === 0
                  ? h(
                      "div",
                      { className: "utodo-empty" },
                      h("p", { className: "utodo-empty-title" }, "还没有待办"),
                      h("p", { className: "utodo-empty-text" }, "写下要做的事，再决定是哪一天 —— 单独一天，或者一段日期区间。"),
                    )
                  : h(
                      "div",
                      { className: "utodo-view-body" },
                      h(TodoViewTabs, {
                        view: view,
                        counts: { all: openCount, important: importantCount, soon: soonCount },
                        onSelect: setView,
                      }),
                      view === "important"
                        ? h(ImportantPanel, {
                            todos: data.todos,
                            today: today,
                            onToggle: toggleTodo,
                            onUpdate: updateTodo,
                            onDelete: removeTodo,
                            selectMode: selectMode,
                            selected: selected,
                            onSelect: id => toggleSelected("todo:" + id),
                          })
                        : view === "soon"
                          ? h(SoonPanel, {
                              todos: data.todos,
                              today: today,
                              soonDays: data.settings.soonDays,
                              onSoonDays: setSoonDays,
                              onToggle: toggleTodo,
                              onUpdate: updateTodo,
                              onDelete: removeTodo,
                              selectMode: selectMode,
                              selected: selected,
                              onSelect: id => toggleSelected("todo:" + id),
                            })
                          : h(TodoList, {
                              groups: groups,
                              today: today,
                              onToggle: toggleTodo,
                              onDelete: removeTodo,
                              onUpdate: updateTodo,
                              selectMode: selectMode,
                              selected: selected,
                              onSelect: id => toggleSelected("todo:" + id),
                            }),
                    ),
              )
            : h(IdeasPanel, {
                ideas: data.ideas,
                tones: data.settings.tagTones,
                onAdd: addIdea,
                onTagAdded: ensureTagTone,
                onUpdate: updateIdea,
                onDelete: removeIdea,
                selectMode: selectMode,
                selected: selected,
                onSelect: id => toggleSelected("idea:" + id),
              }),
          tab === "todos"
            ? h(PushSettings, { push: data.settings.push, onChange: setPush })
            : null,
          h("p", { className: "utodo-foot" }, "数据保存在本机浏览器存储中，不会上传。"),
          toast
            ? h(
                "div",
                { className: "utodo-toast" + (toast.kind === "warn" ? " is-warn" : ""), role: "status" },
                toast.text,
              )
            : null,
        ),
      );
    }

    /* ---------------------------------------------------------- registration */

    function apply(ctx) {
      injectStyle();
      sessionBridge = createBridge(ctx);
      ctx.slots.inject("sidebar.panellist", function () {
        return ctx.slots.register({
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: 20,
          /* A thunk, like every shipped panellist: the sidebar resolves it and
             re-resolves on locale changes instead of re-registering. */
          label: () => PANEL_LABEL,
        }, PanelIcon);
      });
      ctx.slots.inject("main", function () {
        return ctx.slots.register({
          name: "main",
          key: PANEL_ID,
        }, UtodoPage);
      });
      /* A root-scoped panel is never handed a session id, so this invisible
         registrant reports the conversation the platform just mounted. It is
         registered defensively: a host without the slot still gets the panel,
         and the import button then falls back to the clipboard. */
      try {
        ctx.slots.inject("conversation.session.header.utilities", function () {
          return ctx.slots.register({
            name: "conversation.session.header.utilities",
            id: PANEL_ID + ".session-probe",
            order: 90,
            inject: sessionId => {
              noteSession(sessionId);
              return { sessionId: sessionId };
            },
          }, SessionProbe);
        });
      } catch (error) {
        /* the probe is optional */
      }
    }

    /** Exposed for the package's own headless smoke test; no runtime consumer reads it. */
    exports.__internals = {
      scheduleOf: scheduleOf,
      groupTodos: groupTodos,
      normalizeData: normalizeData,
      loadData: loadData,
      saveData: saveData,
      shortDate: shortDate,
      rangeLabel: rangeLabel,
      tagColor: tagColor,
      hashTag: hashTag,
      TAG_PALETTE: TAG_PALETTE,
      toneForTag: toneForTag,
      assignTagTones: assignTagTones,
      normalizeToneMap: normalizeToneMap,
      dueOf: dueOf,
      pickImportant: pickImportant,
      pickSoon: pickSoon,
      TodoViewTabs: TodoViewTabs,
      ImportantPanel: ImportantPanel,
      SoonPanel: SoonPanel,
      TodoList: TodoList,
      IdeasPanel: IdeasPanel,
      isTime: isTime,
      lastDayOf: lastDayOf,
      clampRemindDay: clampRemindDay,
      remindDay: remindDay,
      remindKey: remindKey,
      remindAt: remindAt,
      pushRequest: pushRequest,
      buildImportText: buildImportText,
      normalizePush: normalizePush,
      PUSH_CHANNEL_OPTIONS: PUSH_CHANNEL_OPTIONS,
      REMIND_GRACE_MS: REMIND_GRACE_MS,
    };
    exports.PANEL_ID = PANEL_ID;
    exports.PanelIcon = PanelIcon;
    exports.UtodoPage = UtodoPage;
    exports.inject = ["slots"];
    exports.apply = apply;
    return module.exports;
  },
});
