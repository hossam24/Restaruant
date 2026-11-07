// The owner edits the menu from the admin page. Instead of rewriting menu.ts, the admin saves a small
// list of *changes* (overrides) that are laid over the built-in menu. If the server is unreachable the
// site simply shows the built-in menu, so a backend problem can never take the menu down.
import type { MenuItem } from './types'

export interface ItemOverride {
  /** New price for an item sold at one price. */
  price?: number
  /** Price before the discount. `null` removes the offer. Must be higher than the price. */
  oldPrice?: number | null
  /** New price per size id, for items sold by size. */
  sizes?: Record<string, number>
  hidden?: boolean
  soldOut?: boolean
}

export type Overrides = Record<string, ItemOverride>

export function applyOverrides(items: MenuItem[], overrides: Overrides): MenuItem[] {
  return items.map((item) => {
    const o = overrides[item.id]
    if (!o) return item
    const next: MenuItem = { ...item }
    if (item.sizes) {
      next.sizes = item.sizes.map((s) => ({ ...s, price: o.sizes?.[s.id] ?? s.price }))
    } else {
      if (o.price !== undefined) next.price = o.price
      if (o.oldPrice === null) delete next.oldPrice
      else if (o.oldPrice !== undefined) next.oldPrice = o.oldPrice
    }
    if (o.hidden) next.hidden = true
    if (o.soldOut) next.soldOut = true
    return next
  })
}

const MAX_PRICE = 100_000
const isPrice = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= MAX_PRICE

/**
 * Cleans whatever the browser sent: unknown items and sizes are dropped, prices must be whole numbers,
 * and anything equal to the built-in menu is not stored. Never trust the admin page's data blindly.
 */
export function sanitizeOverrides(raw: unknown, base: MenuItem[]): Overrides {
  const out: Overrides = {}
  if (typeof raw !== 'object' || raw === null) return out
  const byId = new Map(base.map((i) => [i.id, i]))

  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const item = byId.get(id)
    if (!item || typeof value !== 'object' || value === null) continue
    const v = value as Record<string, unknown>
    const clean: ItemOverride = {}

    if (item.sizes) {
      const sizes: Record<string, number> = {}
      const given = (typeof v.sizes === 'object' && v.sizes !== null ? v.sizes : {}) as Record<string, unknown>
      for (const s of item.sizes) {
        const p = given[s.id]
        if (isPrice(p) && p !== s.price) sizes[s.id] = p
      }
      if (Object.keys(sizes).length) clean.sizes = sizes
    } else {
      const price = isPrice(v.price) ? v.price : item.price
      if (isPrice(v.price) && v.price !== item.price) clean.price = v.price
      if (v.oldPrice === null) {
        if (item.oldPrice !== undefined) clean.oldPrice = null
      } else if (isPrice(v.oldPrice) && price !== undefined && v.oldPrice > price && v.oldPrice !== item.oldPrice) {
        clean.oldPrice = v.oldPrice
      }
      // A price raised to or above the old "before" price would show a nonsense offer: drop the offer.
      const effPrice = clean.price ?? item.price
      const effOld = clean.oldPrice === null ? undefined : (clean.oldPrice ?? item.oldPrice)
      if (effOld !== undefined && effPrice !== undefined && effOld <= effPrice) {
        if (item.oldPrice !== undefined) clean.oldPrice = null
        else delete clean.oldPrice
      }
    }
    if (v.hidden === true) clean.hidden = true
    if (v.soldOut === true) clean.soldOut = true

    if (Object.keys(clean).length) out[id] = clean
  }
  return out
}
