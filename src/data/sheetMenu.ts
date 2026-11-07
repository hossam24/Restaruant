import type { Category } from './categories'
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './shopData'
import type { MenuItem, Size } from './types'

export const DEFAULT_IMAGE = '/imgs/default.webp'
export const MAX_ITEMS = 500
export const MAX_CATEGORIES = 30

const ID = /^[A-Za-z0-9_-]{2,40}$/
const SIZE_ID = /^s[1-3]$/

const int = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function resolveImage(raw: unknown): string {
  const v = text(raw, 400)
  if (!v) return DEFAULT_IMAGE
  if (/^https:\/\//i.test(v)) {
    try {
      const url = new URL(v)
      return url.protocol === 'https:' ? url.href : DEFAULT_IMAGE
    } catch {
      return DEFAULT_IMAGE
    }
  }
  if (/[:\\]|\.\.|^\/\//.test(v)) return DEFAULT_IMAGE
  return encodeURI('/imgs/' + v.replace(/^\/+/, '').replace(/^imgs\//, ''))
}

function parseItem(raw: unknown, isCategory: (id: string) => boolean): MenuItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' ? r.id : ''
  const name = text(r.name, 80)
  if (!ID.test(id) || !name || typeof r.category !== 'string' || !isCategory(r.category)) return null

  const item: MenuItem = { id, category: r.category, name, image: resolveImage(r.image) }
  const description = text(r.description, 300)
  if (description) item.description = description

  if (Array.isArray(r.sizes) && r.sizes.length > 0) {
    const sizes: Size[] = []
    for (const s of r.sizes.slice(0, 3)) {
      const o = (typeof s === 'object' && s !== null ? s : {}) as Record<string, unknown>
      const sizeName = text(o.name, 30)
      if (typeof o.id !== 'string' || !SIZE_ID.test(o.id) || !sizeName || !int(o.price, 1, 100_000)) return null
      sizes.push({ id: o.id, name: sizeName, price: o.price })
    }
    item.sizes = sizes
  } else {
    if (!int(r.price, 1, 100_000)) return null
    item.price = r.price
    if (int(r.oldPrice, 1, 100_000) && r.oldPrice > r.price) item.oldPrice = r.oldPrice
  }

  if (r.chickenChoice === true) item.chickenChoice = true
  if (r.soldOut === true) item.soldOut = true
  if (r.hidden === true) item.hidden = true
  return item
}

export interface SheetMenu {
  items: MenuItem[]
  categories: Category[]
  settings: Settings
}

function parseCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: Category[] = []
  for (const value of raw.slice(0, MAX_CATEGORIES)) {
    const o = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
    const id = text(o.id, 40)
    const label = text(o.label, 40) || id
    if (!id || seen.has(id)) continue
    seen.add(id)
    const note = text(o.note, 200)
    out.push(note ? { id, label, note } : { id, label })
  }
  return out
}

export function parseSheetMenu(raw: unknown): SheetMenu | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (r.ok === false || !Array.isArray(r.items)) return null

  const listed = parseCategories(r.categories)
  const known = new Set(listed.map((c) => c.id))
  const isCategory = (id: string) => (listed.length > 0 ? known.has(id) : id.trim() !== '' && id.length <= 40)

  const seen = new Set<string>()
  const items: MenuItem[] = []
  for (const value of r.items.slice(0, MAX_ITEMS)) {
    const item = parseItem(value, isCategory)
    if (item && !seen.has(item.id)) {
      seen.add(item.id)
      items.push(item)
    }
  }
  if (items.length === 0) return null
  const categories =
    listed.length > 0 ? listed : [...new Set(items.map((i) => i.category))].map((id): Category => ({ id, label: id }))
  return { items, categories, settings: sanitizeSettings(r.settings, DEFAULT_SETTINGS) }
}
