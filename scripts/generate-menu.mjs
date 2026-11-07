// One-time migration: legacy/json/*.json -> src/data/menu.ts
// Normalises prices (price + optional oldPrice), makes IDs stable, and turns the old
// "description contains ربع فرخة" text-sniffing into an explicit chickenChoice flag.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { webpPath } from './lib.mjs'

const SOURCES = [
  ['offers', 'offers'],
  ['sandwich', 'sandwich'],
  ['wagabat-fardy', 'wagabatFardy'],
  ['wagabat-zawgy', 'wagabatZawgy'],
  ['mashawy', 'mashawy'],
  ['sawaany', 'sawaany'],
  ['edafat', 'edafat'],
]

const FALLBACK = '/imgs/default.webp'
const missing = []

function image(src, label) {
  const p = webpPath(src)
  if (!existsSync(`public/${p}`)) {
    missing.push(`${label} -> ${p}`)
    return FALLBACK
  }
  return encodeURI(`/${p}`)
}

const items = []
for (const [file, category] of SOURCES) {
  const raw = JSON.parse(readFileSync(`legacy/json/${file}.json`, 'utf8'))
  const list = raw[category]
  list.forEach((it, i) => {
    const name = it.name.trim()
    const out = { id: `${category}-${i + 1}`, category, name }
    if (it.description) out.description = it.description.trim().replace(/\s+/g, ' ')
    out.image = image(it.image, `${category}/${name}`)
    if (it.hasSizes) {
      out.sizes = it.sizes.map((s) => ({ id: s.id, name: s.name, price: s.newPrice ?? s.price }))
    } else {
      const price = it.newPrice ?? it.price
      out.price = price
      const old = it.originalPrice
      if (old !== undefined && old !== price) out.oldPrice = old
    }
    if (it.description && /ربع فرخ[هة]/.test(it.description)) out.chickenChoice = true
    items.push(out)
  })
}

const header = `// Generated once from the old json/ folder by scripts/generate-menu.mjs.
// From now on this file is the source of truth: edit prices and items here.
import type { MenuItem } from './types'

export const menuItems: MenuItem[] = `
writeFileSync('src/data/menu.ts', header + JSON.stringify(items, null, 2) + '\n')
console.log(`Wrote ${items.length} items`)
if (missing.length) console.log('Missing images (using default):\n  ' + missing.join('\n  '))
