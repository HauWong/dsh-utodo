import fs from 'node:fs'
const side = fs.readFileSync('.recon/dump/sidebar-client.js', 'utf8')
const layout = fs.readFileSync('.recon/dump/layout-client.js', 'utf8')
function windows(text, needle, before, after, max) {
  const out = []
  let at = -1
  while ((at = text.indexOf(needle, at + 1)) !== -1 && out.length < (max || 10)) {
    out.push(text.slice(Math.max(0, at - before), at + after))
  }
  return out
}
console.log('### sidebar panellist occurrences')
windows(side, 'panellist', 260, 260, 8).forEach((w, i) => console.log('[' + i + '] ' + w + '\n'))
console.log('### sidebar selectPanel windows')
windows(side, 'selectPanel(', 300, 300, 4).forEach((w, i) => console.log('[' + i + '] ' + w + '\n'))
console.log('### layout main slot windows')
windows(layout, 'slot', 0, 0, 1)
for (const needle of ['\`main\`', 'main', 'activePanelId']) {
  windows(layout, needle, 220, 260, 3).forEach((w, i) => console.log('[' + needle + i + '] ' + w + '\n'))
}
