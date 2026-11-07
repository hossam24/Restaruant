import { RESTAURANT } from '../config'
import { cartSubtotal, orderTotals, type ResolvedLine, type Totals } from './pricing'
import { normalizeDigits, type OrderForm } from './validation'

const DIVIDER = '---------------------------------'

function totalsBlock(t: Totals): string {
  if (t.deliveryFee === null) return `\n💰 *الإجمالي: ${t.total} جنيه غير شامل التوصيل*\n\n`
  const delivery = t.freeDelivery ? 'توصيل مجاني' : `${t.deliveryFee} جنيه`
  return (
    `\n🧾 *المجموع الفرعي: ${t.subtotal} جنيه*\n` +
    `🛵 *التوصيل: ${delivery}*\n` +
    `💰 *الإجمالي: ${t.total} جنيه*\n\n`
  )
}

export function buildOrderMessage(lines: ResolvedLine[], form: OrderForm, totals?: Totals): string {
  const t = totals ?? orderTotals(cartSubtotal(lines))
  let m = '🍽️ *طلب جديد من ' + RESTAURANT.name + '*\n\n'
  m += '📦 *نوع الطلب: توصيل*\n\n'
  m += '📋 *الطلبات:*\n'
  for (const l of lines) {
    m += `\n• ${l.name} (${l.quantity}x) - ${l.total} جنيه\n`
    if (l.note) m += `   📝 ${l.note}\n`
    m += `${DIVIDER}\n`
  }
  m += totalsBlock(t)
  m += `📍 *عنوان التوصيل:*\n${form.address.trim()}\n${DIVIDER}\n`
  m += `👤 *اسم العميل:*\n${form.name.trim()}\n${DIVIDER}\n`
  m += `📞 *رقم الهاتف:*\n${normalizeDigits(form.phone.trim())}\n`
  const extra = normalizeDigits(form.additionalPhone.trim())
  if (extra) m += `\n📱 *رقم هاتف إضافي:*\n${extra}\n`
  m += `${DIVIDER}\n`
  if (form.notes.trim()) m += `📝 *ملاحظات إضافية:*\n${form.notes.trim()}\n`
  return m
}

export const whatsappUrl = (message: string) =>
  `https://wa.me/${RESTAURANT.whatsapp}?text=${encodeURIComponent(message)}`
