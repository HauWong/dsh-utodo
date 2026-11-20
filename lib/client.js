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

    const CSS = ".utodo-root {\n  --ut-accent: #e0a15b;\n  --ut-accent-soft: rgba(224, 161, 91, 0.16);\n  --ut-line: rgba(128, 128, 128, 0.2);\n  --ut-line-strong: rgba(128, 128, 128, 0.32);\n  --ut-surface: rgba(128, 128, 128, 0.07);\n  --ut-surface-2: rgba(128, 128, 128, 0.12);\n  --ut-danger: #dd6a5e;\n  position: relative;\n  height: 100%;\n  overflow-y: auto;\n  overscroll-behavior: contain;\n  padding-top: var(--dsh-frame-top-clearance, 0px);\n  font-family: inherit;\n  color: inherit;\n  -webkit-font-smoothing: antialiased;\n}\n.utodo-root * { box-sizing: border-box; }\n.utodo-root button { font: inherit; color: inherit; }\n.utodo-shell { max-width: 860px; margin: 0 auto; padding: clamp(20px, 3.4vw, 44px) clamp(16px, 3.6vw, 36px) 128px; }\n.utodo-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 24px; }\n.utodo-title { margin: 0; font-size: 23px; font-weight: 640; letter-spacing: 0.01em; line-height: 1.25; }\n.utodo-sub { margin: 7px 0 0; font-size: 12.5px; line-height: 1.5; opacity: 0.55; }\n.utodo-tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 12px; background: var(--ut-surface); }\n.utodo-tab { appearance: none; border: 0; background: transparent; cursor: pointer; font-size: 13px; line-height: 1; padding: 8px 15px; border-radius: 9px; opacity: 0.6; transition: background-color 140ms ease, opacity 140ms ease; display: inline-flex; align-items: center; gap: 7px; }\n.utodo-tab:hover { opacity: 0.85; }\n.utodo-tab.is-active { background: var(--ut-surface-2); opacity: 1; box-shadow: inset 0 0 0 1px var(--ut-line); }\n.utodo-tab-count { font-size: 11px; font-variant-numeric: tabular-nums; opacity: 0.55; }\n.utodo-tab.is-active .utodo-tab-count { opacity: 0.8; }\n.utodo-composer { border: 1px solid var(--ut-line); border-radius: 16px; background: var(--ut-surface); padding: 14px; display: flex; flex-direction: column; gap: 12px; transition: border-color 160ms ease, background-color 160ms ease; }\n.utodo-composer:focus-within { border-color: var(--ut-line-strong); background: var(--ut-surface-2); }\n.utodo-input { width: 100%; background: transparent; border: 0; outline: none; font: inherit; font-size: 14.5px; line-height: 1.5; padding: 2px 2px 4px; color: inherit; }\n.utodo-input::placeholder { color: inherit; opacity: 0.38; }\n.utodo-textarea { width: 100%; min-height: 64px; max-height: 220px; resize: vertical; background: transparent; border: 0; outline: none; font: inherit; font-size: 14.5px; line-height: 1.6; padding: 2px; color: inherit; }\n.utodo-textarea::placeholder { color: inherit; opacity: 0.38; }\n.utodo-composer-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }\n.utodo-spacer { flex: 1 1 auto; }\n.utodo-seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: 9px; background: var(--ut-surface-2); }\n.utodo-seg-btn { appearance: none; border: 0; background: transparent; cursor: pointer; font-size: 11.5px; line-height: 1; padding: 6px 9px; border-radius: 7px; opacity: 0.6; white-space: nowrap; transition: background-color 140ms ease, opacity 140ms ease; }\n.utodo-seg-btn:hover { opacity: 0.85; }\n.utodo-seg-btn.is-active { background: var(--ut-surface-2); opacity: 1; box-shadow: inset 0 0 0 1px var(--ut-line); }\n.utodo-date { background: transparent; border: 1px solid var(--ut-line); border-radius: 8px; padding: 5px 8px; font: inherit; font-size: 12px; color: inherit; outline: none; color-scheme: inherit; }\n.utodo-date:focus { border-color: var(--ut-line-strong); }\n.utodo-dash { opacity: 0.4; font-size: 12px; }\n.utodo-quick { display: inline-flex; gap: 4px; }\n.utodo-quick-btn { appearance: none; border: 1px solid var(--ut-line); background: transparent; border-radius: 999px; padding: 4px 9px; font-size: 11.5px; cursor: pointer; opacity: 0.7; transition: opacity 140ms ease, background-color 140ms ease; }\n.utodo-quick-btn:hover { opacity: 1; background: var(--ut-surface-2); }\n.utodo-add { appearance: none; border: 0; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 560; cursor: pointer; background: var(--ut-accent); color: #221a10; transition: filter 140ms ease, opacity 140ms ease; }\n.utodo-add:hover { filter: brightness(1.06); }\n.utodo-add:disabled { opacity: 0.4; cursor: default; filter: none; }\n.utodo-group { margin-top: 30px; }\n.utodo-group-head { display: flex; align-items: baseline; gap: 9px; margin: 0 0 10px; padding: 0 2px; }\n.utodo-group-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.5; }\n.utodo-group-count { font-size: 11.5px; opacity: 0.35; font-variant-numeric: tabular-nums; }\n.utodo-group.is-overdue .utodo-group-label { color: var(--ut-danger); opacity: 0.85; }\n.utodo-group.is-today .utodo-group-label { color: var(--ut-accent); opacity: 0.95; }\n.utodo-group + .utodo-group { border-top: 1px solid var(--ut-line); padding-top: 6px; }\n.utodo-view-body { margin-top: 22px; }\n.utodo-views { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 12px; background: var(--ut-surface); border: 1px solid var(--ut-line); }\n.utodo-view { appearance: none; border: 0; background: transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; line-height: 1; padding: 8px 14px; border-radius: 9px; opacity: 0.6; transition: background-color 140ms ease, opacity 140ms ease, box-shadow 140ms ease; }\n.utodo-view:hover { opacity: 0.85; }\n.utodo-view.is-active { background: var(--ut-surface-2); opacity: 1; box-shadow: inset 0 0 0 1px var(--ut-line-strong); }\n.utodo-view-count { font-size: 11px; font-variant-numeric: tabular-nums; opacity: 0.5; }\n.utodo-view.is-active .utodo-view-count { opacity: 0.85; }\n.utodo-panel { margin-top: 20px; }\n.utodo-empty.is-compact { margin-top: 16px; padding: 22px 18px; border-radius: 14px; }\n.utodo-empty.is-compact .utodo-empty-title { font-size: 13px; }\n.utodo-empty.is-compact .utodo-empty-text { font-size: 12px; margin-top: 6px; }\n.utodo-pin-label svg { opacity: 0.9; flex: 0 0 auto; }\n.utodo-pin { border-left: 2px solid var(--ut-line-strong); padding-left: 14px; }\n.utodo-pin.utodo-panel { padding: 15px 16px 15px 18px; border: 1px solid var(--ut-line); border-left-width: 2px; border-radius: 14px; background: var(--ut-surface); }\n.utodo-pin.utodo-panel .utodo-pin-head { margin-bottom: 12px; }\n.utodo-pin.utodo-panel .utodo-row { padding: 10px 10px; }\n.utodo-pin.utodo-panel .utodo-row:hover { background: var(--ut-surface-2); }\n.utodo-pin.is-important { border-left-color: var(--ut-accent); }\n.utodo-pin-head { display: flex; align-items: center; gap: 9px; margin: 0 0 10px; flex-wrap: wrap; padding: 0 2px; }\n.utodo-pin-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; display: inline-flex; align-items: center; gap: 6px; opacity: 0.6; }\n.utodo-pin.is-important .utodo-pin-label { color: var(--ut-accent); opacity: 1; }\n.utodo-pin-count { font-size: 11.5px; opacity: 0.35; font-variant-numeric: tabular-nums; }\n.utodo-pin-note { font-size: 11.5px; opacity: 0.42; }\n.utodo-pin-range { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; }\n.utodo-pin-range .utodo-seg-btn { padding: 4px 8px; font-size: 11px; }\n.utodo-days { width: 48px; background: transparent; border: 1px solid var(--ut-line); border-radius: 8px; padding: 3px 6px; font: inherit; font-size: 11.5px; color: inherit; outline: none; text-align: center; }\n.utodo-days:focus { border-color: var(--ut-line-strong); }\n.utodo-pin-empty { margin: 0; font-size: 12.5px; line-height: 1.6; opacity: 0.42; padding: 4px 0 2px; }\n.utodo-star.is-on { color: var(--ut-accent); opacity: 1; }\n.utodo-badge.is-star { background: var(--ut-accent-soft); color: var(--ut-accent); }\n.utodo-quick-btn.is-star { color: var(--ut-accent); border-color: var(--ut-accent); background: var(--ut-accent-soft); opacity: 1; }\n.utodo-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }\n.utodo-row { display: flex; align-items: flex-start; gap: 11px; padding: 11px 12px; border-radius: 12px; border: 1px solid transparent; transition: background-color 140ms ease, border-color 140ms ease; }\n.utodo-row:hover { background: var(--ut-surface); border-color: var(--ut-line); }\n.utodo-check { flex: 0 0 auto; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; border: 1.5px solid var(--ut-line-strong); background: transparent; cursor: pointer; padding: 0; display: inline-flex; align-items: center; justify-content: center; transition: border-color 140ms ease, background-color 140ms ease; }\n.utodo-check:hover { border-color: var(--ut-accent); }\n.utodo-check.is-done { background: var(--ut-accent); border-color: var(--ut-accent); }\n.utodo-check svg { opacity: 0; transition: opacity 140ms ease; }\n.utodo-check.is-done svg { opacity: 1; }\n.utodo-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }\n.utodo-row-title { font-size: 14px; line-height: 1.5; word-break: break-word; cursor: text; }\n.utodo-row.is-done .utodo-row-title { text-decoration: line-through; opacity: 0.42; }\n.utodo-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; line-height: 1.4; opacity: 0.5; }\n.utodo-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: 0.6; }\n.utodo-badge { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 2px 7px; font-size: 11px; background: var(--ut-surface-2); }\n.utodo-badge.is-accent { background: var(--ut-accent-soft); color: var(--ut-accent); }\n.utodo-badge.is-danger { background: rgba(221, 106, 94, 0.15); color: var(--ut-danger); }\n.utodo-row-actions { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 4px; opacity: 0; transition: opacity 140ms ease; }\n.utodo-row:hover .utodo-row-actions, .utodo-row:focus-within .utodo-row-actions { opacity: 1; }\n.utodo-icon-btn { appearance: none; border: 0; background: transparent; width: 26px; height: 26px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.55; transition: opacity 140ms ease, background-color 140ms ease, color 140ms ease; }\n.utodo-icon-btn:hover { opacity: 1; background: var(--ut-surface-2); }\n.utodo-icon-btn.is-danger:hover { color: var(--ut-danger); background: rgba(221, 106, 94, 0.14); }\n.utodo-confirm { appearance: none; border: 1px solid rgba(221, 106, 94, 0.45); background: rgba(221, 106, 94, 0.12); color: var(--ut-danger); border-radius: 7px; font-size: 11.5px; padding: 4px 8px; cursor: pointer; white-space: nowrap; }\n.utodo-inline-form { display: flex; align-items: center; gap: 8px; width: 100%; }\n.utodo-inline-input { flex: 1 1 auto; min-width: 0; background: transparent; border: 1px solid var(--ut-line-strong); border-radius: 8px; padding: 5px 9px; font: inherit; font-size: 14px; color: inherit; outline: none; }\n.utodo-inline-editor { display: flex; flex-direction: column; gap: 9px; padding: 4px 0; }\n.utodo-empty { margin-top: 34px; padding: 34px 24px; border: 1px dashed var(--ut-line); border-radius: 16px; text-align: center; }\n.utodo-empty-title { margin: 0; font-size: 14px; font-weight: 560; opacity: 0.72; }\n.utodo-empty-text { margin: 8px 0 0; font-size: 12.5px; line-height: 1.6; opacity: 0.45; }\n.utodo-ideas { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 10px; }\n.utodo-idea { border: 1px solid var(--ut-line); border-radius: 14px; background: var(--ut-surface); padding: 13px 14px 11px; display: flex; flex-direction: column; gap: 9px; transition: border-color 140ms ease, background-color 140ms ease; }\n.utodo-idea:hover { border-color: var(--ut-line-strong); background: var(--ut-surface-2); }\n.utodo-idea-text { margin: 0; font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }\n.utodo-idea-foot { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }\n.utodo-chip { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 3px 9px; font-size: 11.5px; font-weight: 500; background: var(--ut-tag-bg, var(--ut-accent-soft)); color: var(--ut-tag-fg, var(--ut-accent)); box-shadow: inset 0 0 0 1px var(--ut-tag-line, transparent); }\n.utodo-chip-x { appearance: none; border: 0; background: transparent; padding: 0; margin-left: 1px; cursor: pointer; color: inherit; opacity: 0.55; font-size: 12px; line-height: 1; }\n.utodo-chip-x:hover { opacity: 1; }\n.utodo-chip-add { appearance: none; border: 1px dashed var(--ut-line-strong); background: transparent; border-radius: 999px; padding: 3px 9px; font-size: 11.5px; cursor: pointer; opacity: 0.55; transition: opacity 140ms ease; }\n.utodo-chip-add:hover { opacity: 0.95; }\n.utodo-tag-input { flex: 1 1 auto; min-width: 120px; background: transparent; border: 0; outline: none; font: inherit; font-size: 12.5px; color: inherit; padding: 3px 2px; }\n.utodo-tag-input::placeholder { color: inherit; opacity: 0.36; }\n.utodo-tagbox { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1 1 auto; }\n.utodo-filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 20px; }\n.utodo-filter { appearance: none; border: 1px solid var(--ut-tag-line, var(--ut-line)); background: transparent; border-radius: 999px; padding: 4px 11px; font-size: 11.5px; cursor: pointer; opacity: 0.62; color: var(--ut-tag-fg, inherit); transition: opacity 140ms ease, border-color 140ms ease, color 140ms ease; }\n.utodo-filter:hover { opacity: 0.9; }\n.utodo-filter.is-active { opacity: 1; font-weight: 500; border-color: var(--ut-tag-line, var(--ut-accent)); color: var(--ut-tag-fg, var(--ut-accent)); background: var(--ut-tag-bg, var(--ut-accent-soft)); }\n.utodo-foot { margin-top: 44px; font-size: 11px; opacity: 0.32; text-align: center; line-height: 1.6; }\n.utodo-root ::-webkit-scrollbar { width: 10px; height: 10px; }\n.utodo-root ::-webkit-scrollbar-thumb { background: var(--ut-line-strong); border-radius: 99px; border: 3px solid transparent; background-clip: content-box; }\n@media (max-width: 560px) {\n  .utodo-head { flex-direction: column; align-items: stretch; }\n  .utodo-tabs { align-self: flex-start; }\n}";

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
      return { todos: [], ideas: [], settings: Object.assign({}, DEFAULT_SETTINGS, { tagTones: {} }) };
    }

    function normalizeSettings(raw) {
      const settings = Object.assign({}, DEFAULT_SETTINGS, { tagTones: normalizeToneMap(raw && raw.tagTones) });
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
      const inputRef = useRef(null);

      function submit(event) {
        event.preventDefault();
        const text = title.trim();
        if (!text) return;
        props.onAdd({
          id: newId(),
          title: text,
          done: false,
          important: important,
          start: isISO(date.start) ? date.start : null,
          end: isISO(date.end) && date.end !== date.start ? date.end : null,
          createdAt: Date.now(),
        });
        setTitle("");
        setDate({ start: null, end: null });
        setImportant(false);
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

      return h(
        "li",
        { className: "utodo-row" + (todo.done ? " is-done" : "") },
        h(
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
            h("span", { className: badgeClass }, schedule.label),
            schedule.note ? h("span", { className: "utodo-meta-dot" }) : null,
            schedule.note ? h("span", null, schedule.note) : null,
          ),
        ),
        h(
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
          })),
        ));
      }

      return h("div", null, nodes);
    }

    function UtodoPage() {
      const [data, setData] = useState(loadData);
      const [tab, setTab] = useState("todos");
      const [view, setView] = useState("all");

      useEffect(() => {
        saveData(data);
      }, [data]);

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
          ),
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
                            })
                          : h(TodoList, {
                              groups: groups,
                              today: today,
                              onToggle: toggleTodo,
                              onDelete: removeTodo,
                              onUpdate: updateTodo,
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
              }),
          h("p", { className: "utodo-foot" }, "数据保存在本机浏览器存储中，不会上传。"),
        ),
      );
    }

    /* ---------------------------------------------------------- registration */

    function apply(ctx) {
      injectStyle();
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
    };
    exports.PANEL_ID = PANEL_ID;
    exports.PanelIcon = PanelIcon;
    exports.UtodoPage = UtodoPage;
    exports.inject = ["slots"];
    exports.apply = apply;
    return module.exports;
  },
});
