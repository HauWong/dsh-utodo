#!/usr/bin/env node
/** Renders the stylesheet against a static mock of the panel so a change can be
 *  eyeballed in a real browser without launching DSH:
 *
 *    node .recon/preview.mjs   # writes .recon/preview-light.html / -dark.html
 *
 *  The markup mirrors the component tree in lib/client.js; keep it in sync when
 *  a component gains a new class. It is a design harness, not a test. */
import { readFileSync, writeFileSync } from 'node:fs';

const BT = String.fromCharCode(96);
const src = readFileSync('lib/client.js', 'utf8');
const open = 'const CSS = ' + BT;
const start = src.indexOf(open) + open.length;
const css = src.slice(start, src.indexOf(BT + ';', start));
const body = readFileSync('.recon/preview-body.html', 'utf8');

const THEMES = {
  light: { bg: '#fbfaf8', fg: '#232020' },
  dark: { bg: '#1c1b1a', fg: '#e9e5e0' },
};

for (const [name, theme] of Object.entries(THEMES)) {
  const html = '<!doctype html>\n<html lang="zh-CN" data-theme="' + name + '">\n<head><meta charset="utf-8">'
    + '<title>utodo preview (' + name + ')</title>'
    + '<style>html,body{margin:0;background:' + theme.bg + ';color:' + theme.fg + ';'
    + 'font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif}'
    + '.utodo-root{height:auto!important;overflow:visible!important}</style>'
    + '<style>' + css + '</style></head>\n<body>\n' + body + '\n</body></html>';
  writeFileSync('.recon/preview-' + name + '.html', html);
}
console.log('preview :: wrote .recon/preview-light.html and .recon/preview-dark.html');