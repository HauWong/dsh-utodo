import fs from 'node:fs'
const p = 'D:/DeepSeek Harness/resources/app.asar'
const fd = fs.openSync(p, 'r')
const b = Buffer.alloc(16)
fs.readSync(fd, b, 0, 16, 0)
const sizePickle = b.readUInt32LE(4)
const jsonLen = b.readUInt32LE(12)
const head = Buffer.alloc(jsonLen)
fs.readSync(fd, head, 0, jsonLen, 16)
const json = JSON.parse(head.toString('utf8'))
const dataStart = 8 + sizePickle
const files = new Map()
function walk(node, prefix) {
  for (const [name, v] of Object.entries(node.files ?? {})) {
    const path = prefix + '/' + name
    if (v.files) walk(v, path)
    else files.set(path, v)
  }
}
walk(json, '')
const needle = process.argv[2]
const filter = process.argv[3] ?? ''
const limit = Number(process.argv[4] ?? 8)
const ctx = Number(process.argv[5] ?? 240)
const results = []
for (const [path, meta] of files) {
  if (filter && !path.includes(filter)) continue
  if (meta.size > 6_000_000) continue
  const buf = Buffer.alloc(meta.size)
  fs.readSync(fd, buf, 0, meta.size, dataStart + Number(meta.offset))
  const text = buf.toString('utf8')
  const at = text.indexOf(needle)
  if (at === -1) continue
  results.push({ path, count: text.split(needle).length - 1, window: text.slice(Math.max(0, at - ctx), at + ctx) })
  if (results.length >= limit) break
}
console.log(JSON.stringify({ needle, dataStart, results }, null, 1).slice(0, 9000))
