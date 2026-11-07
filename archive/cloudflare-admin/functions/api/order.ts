import { menuItems } from '../../src/data/menu'
import { applyOverrides } from '../../src/data/overrides'
import type { ChickenPart } from '../../src/data/types'
import { lineName, orderTotals, unitPrice } from '../../src/lib/pricingCore'
import { normalizeDigits, validateOrder, type OrderForm } from '../../src/lib/validation'
import { clientIp, json, rateLimited, readShop, type Env } from '../_shared/http'

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.APPS_SCRIPT_URL) return json({ error: 'تسجيل الطلبات في الشيت لسه متفعلش.' }, 503)

  if (await rateLimited(env, `order:${clientIp(request)}`, 6, 600)) {
    return json({ error: 'طلبات كتير في وقت قصير.' }, 429)
  }

  let body: { customer?: Record<string, unknown>; lines?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400)
  }

  const c = body.customer ?? {}
  const customer: OrderForm = {
    name: str(c.name, 100),
    phone: str(c.phone, 20),
    additionalPhone: str(c.additionalPhone, 20),
    address: str(c.address, 300),
    notes: str(c.notes, 500),
  }
  if (Object.keys(validateOrder(customer)).length > 0) return json({ error: 'بيانات العميل غير صحيحة.' }, 422)

  if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 40) {
    return json({ error: 'الطلب فاضي أو كبير أوي.' }, 422)
  }

  const shop = await readShop(env)
  const menu = [...applyOverrides(menuItems, shop.overrides), ...shop.extras]
  const byId = new Map(menu.map((i) => [i.id, i]))

  const rows: string[] = []
  let subtotal = 0
  for (const raw of body.lines as Record<string, unknown>[]) {
    const item = byId.get(str(raw?.itemId, 60))
    if (!item || item.hidden) return json({ error: 'في صنف مش موجود في المنيو.' }, 422)

    const quantity = raw.quantity
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return json({ error: 'كمية غير صحيحة.' }, 422)
    }

    const sizeId = item.sizes?.find((s) => s.id === raw.sizeId)?.id
    const part: ChickenPart | undefined =
      item.chickenChoice && (raw.part === 'ورك' || raw.part === 'صدر') ? raw.part : undefined
    const note = str(raw.note, 120)

    const total = unitPrice(item, sizeId, part) * quantity
    subtotal += total
    rows.push(`${lineName(item, sizeId, part)} (${quantity}x) - ${total} جنيه${note ? ` [${note}]` : ''}`)
  }
  const totals = orderTotals(subtotal, shop.settings.delivery)

  const upstream = await fetch(env.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    redirect: 'follow',
    body: JSON.stringify({
      secret: env.ORDER_SECRET ?? '',
      customerName: customer.name,
      phone: normalizeDigits(customer.phone),
      additionalPhone: normalizeDigits(customer.additionalPhone),
      address: customer.address,
      items: rows.join(' | '),
      total: `${totals.total} جنيه`,
      notes: customer.notes,
      orderType: 'توصيل',
    }),
  })
  const result = (await upstream.json().catch(() => null)) as { status?: string } | null
  if (!upstream.ok || result?.status !== 'success') return json({ error: 'تعذر تسجيل الطلب.' }, 502)
  return json({ ok: true })
}
