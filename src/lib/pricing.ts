import { getItem } from '../data/menuStore'
import type { CartLine, MenuItem } from '../data/types'
import { lineName, unitPrice, type Totals } from './pricingCore'

export { lineKey, lineName, orderTotals, unitPrice, type Totals } from './pricingCore'

export interface ResolvedLine extends CartLine {
  item: MenuItem
  name: string
  unitPrice: number
  total: number
}

/** Joins stored cart lines with the current menu. Lines whose item is gone or hidden are dropped. */
export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  const out: ResolvedLine[] = []
  for (const line of lines) {
    const item = getItem(line.itemId)
    if (!item || item.hidden) continue
    const price = unitPrice(item, line.sizeId, line.part)
    out.push({
      ...line,
      item,
      name: lineName(item, line.sizeId, line.part),
      unitPrice: price,
      total: price * line.quantity,
    })
  }
  return out
}

export const cartSubtotal = (lines: ResolvedLine[]) => lines.reduce((sum, l) => sum + l.total, 0)
export const cartCount = (lines: ResolvedLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0)

/** Everything the confirmation screen needs after an order was sent. */
export interface SentOrder {
  url: string
  name: string
  lines: ResolvedLine[]
  totals: Totals
}
