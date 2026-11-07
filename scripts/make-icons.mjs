// Extracts the 256px BMP entry of public/imgs/icon.ico and writes PNG app icons.
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const ico = readFileSync('public/imgs/icon.ico')
const count = ico.readUInt16LE(4)
let best = { w: 0, off: 0 }
for (let i = 0; i < count; i++) {
  const o = 6 + i * 16
  const w = ico[o] || 256
  if (w > best.w) best = { w, off: ico.readUInt32LE(o + 12) }
}
const hdr = best.off
const w = ico.readInt32LE(hdr + 4)
const h = ico.readInt32LE(hdr + 8) / 2 // height includes the AND mask
const bpp = ico.readUInt16LE(hdr + 14)
if (bpp !== 32) throw new Error(`Unsupported bit depth ${bpp}`)
const px = hdr + ico.readUInt32LE(hdr)
const rgba = Buffer.alloc(w * h * 4)
for (let y = 0; y < h; y++) {
  const src = px + (h - 1 - y) * w * 4 // rows are stored bottom-up
  for (let x = 0; x < w; x++) {
    const s = src + x * 4
    const d = (y * w + x) * 4
    rgba[d] = ico[s + 2]
    rgba[d + 1] = ico[s + 1]
    rgba[d + 2] = ico[s]
    rgba[d + 3] = ico[s + 3]
  }
}
const base = sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
for (const size of [192, 512]) {
  await base.clone().resize(size, size).png().toFile(`public/icon-${size}.png`)
}
console.log(`icons from ${w}x${h} source`)
