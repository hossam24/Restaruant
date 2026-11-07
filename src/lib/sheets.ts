import { SHEET_API_URL } from '../config'
import type { ResolvedLine } from './pricing'
import type { OrderForm } from './validation'

export function saveOrderToSheet(lines: ResolvedLine[], form: OrderForm): void {
  if (!SHEET_API_URL) return
  fetch(SHEET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      customer: form,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        sizeId: l.sizeId,
        part: l.part,
        note: l.note,
        quantity: l.quantity,
      })),
    }),
    keepalive: true,
  }).catch(() => {})
}
