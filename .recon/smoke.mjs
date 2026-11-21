
import fs from 'node:fs'
import path from 'node:path'

/* ---- a minimal React good enough for one static render pass ---- */
const flatten = (list) => {
  const out = []
  for (const item of list) {
    if (Array.isArray(item)) out.push(...flatten(item))
    else if (item !== null && item !== undefined && item !== false && item !== true) out.push(item)
  }
  return out
}
const React = {
  createElement(type, props, ...children) {
    return { type, props: props || {}, children: flatten(children) }
  },
  useState(init) {
    const value = typeof init === 'function' ? init() : init
    return [value, () => {}]
  },
  useEffect() {},
  useMemo(fn) { return fn() },
  useRef(value) { return { current: value === undefined ? null : value } },
}

/* ---- globals the bundle expects ---- */
let factory = null
globalThis.window = {
  __ModuleLoader__: { load(reg) { factory = reg.factory } },
  localStorage: {
    store: new Map(),
    getItem(k) { return this.store.has(k) ? this.store.get(k) : null },
    setItem(k, v) { this.store.set(k, v) },
  },
  setTimeout: () => 0,
  clearTimeout: () => {},
}
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ id: '', textContent: '' }),
  head: { appendChild() {} },
  querySelectorAll: () => [],
}

const today = new Date()
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const shift = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d) }

const seed = {
  todos: [
    { id: 'a', title: '回邮件', done: false, start: shift(0), end: null, createdAt: 1 },
    { id: 'b', title: '交房租', done: false, start: shift(-3), end: null, createdAt: 2 },
    { id: 'c', title: '产品评审', done: false, important: true, start: shift(-1), end: shift(2), createdAt: 3 },
    { id: 'g', title: '报名', done: false, important: true, start: shift(1), end: null, createdAt: 7 },
    { id: 'd', title: '出差', done: false, start: shift(10), end: shift(13), createdAt: 4 },
    { id: 'e', title: '读书', done: false, start: null, end: null, createdAt: 5 },
    { id: 'f', title: '买牛奶', done: true, start: shift(0), end: null, createdAt: 6 },
  ],
  ideas: [
    { id: 'i1', text: '做一个待办插件', tags: ['dsh', '设计'], createdAt: Date.now() },
    { id: 'i2', text: '换个思路', tags: ['dsh'], createdAt: Date.now() },
    { id: 'i3', text: '没有标签的想法', tags: [], createdAt: Date.now() },
  ],
}
globalThis.window.localStorage.setItem('dsh-utodo.v1', JSON.stringify(seed))

const source = fs.readFileSync(path.join(process.cwd(), 'lib', 'client.js'), 'utf8')
// Evaluate the bundle as an ES module from a data URL so its top-level window call runs.
await import('data:text/javascript;base64,' + Buffer.from(source, 'utf8').toString('base64'))

if (!factory) throw new Error('bundle did not register a factory')
const exports = factory(name => {
  if (name === 'react') return React
  throw new Error('unexpected require: ' + name)
})

const textOf = (node) => {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  const { type, props, children } = node
  const allChildren = flatten([props.children ?? [], children])
  if (typeof type === 'function') return textOf(type(Object.assign({}, props, { children: allChildren })))
  return textOf(allChildren)
}

const page = React.createElement(exports.UtodoPage, {})
const pageText = textOf(page)
const internals = exports.__internals
const ideaText = textOf(React.createElement(internals.IdeasPanel, {
  ideas: seed.ideas, onAdd() {}, onUpdate() {}, onDelete() {},
}))

/* every chip and filter label must carry its own tag colour, and no two tags
   may resolve to the same colour */
function collectTagged(node, out) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) { node.forEach(item => collectTagged(item, out)); return }
  const { type, props, children } = node
  const all = flatten([props.children ?? [], children])
  const cls = typeof props.className === 'string' ? props.className.split(' ') : []
  if (cls.includes('utodo-chip')) out.push({ kind: 'chip', label: textOf(all), style: props.style || {} })
  if (cls.includes('utodo-filter')) out.push({ kind: 'filter', label: textOf(all), style: props.style || {} })
  if (typeof type === 'function') collectTagged(type(Object.assign({}, props, { children: all })), out)
  else all.forEach(item => collectTagged(item, out))
}
const palette = internals.TAG_PALETTE || []
const paletteFgs = palette.map(tone => tone.fg)
const colorFailures = []
if (palette.length !== 6) colorFailures.push('palette has ' + palette.length + ' tones, expected 6')
if (new Set(paletteFgs).size !== 6) colorFailures.push('palette repeats a colour')

/* colours are assigned on first use and persisted with the data */
const store = internals.normalizeData(seed)
const tones = store.settings.tagTones
const tagged = []
collectTagged(React.createElement(internals.IdeasPanel, {
  ideas: store.ideas, tones: tones, onAdd() {}, onUpdate() {}, onDelete() {},
}), tagged)
const tagColors = {}
for (const item of tagged) {
  if (item.label.startsWith('全部')) continue // the "all tags" button carries no tag
  const fg = item.style['--ut-tag-fg']
  if (!fg) { colorFailures.push(item.kind + ' ' + item.label + ' :: no tag colour'); continue }
  const tag = item.label.replace(/^#/, '').split(' ')[0]
  if (tagColors[tag] && tagColors[tag] !== fg) colorFailures.push('unstable colour for #' + tag)
  tagColors[tag] = fg
  if (paletteFgs.indexOf(fg) === -1) colorFailures.push('#' + tag + ' :: colour ' + fg + ' is outside the palette')
  if (!Number.isInteger(tones[tag])) colorFailures.push('#' + tag + ' :: has no persisted tone')
}

/* the first six tags own six different tones; a seventh reuses the palette */
const many = internals.normalizeData({
  todos: [], settings: {},
  ideas: [0, 1, 2, 3, 4, 5, 6].map(i => ({ text: 'idea' + i, tags: ['tone' + i] })),
})
const manyTones = many.settings.tagTones
const firstSix = [0, 1, 2, 3, 4, 5].map(i => manyTones['tone' + i])
if (new Set(firstSix).size !== 6) colorFailures.push('first six tags share tones: ' + JSON.stringify(firstSix))
if (!Number.isInteger(manyTones.tone6)) colorFailures.push('seventh tag got no tone')
const reloaded = internals.normalizeData(JSON.parse(JSON.stringify(many)))
for (const tag of Object.keys(manyTones)) {
  if (reloaded.settings.tagTones[tag] !== manyTones[tag]) colorFailures.push('tone for #' + tag + ' changed across reload')
}
for (let i = 0; i < 200; i += 1) {
  const fg = internals.tagColor('标签' + i)['--ut-tag-fg']
  if (paletteFgs.indexOf(fg) === -1) colorFailures.push('hash fallback left the palette at ' + i)
}
/* a chip previewed in the composer already wears the tone it keeps after saving */
const fresh = internals.normalizeData(seed)
const previewFg = internals.tagColor('全新标签', fresh.settings.tagTones)['--ut-tag-fg']
const saved = internals.normalizeData({
  todos: [], settings: fresh.settings,
  ideas: [{ text: 'x', tags: ['全新标签'] }].concat(fresh.ideas),
})
if (previewFg !== internals.tagColor('全新标签', saved.settings.tagTones)['--ut-tag-fg']) {
  colorFailures.push('composer preview does not match the colour kept after saving')
}

/* the two pinned sections: starred todos, and deadlines inside a set window */
const todos = seed.todos
const highlights = {
  important: internals.pickImportant(todos).map(t => t.title),
  custom1: internals.pickSoon(todos, shift(0), 1).map(t => t.title),
  soon2: internals.pickSoon(todos, shift(0), 2).map(t => t.title),
  soon7: internals.pickSoon(todos, shift(0), 7).map(t => t.title),
  soon30: internals.pickSoon(todos, shift(0), 30).map(t => t.title),
}
const highlightFailures = []
const expectList = (label, actual, want) => {
  if (JSON.stringify(actual) !== JSON.stringify(want)) highlightFailures.push(label + ' => ' + JSON.stringify(actual))
}
expectList('important', highlights.important, ['报名', '产品评审'])
expectList('soon1', highlights.custom1, ['回邮件', '报名'])
expectList('soon2', highlights.soon2, ['回邮件', '报名', '产品评审'])
expectList('soon7', highlights.soon7, ['回邮件', '报名', '产品评审'])
expectList('soon30', highlights.soon30, ['回邮件', '报名', '产品评审', '出差'])
/* the todo tab now switches between three views; only one renders at a time */
const panelProps = { todos, today: shift(0), onToggle() {}, onUpdate() {}, onDelete() {} }
const importantText = textOf(React.createElement(internals.ImportantPanel, panelProps))
const soonText = textOf(React.createElement(internals.SoonPanel, Object.assign({}, panelProps, { soonDays: 2, onSoonDays() {} })))
const soon30Text = textOf(React.createElement(internals.SoonPanel, Object.assign({}, panelProps, { soonDays: 30, onSoonDays() {} })))
for (const needle of ['重要事项', '报名', '产品评审']) {
  if (!importantText.includes(needle)) highlightFailures.push('important panel :: missing ' + needle)
}
if (importantText.includes('出差')) highlightFailures.push('important panel lists a non-starred todo')
for (const needle of ['临期事项', '未来 2 天内到期', '回邮件', '报名', '30天', '7天']) {
  if (!soonText.includes(needle)) highlightFailures.push('soon panel :: missing ' + needle)
}
if (soonText.includes('出差')) highlightFailures.push('soon panel (2d) lists a 10-day todo')
if (!soon30Text.includes('出差')) highlightFailures.push('soon panel (30d) hides a 10-day todo')
for (const needle of ['全部待办', '重要', '临期']) {
  if (!pageText.includes(needle)) highlightFailures.push('page :: missing view tab ' + needle)
}
if (pageText.includes('重要事项') || pageText.includes('临期事项')) {
  highlightFailures.push('page renders more than one view at once')
}

/* settings migrate from old data and stay inside 1..365 */
const settingsCases = [
  ['empty', internals.normalizeData({}).settings.soonDays, 2],
  ['zero', internals.normalizeData({ settings: { soonDays: 0 } }).settings.soonDays, 2],
  ['nine', internals.normalizeData({ settings: { soonDays: 9 } }).settings.soonDays, 9],
  ['huge', internals.normalizeData({ settings: { soonDays: 9999 } }).settings.soonDays, 365],
]
for (const [label, actual, want] of settingsCases) {
  if (actual !== want) highlightFailures.push('settings ' + label + ' => ' + actual + ' (want ' + want + ')')
}

const groups = internals.groupTodos(seed.todos, shift(0))
const schedule = internals.scheduleOf(seed.todos[2], shift(0))

const expect = [
  ['header', '待办与想法'],
  ['tabs', '想法'],
  ['composer placeholder', '添加一条待办，回车即可'],
  ['group overdue', '逾期'],
  ['group today', '今天'],
  ['group upcoming', '即将到来'],
  ['group someday', '未设日期'],
  ['group done', '已完成'],
  ['subtitle', '6 条待办进行中'],
  ['range note', '剩余 2 天'],
  ['idea text', '做一个待办插件'],
  ['idea tag', '#dsh'],
  ['tag filter counts', '#dsh 2'],
  ['idea empty-free', '没有标签的想法'],
]
const failures = expect.filter(([, needle]) => !(pageText + '|' + ideaText).includes(needle))

/* reminders: one firing per day+time; any todo may remind, never past its last day */
const remindFailures = []
const rem = internals.normalizeData({
  todos: [
    { id: 'r1', title: '单日提醒', start: shift(0), end: null, remind: '09:30' },
    { id: 'r2', title: '区间也给时间', start: shift(-1), end: shift(1), remind: '09:30' },
    { id: 'r3', title: '非法时间', start: shift(0), remind: '25:00' },
    { id: 'r4', title: '触发日越界', start: shift(0), remind: '08:00', remindDay: shift(30) },
    { id: 'r5', title: '提前提醒', start: shift(2), remind: '07:15', remindDay: shift(-3) },
    { id: 'r6', title: '无日期', remind: '06:00' },
  ],
})
const [r1, r2, r3, r4, r5, r6] = rem.todos
if (internals.remindKey(r1) !== shift(0) + 'T09:30') remindFailures.push('remindKey r1 => ' + internals.remindKey(r1))
if (r2.remind !== '09:30') remindFailures.push('a date range keeps its time')
if (internals.remindKey(r2) !== shift(1) + 'T09:30') remindFailures.push('a range must fire on its last day => ' + internals.remindKey(r2))
if (r3.remind !== null) remindFailures.push('an invalid time must be dropped')
if (internals.remindDay(r4) !== shift(0)) remindFailures.push('a reminder day past the last day must clamp => ' + internals.remindDay(r4))
if (internals.remindDay(r5) !== shift(-3)) remindFailures.push('an earlier reminder day must survive => ' + internals.remindDay(r5))
if (internals.remindDay(r5) !== r5.remindDay) remindFailures.push('the clamped day must be stored')
if (internals.remindDay(r6) !== shift(0)) remindFailures.push('a todo with no dates reminds today => ' + internals.remindDay(r6))
if (internals.clampRemindDay(shift(9), shift(0), shift(4)) !== shift(4)) remindFailures.push('clampRemindDay cap is wrong')
if (internals.lastDayOf(null, null) !== null || internals.lastDayOf(shift(0), shift(2)) !== shift(2)) remindFailures.push('lastDayOf is wrong')
if (internals.isTime('09:30') !== true || internals.isTime('9:30') !== false) remindFailures.push('isTime is not strict')

/* the import block carries exactly what was ticked */
if (internals.buildImportText(rem, {}) !== '') remindFailures.push('an empty selection must produce no block')
const importText = internals.buildImportText(rem, { 'todo:r1': true })
for (const needle of ['以下内容来自', '**待办**', '- [ ] 单日提醒', '提醒 ' + shift(0) + ' 09:30']) {
  if (!importText.includes(needle)) remindFailures.push('import text :: missing ' + needle)
}
if (importText.includes('区间不给时间')) remindFailures.push('import text leaked an unselected todo')

/* one request shape per channel */
const wecom = internals.pushRequest({ channel: 'wecom', target: 'https://qyapi.weixin.qq.com/x' }, { title: 'T', content: 'C' })
if (!wecom || wecom.method !== 'POST' || !wecom.body || wecom.body.msgtype !== 'text') remindFailures.push('wecom payload is wrong')
const serverchan = internals.pushRequest({ channel: 'serverchan', target: 'SCT123' }, { title: 'T', content: 'C' })
if (!serverchan || serverchan.method !== 'GET' || serverchan.url.indexOf('https://sctapi.ftqq.com/SCT123.send') !== 0) remindFailures.push('serverchan url is wrong')
if (internals.pushRequest({ channel: 'wecom', target: '' }, { title: 'T', content: 'C' }) !== null) remindFailures.push('an empty target must not build a request')

console.log(JSON.stringify({
  pageLength: pageText.length,
  remindFailures,
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.map(t => t.title)])),
  scheduleOfRange: schedule,
  failures: failures.map(([label, needle]) => label + ' :: missing ' + needle),
  tagColors,
  colorFailures,
  highlights,
  highlightFailures,
  ideasPanelSnippet: ideaText.slice(0, 400),
}, null, 1))
