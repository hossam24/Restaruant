// Converts every raster image in public/imgs to a resized WebP and removes the original.
// Safe to re-run: files that are already .webp with a clean name are skipped.
import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'
import { webpPath } from './lib.mjs'

const ROOT = 'public/imgs'
const MAX_WIDTH = 900
const RASTER = new Set(['.jpg', '.jpeg', '.png'])

async function walk(dir) {
  const out = []
  for (const name of await readdir(dir)) {
    const p = join(dir, name)
    if ((await stat(p)).isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

let before = 0
let after = 0
for (const file of await walk(ROOT)) {
  const ext = extname(file).toLowerCase()
  if (!RASTER.has(ext)) continue
  const target = webpPath(file.split('\\').join('/'))
  before += (await stat(file)).size
  await sharp(file, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(target)
  after += (await stat(target)).size
  await unlink(file)
}
const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(`Images: ${mb(before)} MB -> ${mb(after)} MB`)
