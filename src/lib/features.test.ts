import { describe, expect, it } from 'vitest'
import { menuItems } from '../data/menu'
import { formatTime, openStatus } from './hours'
import { lineKey, orderTotals, resolveLines } from './pricing'
import { matchesQuery, minPrice, normalizeArabic, sortItems } from './search'
import { buildOrderMessage } from './whatsapp'

describe('opening hours', () => {
  const day = { open: '12:00', close: '23:00' }
  const late = { open: '12:00', close: '02:00' } // closes after midnight

  it('handles a same-day schedule', () => {
    expect(openStatus(day, 11 * 60 + 59).open).toBe(false)
    expect(openStatus(day, 12 * 60).open).toBe(true)
    expect(openStatus(day, 22 * 60 + 59).open).toBe(true)
    expect(openStatus(day, 23 * 60).open).toBe(false)
  })
  it('handles closing after midnight', () => {
    expect(openStatus(late, 23 * 60).open).toBe(true)
    expect(openStatus(late, 60).open).toBe(true) // 01:00
    expect(openStatus(late, 2 * 60).open).toBe(false) // 02:00
    expect(openStatus(late, 8 * 60).open).toBe(false)
  })
  it('reports when the status changes next', () => {
    expect(openStatus(day, 15 * 60).changesAt).toBe('23:00')
    expect(openStatus(day, 8 * 60).changesAt).toBe('12:00')
  })
  it('formats times in 12-hour Arabic', () => {
    expect(formatTime('00:00')).toBe('12:00 ص')
    expect(formatTime('12:30')).toBe('12:30 م')
    expect(formatTime('23:05')).toBe('11:05 م')
  })
})

describe('search', () => {
  it('treats ة/ه, أ/ا and diacritics as equal', () => {
    expect(normalizeArabic('فَرْخَة')).toBe(normalizeArabic('فرخه'))
    expect(normalizeArabic('أكلة')).toBe(normalizeArabic('اكله'))
  })
  it('finds items regardless of spelling', () => {
    const hits = menuItems.filter((i) => matchesQuery(i, 'فرخه'))
    expect(hits.length).toBeGreaterThan(3)
    expect(hits.length).toBe(menuItems.filter((i) => matchesQuery(i, 'فرخة')).length)
  })
  it('requires every word to match', () => {
    const both = menuItems.filter((i) => matchesQuery(i, 'كفتة ممبار'))
    expect(both.length).toBeGreaterThan(0)
    for (const i of both) {
      const text = normalizeArabic(`${i.name} ${i.description ?? ''}`)
      expect(text).toContain('كفته')
      expect(text).toContain('ممبار')
    }
  })
  it('matches everything for an empty query and nothing for gibberish', () => {
    expect(menuItems.every((i) => matchesQuery(i, '  '))).toBe(true)
    expect(menuItems.some((i) => matchesQuery(i, 'zzzxxx'))).toBe(false)
  })
  it('sorts by lowest price', () => {
    const asc = sortItems(menuItems, 'asc').map(minPrice)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    const desc = sortItems(menuItems, 'desc').map(minPrice)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
    expect(sortItems(menuItems, 'default')).toBe(menuItems)
  })
})

describe('delivery totals', () => {
  it('keeps the old "excluding delivery" behaviour when no fee is set', () => {
    const t = orderTotals(200, { fee: null, freeOver: null, estimate: null })
    expect(t).toMatchObject({ deliveryFee: null, total: 200, remainingForFree: null })
  })
  it('adds a fixed fee', () => {
    const t = orderTotals(200, { fee: 20, freeOver: null, estimate: null })
    expect(t).toMatchObject({ deliveryFee: 20, total: 220, freeDelivery: false })
  })
  it('makes delivery free over the threshold and tells how much is left below it', () => {
    const cfg = { fee: 20, freeOver: 300, estimate: null }
    expect(orderTotals(300, cfg)).toMatchObject({ deliveryFee: 0, total: 300, freeDelivery: true })
    expect(orderTotals(250, cfg)).toMatchObject({ deliveryFee: 20, remainingForFree: 50 })
    expect(orderTotals(0, cfg).remainingForFree).toBeNull()
  })
})

describe('item notes', () => {
  const item = menuItems.find((i) => i.category === 'sandwich')!
  it('makes lines with different notes separate', () => {
    expect(lineKey(item.id, undefined, undefined, 'بدون بصل')).not.toBe(lineKey(item.id))
  })
  it('puts the note in the WhatsApp message under its item', () => {
    const lines = resolveLines([
      { key: lineKey(item.id, undefined, undefined, 'بدون بصل'), itemId: item.id, note: 'بدون بصل', quantity: 1 },
    ])
    const form = { name: 'أحمد', phone: '01012345678', additionalPhone: '', address: 'شارع الحلو', notes: '' }
    const m = buildOrderMessage(lines, form)
    expect(m).toContain('   📝 بدون بصل')
  })
  it('shows the delivery fee lines when one is configured', () => {
    const lines = resolveLines([{ key: item.id, itemId: item.id, quantity: 1 }])
    const form = { name: 'أحمد', phone: '01012345678', additionalPhone: '', address: 'x', notes: '' }
    const m = buildOrderMessage(lines, form, orderTotals(35, { fee: 15, freeOver: null, estimate: null }))
    expect(m).toContain('التوصيل: 15 جنيه')
    expect(m).toContain('الإجمالي: 50 جنيه')
    expect(m).not.toContain('غير شامل التوصيل')
  })
})
