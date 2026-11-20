
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
const out = []
function walk(node, prefix) {
  for (const [name, v] of Object.entries(node.files ?? {})) {
    const path = prefix + '/' + name
    if (v.files) walk(v, path)
    else out.push(path)
  }
}
walk(json, '')
const q = process.argv[2]
const hits = out.filter(x => q ? x.includes(q) : true)
console.log(JSON.stringify({ total: out.length, hits: hits.slice(0, 60) }, null, 1))
