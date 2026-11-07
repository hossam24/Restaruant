// Builds google-apps-script.js: the template plus the site's current menu as the starting data
// for an empty Google Sheet. Run with `npm run apps-script`.
import { readFileSync, writeFileSync } from 'node:fs'

const CATEGORY_LABEL = {
  offers: 'العروض',
  sandwich: 'سندوتشات رشيدي',
  mashawy: 'مشويات رشيدي',
  wagabatFardy: 'وجبات رشيدي فردية',
  wagabatZawgy: 'وجبات رشيدي زوجية',
  sawaany: 'صواني عائلية',
  edafat: 'الاضافات',
}

// src/data/menu.ts is "export const menuItems: MenuItem[] = [ ...json... ]"
const source = readFileSync('src/data/menu.ts', 'utf8')
const items = JSON.parse(source.slice(source.indexOf('[', source.indexOf('=')), source.lastIndexOf(']') + 1))

const imageName = (url) => decodeURI(url).replace(/^\/imgs\//, '')

const rows = items.map((i) => {
  const s = i.sizes ?? []
  return [
    i.id,
    CATEGORY_LABEL[i.category],
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
if (!template.includes('/*__SEED__*/ []')) throw new Error('seed placeholder missing in the template')
const output = template.replace('/*__SEED__*/ []', JSON.stringify(rows))
writeFileSync('google-apps-script.js', output)
console.log(`google-apps-script.js written: ${rows.length} menu rows, ${(output.length / 1024).toFixed(1)} KB`)
