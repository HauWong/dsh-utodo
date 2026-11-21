#!/usr/bin/env node
/**
 * UI contract audit for dsh-utodo.
 *
 * The stylesheet is the only place visual decisions live, so it is the only
 * place that needs policing: every colour, type size, radius and spacing step
 * must come from the --ut-* tokens on .utodo-root. Run after touching
 * lib/client.js:
 *
 *   node .recon/ui-audit.mjs
 *
 * Exit 0 = clean, 1 = violations (one per line).
 */
import { readFileSync } from 'node:fs';

const SRC = 'lib/client.js';
const src = readFileSync(SRC, 'utf8');
const BT = String.fromCharCode(96);

const errors = [];
const fail = (rule, line, detail) => errors.push(rule + ' :: ' + detail + (line ? '  [line ' + line + ']' : ''));

/* ---------------------------------------------------------------- extract */

const open = 'const CSS = ' + BT;
const startIdx = src.indexOf(open);
const endIdx = startIdx < 0 ? -1 : src.indexOf(BT + ';', startIdx + open.length);
if (startIdx < 0 || endIdx < 0) {
  console.error('ui-audit :: cannot find the CSS template literal in ' + SRC);
  process.exit(1);
}
const raw = src.slice(startIdx + open.length, endIdx);
/* keep line numbers stable: blank out comments, preserve their newlines */
const css = raw.replace(/\/\*[\s\S]*?\*\//g, block => block.replace(/[^\n]/g, ''));
const cssStartLine = src.slice(0, startIdx).split('\n').length;
const cssLineOf = at => cssStartLine + css.slice(0, at).split('\n').length - 1;

/* The token block is the only place raw colours may appear. */
const tokenBlockMatch = /\.utodo-root \{([\s\S]*?)\n\}/.exec(css);
if (!tokenBlockMatch) fail('tokens', 0, '.utodo-root token block is missing');
const tokenBlock = tokenBlockMatch ? tokenBlockMatch[1] : '';
const declared = new Set();
for (const m of tokenBlock.matchAll(/(--ut-[a-z0-9-]+)\s*:/g)) declared.add(m[1]);

const rules = [];
{
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('{', i);
    if (at < 0) break;
    const close = css.indexOf('}', at);
    if (close < 0) break;
    rules.push({ selector: css.slice(i, at).trim(), body: css.slice(at + 1, close), at: i });
    i = close + 1;
  }
}

/* ------------------------------------------------------- colour literals */

const COLOUR = /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g;
for (const rule of rules) {
  rule.body.split('\n').forEach((line, offset) => {
    if (/^\s*--ut-[a-z0-9-]+\s*:/.test(line)) return;
    for (const m of line.matchAll(COLOUR)) {
      fail('colour', cssLineOf(rule.at) + offset + 1, rule.selector + ' uses raw colour ' + m[1] + ' — add or reuse a --ut-* token');
    }
  });
}

/* --------------------------------------------------------- type / radius */

for (const rule of rules) {
  for (const decl of rule.body.split(';')) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (!value) continue;
    if (prop === 'font-size' && !/^var\(--ut-fs-[a-z0-9-]+\)$/.test(value) && value !== 'inherit') {
      fail('font-size', cssLineOf(rule.at), rule.selector + ' :: ' + value + ' (use --ut-fs-*)');
    }
    if (prop === 'border-radius') {
      const ok = value.split(/\s+/).every(part => /^var\(--ut-r-[a-z0-9-]+\)$/.test(part) || part === '0' || part === '50%' || part === 'inherit');
      if (!ok) fail('radius', cssLineOf(rule.at), rule.selector + ' :: ' + value + ' (use --ut-r-*)');
    }
  }
}

/* ------------------------------------------------------------- spacing */

const SPACE = new Set([0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96]);
const SPACING = /^(padding|margin|gap|row-gap|column-gap|top|right|bottom|left|inset)(-[a-z]+)?$/;
for (const rule of rules) {
  for (const decl of rule.body.split(';')) {
    const colon = decl.indexOf(':');
    if (colon < 0) continue;
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (!value || !SPACING.test(prop)) continue;
    for (const token of value.match(/-?\d+(\.\d+)?px/g) || []) {
      if (!SPACE.has(Math.abs(parseFloat(token)))) {
        fail('spacing', cssLineOf(rule.at), rule.selector + ' :: ' + prop + ': ' + value + ' (' + token + ' is off the 4pt scale)');
      }
    }
  }
}

/* ------------------------------------------------------- token references */

const knownVars = new Set(declared);
for (const extra of ['--ut-tag-bg', '--ut-tag-fg', '--ut-tag-line', '--dsh-frame-top-clearance']) knownVars.add(extra);
for (const rule of rules) {
  for (const m of rule.body.matchAll(/var\((--ut-[a-z0-9-]+|--dsh-[a-z-]+)/g)) {
    if (!knownVars.has(m[1])) fail('var', cssLineOf(rule.at), 'unknown custom property ' + m[1]);
  }
}

/* -------------------------------------------------- class inventory parity */

const cssClasses = new Set();
for (const rule of rules) for (const m of rule.selector.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) cssClasses.add(m[1]);

const usedClasses = new Set();
for (const m of src.matchAll(/className:\s*"([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && usedClasses.add(c));
for (const m of src.matchAll(/"(?: ?)((?:is-[a-z-]+|utodo-[a-z-]+)(?: [a-z-]+)*)"/g)) m[1].split(/\s+/).forEach(c => c && usedClasses.add(c));

for (const name of usedClasses) {
  if (!cssClasses.has(name)) fail('class', 0, 'className "' + name + '" has no rule in the stylesheet');
}
for (const name of cssClasses) {
  if (!usedClasses.has(name)) fail('class', 0, 'stylesheet rule .' + name + ' is never used (delete it or wire it up)');
}

/* -------------------------------------------------------- button hygiene */

for (const m of src.matchAll(/h\(\s*"button",\s*\{/g)) {
  const probe = src.slice(m.index, m.index + 320);
  if (!/type:\s*"(button|submit)"/.test(probe)) fail('button', src.slice(0, m.index).split('\n').length, 'button without an explicit type');
}

/* ------------------------------------------------------------- reporting */

if (errors.length) {
  console.error('ui-audit :: ' + errors.length + ' violation(s)');
  for (const line of [...new Set(errors)]) console.error('  - ' + line);
  process.exit(1);
}
console.log('ui-audit :: clean — ' + rules.length + ' rules, ' + cssClasses.size + ' classes, ' + declared.size + ' tokens');
