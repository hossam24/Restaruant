import { readFileSync, writeFileSync } from 'node:fs'

const categorySource = readFileSync('src/data/categories.ts', 'utf8')
const categories = [...categorySource.matchAll(/\{ id: '([^']+)', label: '([^']+)'(?:, note: '([^']+)')? \}/g)].map((m) => [m[2], m[3] ?? ''])
if (categories.length === 0) throw new Error('no categories found in src/data/categories.ts')

const source = readFileSync('src/data/menu.ts', 'utf8')
const start = source.indexOf('[', source.indexOf('= [', source.indexOf('export const menuItems')))
const items = JSON.parse(source.slice(start, source.lastIndexOf(']') + 1))

const imageName = (url) => (url === '/imgs/default.webp' ? '' : decodeURI(url).replace(/^\/imgs\//, ''))

const rows = items.map((i) => {
  const s = i.sizes ?? []
  return [
    i.id,
    i.category,
    i.name,
    i.description ?? '',
    i.sizes ? '' : i.price,
    i.oldPrice ?? '',
    s[0]?.name ?? '',
    s[0]?.price ?? '',
    s[1]?.name ?? '',
    s[1]?.price ?? '',
    s[2]?.name ?? '',
    s[2]?.price ?? '',
    i.chickenChoice ? 'نعم' : 'لا',
    'نعم',
    'نعم',
    imageName(i.image),
  ]
})

const template = readFileSync('scripts/apps-script.template.js', 'utf8')
if (!template.includes('/*__SEED__*/ []') || !template.includes('/*__SEED_CATEGORIES__*/ []')) throw new Error('seed placeholder missing in the template')
const output = template.replace('/*__SEED__*/ []', () => JSON.stringify(rows)).replace('/*__SEED_CATEGORIES__*/ []', () => JSON.stringify(categories))
writeFileSync('google-apps-script.js', output)
console.log(`google-apps-script.js written: ${rows.length} menu rows, ${categories.length} sections, ${(output.length / 1024).toFixed(1)} KB`)
