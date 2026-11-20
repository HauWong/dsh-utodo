import fs from 'node:fs'
for (const name of ['sidebar', 'layout']) {
  const file = '.recon/dump/' + name + '-client.js'
  if (!fs.existsSync(file)) { console.log('MISSING ' + file); continue }
  const text = fs.readFileSync(file, 'utf8')
  console.log('=== ' + name + ' bytes=' + text.length)
  for (const needle of ['sidebar.panellist', 'panellist', 'label:', 'activeKey', 'activePanel', 'isActive']) {
    let at = -1, count = 0
    while ((at = text.indexOf(needle, at + 1)) !== -1) count++
    console.log('  ' + needle + ' x' + count)
  }
  const idx = text.indexOf('sidebar.panellist')
  if (idx !== -1) console.log('  PANELLIST WINDOW: ' + text.slice(Math.max(0, idx - 900), idx + 1100))
}
