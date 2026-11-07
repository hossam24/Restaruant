import { DELIVERY, HOURS, type DeliveryConfig, type Hours } from '../config'
import { CATEGORIES } from './categories'
import type { Overrides } from './overrides'
import type { CategoryId, MenuItem } from './types'

export interface Settings {
  hours: Hours | null
  delivery: DeliveryConfig
}

export const DEFAULT_SETTINGS: Settings = { hours: HOURS, delivery: DELIVERY }

export interface ShopData {
  overrides: Overrides
  extras: MenuItem[]
  settings: Settings
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const int = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

export function sanitizeSettings(raw: unknown, fallback: Settings = DEFAULT_SETTINGS): Settings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const d = (typeof r.delivery === 'object' && r.delivery !== null ? r.delivery : {}) as Record<string, unknown>

  let hours = fallback.hours
  if (r.hours === null) hours = null
  else if (typeof r.hours === 'object') {
    const h = r.hours as Record<string, unknown>
    if (typeof h.open === 'string' && typeof h.close === 'string' && TIME.test(h.open) && TIME.test(h.close) && h.open !== h.close) {
      hours = { open: h.open, close: h.close }
    }
  }

  const delivery: DeliveryConfig = { ...fallback.delivery }
  if (d.fee === null || int(d.fee, 0, 10_000)) delivery.fee = d.fee as number | null
  if (d.freeOver === null || int(d.freeOver, 1, 100_000)) delivery.freeOver = d.freeOver as number | null
  if (d.estimate === null) delivery.estimate = null
  else if (typeof d.estimate === 'string') delivery.estimate = d.estimate.trim().slice(0, 60) || null
  if (delivery.fee === null) delivery.freeOver = null

  return { hours, delivery }
}

export const MAX_EXTRAS = 100
const EXTRA_ID = /^x-[a-z0-9]{4,20}$/
const IMAGE_URL = /^\/api\/img\/[a-f0-9]{16}$/
export const DEFAULT_IMAGE = '/imgs/default.webp'

export function sanitizeExtras(raw: unknown): MenuItem[] {
  if (!Array.isArray(raw)) return []
  const out: MenuItem[] = []
  const seen = new Set<string>()
  const categories = new Set<string>(CATEGORIES.map((c) => c.id))

  for (const value of raw.slice(0, MAX_EXTRAS)) {
    if (typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    const id = typeof v.id === 'string' ? v.id : ''
    const name = typeof v.name === 'string' ? v.name.trim().slice(0, 80) : ''
    if (!EXTRA_ID.test(id) || seen.has(id) || !name || !int(v.price, 1, 100_000)) continue
    if (typeof v.category !== 'string' || !categories.has(v.category)) continue

    const item: MenuItem = {
      id,
      category: v.category as CategoryId,
      name,
      image: typeof v.image === 'string' && IMAGE_URL.test(v.image) ? v.image : DEFAULT_IMAGE,
      price: v.price,
    }
    if (typeof v.description === 'string' && v.description.trim()) item.description = v.description.trim().slice(0, 200)
    if (int(v.oldPrice, 1, 100_000) && v.oldPrice > v.price) item.oldPrice = v.oldPrice
    if (v.hidden === true) item.hidden = true
    if (v.soldOut === true) item.soldOut = true
    seen.add(id)
    out.push(item)
  }
  return out
}
