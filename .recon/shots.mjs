#!/usr/bin/env node
/**
 * Renders two README gallery shots from the live stylesheet, so the images in the
 * READMEs cannot drift away from lib/client.js:
 *
 *    node .recon/shots.mjs
 *    "#/msedge.exe" --headless=new --window-size=860,1100 --screenshot=screenshots/todo.png file:///<abs>/.recon/shot-todo.html
 *
 * It is a mock, not the running app: the markup mirrors the component tree so the
 * stylesheet is exercised for real, but no DSH session or localStorage is involved.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BT = String.fromCharCode(96);
const src = readFileSync('lib/client.js', 'utf8');
const open = 'const CSS = ' + BT;
const start = src.indexOf(open) + open.length;
const css = src.slice(start, src.indexOf(BT + ';', start));

const check = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const star = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6z" fill="currentColor"/></svg>';
const trash = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.6 8h4.8l.6-8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
const bell = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M4 6.5a4 4 0 018 0c0 3 1 4 1 4H3s1-1 1-4z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';

const row = (title, meta, badges, o) => {
  o = o || {};
  return '<li class="utodo-row' + (o.done ? ' is-done' : '') + '">'
    + '<button type="button" class="utodo-check' + (o.done ? ' is-done' : '') + '" aria-label="完成">' + check + '</button>'
    + '<div class="utodo-row-main"><span class="utodo-row-title">' + title + '</span><span class="utodo-meta">' + meta + badges + '</span></div>'
    + '<div class="utodo-row-actions"><button type="button" class="utodo-icon-btn utodo-star' + (o.important ? ' is-on' : '') + '" aria-label="重要">' + star + '</button>'
    + '<button type="button" class="utodo-icon-btn is-danger" aria-label="删除">' + trash + '</button></div></li>';
};
const TONE = {
  blue: ['rgba(92,120,147,.16)', '#5c7893', 'rgba(92,120,147,.42)'],
  green: ['rgba(103,128,94,.16)', '#67805e', 'rgba(103,128,94,.42)'],
  rose: ['rgba(150,108,108,.16)', '#966c6c', 'rgba(150,108,108,.42)'],
  violet: ['rgba(117,97,140,.16)', '#75618c', 'rgba(117,97,140,.42)'],
};
const chip = (text, tone) => {
  const t = TONE[tone];
  return '<span class="utodo-chip" style="--ut-tag-bg:' + t[0] + ';--ut-tag-fg:' + t[1] + ';--ut-tag-line:' + t[2] + '">' + text + '</span>';
};
const filter = (text, tone, on) => {
  const t = TONE[tone];
  return '<button type="button" class="utodo-filter' + (on ? ' is-active' : '') + '" style="--ut-tag-bg:' + t[0] + ';--ut-tag-fg:' + t[1] + ';--ut-tag-line:' + t[2] + '">' + text + '</button>';
};

const head = (active, tools) => '<header class="utodo-head">'
  + '<div><h1 class="utodo-title">待办与想法</h1><p class="utodo-sub">6 条待办进行中 · 2 条已完成 · 4 个想法</p></div>'
  + '<div class="utodo-tabs" role="tablist" aria-label="视图">'
  + '<button type="button" class="utodo-tab' + (active === 0 ? ' is-active' : '') + '">待办<span class="utodo-tab-count">6</span></button>'
  + '<button type="button" class="utodo-tab' + (active === 1 ? ' is-active' : '') + '">想法<span class="utodo-tab-count">4</span></button>'
  + '</div>'
  + (tools || '') + '</header>';

const todoPage = '<div class="utodo-root"><div class="utodo-shell">'
  + head(0)
  + '<div class="utodo-composer">'
  + '<input class="utodo-input" placeholder="添加一条待办，回车即可">'
  + '<div class="utodo-composer-row">'
  + '<button type="button" class="utodo-quick-btn">今天</button>'
  + '<button type="button" class="utodo-quick-btn">明天</button>'
  + '<span class="utodo-spacer"></span>'
  + '<button type="button" class="utodo-add">添加</button>'
  + '</div></div>'
  + '<div class="utodo-view-body">'
  + '<div class="utodo-views">'
  + '<button type="button" class="utodo-view is-active">全部<span class="utodo-view-count">6</span></button>'
  + '<button type="button" class="utodo-view">重要<span class="utodo-view-count">2</span></button>'
  + '<button type="button" class="utodo-view">即将到期<span class="utodo-view-count">3</span></button>'
  + '</div>'
  + '<section class="utodo-group is-today">'
  + '<div class="utodo-group-head"><span class="utodo-group-label">今天</span><span class="utodo-group-count">3</span></div>'
  + '<ul class="utodo-list">'
  + row('把「提醒推送」的设置项收进一张折叠卡', '今天 14:00 <span class="utodo-badge is-remind">提醒 09:30</span>', '', {})
  + row('给选中的待办和想法加一个「导入会话」按钮', '今天 <span class="utodo-badge is-star">重要</span>', '', { important: true })
  + row('核对企业微信群机器人的 Webhook', '今天', '', { done: true })
  + '</ul></section>'
  + '<section class="utodo-group is-overdue">'
  + '<div class="utodo-group-head"><span class="utodo-group-label">已逾期</span><span class="utodo-group-count">1</span></div>'
  + '<ul class="utodo-list">'
  + row('回填上周的复盘', '11 月 18 日', '<span class="utodo-badge is-danger">已逾期</span>', {})
  + '</ul></section>'
  + '<div class="utodo-pin is-important utodo-panel">'
  + '<div class="utodo-pin-head"><span class="utodo-pin-label">' + star + ' 重要</span><span class="utodo-pin-count">2</span></div>'
  + '<ul class="utodo-list">' + row('重构推送设置的字段布局', '11 月 22 日', '', {}) + '</ul>'
  + '</div>'
  + '<div class="utodo-empty is-compact"><p class="utodo-empty-title">未来 2 天内没有到期的事项</p>'
  + '<p class="utodo-empty-text">换个范围试试，或者给待办加上日期。</p></div>'
  + '</div>'
  + '<p class="utodo-foot">数据保存在本机浏览器存储中，不会上传。</p>'
  + '</div></div>';

const ideaPage = '<div class="utodo-root"><div class="utodo-shell">'
  + head(1)
  + '<div class="utodo-composer">'
  + '<textarea class="utodo-textarea" rows="2" placeholder="记一个想法，回车保存，Shift+回车换行"></textarea>'
  + '<div class="utodo-composer-row">'
  + '<div class="utodo-tagbox"><input class="utodo-input utodo-tag-input" placeholder="标签"></div>'
  + '<span class="utodo-spacer"></span>'
  + '<button type="button" class="utodo-add">保存</button>'
  + '</div></div>'
  + '<div class="utodo-view-body">'
  + '<div class="utodo-filters">' + filter('设计', 'blue', true) + filter('工程', 'green', false) + filter('复盘', 'rose', false) + filter('阅读', 'violet', false) + '</div>'
  + '<ul class="utodo-ideas">'
  + '<li class="utodo-idea"><p class="utodo-idea-text">把样式收成一套 token，比每次口头提醒更可靠。</p>'
  + '<div class="utodo-idea-foot">' + chip('设计', 'blue') + '<span class="utodo-spacer"></span><time class="utodo-meta">11 月 20 日</time><button type="button" class="utodo-icon-btn" aria-label="删除">' + trash + '</button></div></li>'
  + '<li class="utodo-idea"><p class="utodo-idea-text">提醒的补发窗口能不能按渠道配置？</p>'
  + '<div class="utodo-idea-foot">' + chip('工程', 'green') + '<span class="utodo-spacer"></span><time class="utodo-meta">11 月 19 日</time></div></li>'
  + '<li class="utodo-idea"><p class="utodo-idea-text">想法应该能一键变成待办，带日期。</p>'
  + '<div class="utodo-idea-foot">' + chip('设计', 'blue') + chip('工程', 'green') + '<span class="utodo-spacer"></span><time class="utodo-meta">11 月 18 日</time></div></li>'
  + '<li class="utodo-idea"><p class="utodo-idea-text">复盘模板先存成想法，周日再整理。' + '</p>'
  + '<div class="utodo-idea-foot">' + chip('复盘', 'rose') + '<span class="utodo-spacer"></span><time class="utodo-meta">11 月 17 日</time></div></li>'
  + '</ul></div>'
  + '<p class="utodo-foot">数据保存在本机浏览器存储中，不会上传。</p>'
  + '</div></div>';

const PAGES = {
  light: { bg: '#fbfaf8', fg: '#232020', body: todoPage },
  dark: { bg: '#1c1b1a', fg: '#e9e5e0', body: ideaPage },
};

for (const [name, page] of Object.entries(PAGES)) {
  const file = name === 'light' ? '.recon/shot-todo.html' : '.recon/shot-idea.html';
  const html = '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><title>utodo shot</title>'
    + '<style>html,body{margin:0;background:' + page.bg + ';color:' + page.fg + ';'
    + 'font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif}'
    + '.utodo-root{height:auto!important;overflow:visible!important}</style>'
    + '<style>' + css + '</style></head>\n<body>\n' + page.body + '\n</body></html>';
  writeFileSync(file, html);
}
console.log('shots :: wrote .recon/shot-todo.html and .recon/shot-idea.html');
