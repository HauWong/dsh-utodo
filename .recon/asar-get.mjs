
import fs from 'node:fs'
const p = 'D:/DeepSeek Harness/resources/app.asar'
const fd = fs.openSync(p, 'r')
const b = Buffer.alloc(16)
fs.readSync(fd, b, 0, 16, 0)
const jsonLen = b.readUInt32LE(12)
const head = Buffer.alloc(jsonLen)
fs.readSync(fd, head, 0, jsonLen, 16)
const json = JSON.parse(head.toString('utf8'))
const base = 16 + jsonLen
function find(node, parts, i) {
  const next = node.files?.[parts[i]]
  if (!next) return null
  if (i === parts.length - 1) return next
  return find(next, parts, i + 1)
}
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
for (const item of spec) {
  const parts = item.path.split('/').filter(Boolean)
  const node = find(json, parts, 0)
  if (!node || typeof node.offset !== 'string') { console.log('MISS ' + item.path); continue }
  const size = Number(node.size)
  const off = Number(node.offset)
  const buf = Buffer.alloc(size)
  fs.readSync(fd, buf, 0, size, base + off)
  const outPath = item.out
  fs.mkdirSync(outPath.split('/').slice(0, -1).join('/'), { recursive: true })
  fs.writeFileSync(outPath, buf)
  console.log('OK ' + item.path + ' -> ' + outPath + ' (' + size + 'B)')
}
