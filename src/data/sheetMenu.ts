// Turns what the Google Sheet script sends into menu items the site can show.
// The sheet is edited by people, so nothing in it is trusted: every field is checked, bad rows are dropped,
// and if nothing usable arrives the site keeps the menu it already has.
import { CATEGORIES } from './categories'
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './shopData'
import type { CategoryId, MenuItem, Size } from './types'

export const DEFAULT_IMAGE = '/imgs/default.webp'
export const MAX_ITEMS = 500

const ID = /^[A-Za-z0-9_-]{2,40}$/
const SIZE_ID = /^s[1-3]$/
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id))

const int = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * A photo is either a file name from the site's own photos ("offers/alf-hana.webp") or a full https address.
 * Anything else (other schemes, ../ tricks) becomes the default picture.
 */
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

function parseItem(raw: unknown): MenuItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === 'string' ? r.id : ''
  const name = text(r.name, 80)
  if (!ID.test(id) || !name || typeof r.category !== 'string' || !CATEGORY_IDS.has(r.category)) return null

  const item: MenuItem = { id, category: r.category as CategoryId, name, image: resolveImage(r.image) }
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
  settings: Settings
}

/** Returns `null` when the answer has no usable items, so a broken sheet never empties the menu. */
export function parseSheetMenu(raw: unknown): SheetMenu | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (r.ok === false || !Array.isArray(r.items)) return null

  const seen = new Set<string>()
  const items: MenuItem[] = []
  for (const value of r.items.slice(0, MAX_ITEMS)) {
    const item = parseItem(value)
    if (item && !seen.has(item.id)) {
      seen.add(item.id)
      items.push(item)
    }
  }
  if (items.length === 0) return null
  return { items, settings: sanitizeSettings(r.settings, DEFAULT_SETTINGS) }
}
