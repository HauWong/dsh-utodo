import fs from 'node:fs'

/* Minimal React again: just enough for the icon components. */
const React = {
  createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useEffect() {},
  useMemo: (fn) => fn(),
  useRef: (v) => ({ current: v === undefined ? null : v }),
}

const source = fs.readFileSync('lib/client.js', 'utf8')
let factory = null
globalThis.window = { __ModuleLoader__: { load(reg) { factory = reg.factory } }, localStorage: { getItem: () => null, setItem() {} } }
globalThis.document = { getElementById: () => null, createElement: () => ({ id: '', textContent: '' }), head: { appendChild() {} } }
await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const exports = factory(n => { if (n === 'react') return React; throw new Error('unexpected require ' + n) })

const registrations = []
const injections = []
const ctx = {
  slots: {
    inject(key, cb) {
      injections.push(key)
      const disposer = cb()
      if (typeof disposer !== 'function') throw new Error('inject callback for ' + key + ' did not return a disposer')
    },
    register(options, component) {
      if (!options || typeof options.name !== 'string') throw new Error('register called without a slot name')
      if (typeof component !== 'function') throw new Error('register called without a component for ' + options.name)
      registrations.push({ name: options.name, id: options.id, key: options.key, order: options.order, label: options.label })
      return () => {}
    },
  },
}
exports.apply(ctx)

const panellist = registrations.find(r => r.name === 'sidebar.panellist')
const main = registrations.find(r => r.name === 'main')
const iconNode = exports.PanelIcon({ size: 18 })
const problems = []
if (exports.inject.join(',') !== 'slots') problems.push('inject should be ["slots"]')
if (!panellist) problems.push('no sidebar.panellist registration')
if (!main) problems.push('no main registration')
if (panellist && panellist.id !== exports.PANEL_ID) problems.push('panellist id mismatch')
if (main && main.key !== (panellist && panellist.id)) problems.push('main key must equal the panellist id')
if (main && main.id !== undefined) problems.push('main must be keyed (key), not id')
const resolvedLabel = typeof panellist?.label === 'function' ? panellist.label() : panellist?.label
if (typeof resolvedLabel !== 'string' || resolvedLabel.length === 0) problems.push('label must resolve to a non-empty string')
if (!iconNode || iconNode.type !== 'svg') problems.push('panel icon must render an svg')
if (iconNode && (iconNode.props.width !== 18 || iconNode.props.height !== 18)) problems.push('panel icon must honour size')
if (main && main.name !== 'main') problems.push('main name')
console.log(JSON.stringify({ injections, registrations, problems }, null, 1))
