import { SHEET_API_URL } from '../config'
import type { ResolvedLine } from './pricing'
import type { OrderForm } from './validation'

/**
 * Sends the order to the Google Sheet script, which checks it again, works out the prices itself from the
 * menu in the sheet, and records it in today's tab.
 * Failures are ignored on purpose: the WhatsApp message is the real order, the sheet is the record.
 * `keepalive` lets the request finish even though the page is about to open WhatsApp.
 */
export function saveOrderToSheet(lines: ResolvedLine[], form: OrderForm): void {
  if (!SHEET_API_URL) return
  fetch(SHEET_API_URL, {
    method: 'POST',
    // text/plain keeps this a "simple" request, which Google's servers accept from a browser.
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
