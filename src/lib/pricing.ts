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

export interface SentOrder {
  url: string
  name: string
  lines: ResolvedLine[]
  totals: Totals
}
