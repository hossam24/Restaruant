// Pure price logic with no browser or menu-store imports, so the server (functions/) can use it too.
import { BREAST_SURCHARGE, DELIVERY, type DeliveryConfig } from '../config'
import type { ChickenPart, MenuItem } from '../data/types'

export function lineKey(itemId: string, sizeId?: string, part?: ChickenPart, note?: string): string {
  const base = [itemId, sizeId, part].filter(Boolean).join('|')
  return note ? `${base}#${note}` : base
}

/** Price of one unit for a given choice of size and chicken part. */
export function unitPrice(item: MenuItem, sizeId?: string, part?: ChickenPart): number {
  const base = item.sizes
    ? (item.sizes.find((s) => s.id === sizeId) ?? item.sizes[0]).price
    : (item.price ?? 0)
  return base + (part === 'صدر' ? BREAST_SURCHARGE : 0)
}

export function lineName(item: MenuItem, sizeId?: string, part?: ChickenPart): string {
  let name = item.name
  if (item.sizes) {
    const size = item.sizes.find((s) => s.id === sizeId) ?? item.sizes[0]
    name += ` - ${size.name}`
  }
  if (part) name += ` (${part})`
  return name
}

export interface Totals {
  subtotal: number
  /** `null` when the delivery fee is not decided yet (total is then "غير شامل التوصيل"). */
  deliveryFee: number | null
  freeDelivery: boolean
  total: number
  /** How much more to add to get free delivery, or `null` when that does not apply. */
  remainingForFree: number | null
}

export function orderTotals(subtotal: number, delivery: DeliveryConfig = DELIVERY): Totals {
  if (delivery.fee === null) {
    return { subtotal, deliveryFee: null, freeDelivery: false, total: subtotal, remainingForFree: null }
  }
  const free = delivery.freeOver !== null && subtotal >= delivery.freeOver
  const fee = free ? 0 : delivery.fee
  const remaining =
    delivery.freeOver !== null && !free && delivery.fee > 0 && subtotal > 0 ? delivery.freeOver - subtotal : null
  return { subtotal, deliveryFee: fee, freeDelivery: free, total: subtotal + fee, remainingForFree: remaining }
}
