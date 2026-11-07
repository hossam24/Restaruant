import { describe, expect, it } from 'vitest'
import { menuItems } from '../data/menu'
import { cartCount, cartSubtotal, lineKey, resolveLines, unitPrice } from './pricing'
import { normalizeDigits, validateOrder } from './validation'
import { RESTAURANT } from '../config'
import { buildOrderMessage, whatsappUrl } from './whatsapp'

const kofta = menuItems.find((i) => i.id === 'main-2')!
const mix = menuItems.find((i) => i.id === 'offers-2')!
const sandwich = menuItems.find((i) => i.category === 'السندوتشات')!

describe('menu data', () => {
  it('has unique ids', () => {
    expect(new Set(menuItems.map((i) => i.id)).size).toBe(menuItems.length)
  })
  it('gives every item a price or sizes', () => {
    for (const i of menuItems) expect(i.price !== undefined || (i.sizes?.length ?? 0) > 0).toBe(true)
  })
  it('marks the items that offer a leg/breast choice', () => {
    expect(menuItems.filter((i) => i.chickenChoice).map((i) => i.id)).toEqual(['offers-1', 'offers-2'])
  })
})

describe('pricing', () => {
  it('uses the size price', () => {
    expect(unitPrice(kofta, 's3')).toBe(450)
    expect(unitPrice(kofta, 's1')).toBe(115)
  })
  it('uses the new price for offers', () => {
    expect(unitPrice(mix)).toBe(130)
    expect(mix.oldPrice).toBe(160)
  })
  it('adds 10 for breast only', () => {
    expect(unitPrice(mix, undefined, 'ورك')).toBe(130)
    expect(unitPrice(mix, undefined, 'صدر')).toBe(140)
  })
  it('builds distinct keys per choice', () => {
    expect(lineKey('a', 'kilo', 'صدر')).not.toBe(lineKey('a', 'kilo', 'ورك'))
    expect(lineKey('a')).toBe('a')
  })
  it('resolves lines, totals, and drops unknown items', () => {
    const lines = resolveLines([
      { key: lineKey(kofta.id, 's2'), itemId: kofta.id, sizeId: 's2', quantity: 2 },
      { key: lineKey(mix.id, undefined, 'صدر'), itemId: mix.id, part: 'صدر', quantity: 1 },
      { key: 'ghost', itemId: 'does-not-exist', quantity: 5 },
    ])
    expect(lines).toHaveLength(2)
    expect(lines[0].name).toBe('كفتة مشوية - نص كيلو')
    expect(lines[1].name).toBe('وجبة الصحاب (صدر)')
    expect(cartSubtotal(lines)).toBe(225 * 2 + 140)
    expect(cartCount(lines)).toBe(3)
  })
})

describe('validation', () => {
  const ok = { name: 'أحمد', phone: '01012345678', additionalPhone: '', address: 'شارع التحرير', notes: '' }
  it('accepts a valid order', () => expect(validateOrder(ok)).toEqual({}))
  it('requires name, phone, address', () => {
    const e = validateOrder({ ...ok, name: ' ', phone: '', address: '' })
    expect(Object.keys(e).sort()).toEqual(['address', 'name', 'phone'])
  })
  it('rejects bad phone prefixes and lengths', () => {
    expect(validateOrder({ ...ok, phone: '01312345678' }).phone).toBeDefined()
    expect(validateOrder({ ...ok, phone: '0101234567' }).phone).toBeDefined()
    expect(validateOrder({ ...ok, phone: '01,12345678' }).phone).toBeDefined()
  })
  it('accepts Arabic-Indic digits', () => {
    expect(normalizeDigits('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678')
    expect(validateOrder({ ...ok, phone: '٠١٠١٢٣٤٥٦٧٨' })).toEqual({})
  })
  it('validates the extra phone only when given', () => {
    expect(validateOrder({ ...ok, additionalPhone: '123' }).additionalPhone).toBeDefined()
    expect(validateOrder({ ...ok, additionalPhone: '01112345678' })).toEqual({})
  })
})

describe('whatsapp message', () => {
  const lines = resolveLines([{ key: sandwich.id, itemId: sandwich.id, quantity: 2 }])
  const form = { name: 'أحمد', phone: '01012345678', additionalPhone: '', address: 'شارع التحرير', notes: 'بدون بصل' }
  it('contains the order, total, and customer details', () => {
    const m = buildOrderMessage(lines, form)
    expect(m).toContain(`${sandwich.name} (2x) - ${sandwich.price! * 2} جنيه`)
    expect(m).toContain(`الإجمالي: ${sandwich.price! * 2} جنيه غير شامل التوصيل`)
    expect(m).toContain('شارع التحرير')
    expect(m).toContain('01012345678')
    expect(m).toContain('بدون بصل')
    expect(m).not.toContain('رقم هاتف إضافي')
  })
  it('targets the restaurant number and is url-encoded', () => {
    const url = whatsappUrl('a b\nc')
    expect(url.startsWith(`https://wa.me/${RESTAURANT.whatsapp}?text=`)).toBe(true)
    expect(url).toContain('a%20b%0Ac')
  })
})
