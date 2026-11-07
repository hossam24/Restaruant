import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeExtras, sanitizeSettings } from './shopData'

const base = { id: 'x-abc123', category: 'sandwich', name: 'ساندوتش جديد', price: 40 }

describe('sanitizeSettings', () => {
  it('uses the defaults for garbage', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings({ hours: 5, delivery: 7 })).toEqual(DEFAULT_SETTINGS)
  })
  it('accepts valid hours, including closing after midnight', () => {
    expect(sanitizeSettings({ hours: { open: '10:00', close: '02:00' } }).hours).toEqual({ open: '10:00', close: '02:00' })
  })
  it('rejects bad times and keeps the previous hours', () => {
    const fb = { ...DEFAULT_SETTINGS, hours: { open: '09:00', close: '23:00' } }
    for (const bad of [{ open: '25:00', close: '02:00' }, { open: '10:00', close: '10:00' }, { open: 10, close: 2 }, { open: '9:00', close: '2:00' }]) {
      expect(sanitizeSettings({ hours: bad }, fb).hours).toEqual(fb.hours)
    }
  })
  it('lets the owner switch hours off with null', () => {
    expect(sanitizeSettings({ hours: null }).hours).toBeNull()
  })
  it('validates the delivery fee', () => {
    expect(sanitizeSettings({ delivery: { fee: 20 } }).delivery.fee).toBe(20)
    expect(sanitizeSettings({ delivery: { fee: 0 } }).delivery.fee).toBe(0)
    expect(sanitizeSettings({ delivery: { fee: -5 } }).delivery.fee).toBeNull()
    expect(sanitizeSettings({ delivery: { fee: 1.5 } }).delivery.fee).toBeNull()
    expect(sanitizeSettings({ delivery: { fee: null } }).delivery.fee).toBeNull()
  })
  it('only keeps a free-delivery threshold when there is a fee', () => {
    expect(sanitizeSettings({ delivery: { fee: 20, freeOver: 300 } }).delivery).toMatchObject({ fee: 20, freeOver: 300 })
    expect(sanitizeSettings({ delivery: { fee: null, freeOver: 300 } }).delivery.freeOver).toBeNull()
  })
  it('trims and limits the delivery estimate', () => {
    expect(sanitizeSettings({ delivery: { estimate: '  خلال 45 دقيقة  ' } }).delivery.estimate).toBe('خلال 45 دقيقة')
    expect(sanitizeSettings({ delivery: { estimate: 'x'.repeat(200) } }).delivery.estimate).toHaveLength(60)
    expect(sanitizeSettings({ delivery: { estimate: '   ' } }).delivery.estimate).toBeNull()
  })
})

describe('sanitizeExtras', () => {
  it('keeps a valid item and fills the default image', () => {
    const [i] = sanitizeExtras([base])
    expect(i).toMatchObject({ id: 'x-abc123', name: 'ساندوتش جديد', price: 40, category: 'sandwich', image: '/imgs/default.webp' })
  })
  it('drops items with a bad id, name, price or category', () => {
    for (const bad of [
      { ...base, id: 'abc' },
      { ...base, id: 'sandwich-1' },
      { ...base, name: '  ' },
      { ...base, price: 0 },
      { ...base, price: '40' },
      { ...base, category: 'nope' },
    ]) {
      expect(sanitizeExtras([bad])).toEqual([])
    }
  })
  it('only accepts photos served by our own image endpoint', () => {
    const own = '/api/img/0123456789abcdef'
    expect(sanitizeExtras([{ ...base, image: own }])[0].image).toBe(own)
    for (const evil of ['https://evil.example/x.png', 'javascript:alert(1)', '/api/img/../../x', '//evil.example/a']) {
      expect(sanitizeExtras([{ ...base, image: evil }])[0].image).toBe('/imgs/default.webp')
    }
  })
  it('only keeps an offer price that is higher than the price', () => {
    expect(sanitizeExtras([{ ...base, oldPrice: 60 }])[0].oldPrice).toBe(60)
    expect(sanitizeExtras([{ ...base, oldPrice: 40 }])[0].oldPrice).toBeUndefined()
    expect(sanitizeExtras([{ ...base, oldPrice: 10 }])[0].oldPrice).toBeUndefined()
  })
  it('removes duplicates and caps the total', () => {
    expect(sanitizeExtras([base, base])).toHaveLength(1)
    const many = Array.from({ length: 150 }, (_, n) => ({ ...base, id: `x-item${n + 1000}` }))
    expect(sanitizeExtras(many)).toHaveLength(100)
  })
  it('ignores garbage input', () => {
    expect(sanitizeExtras(null)).toEqual([])
    expect(sanitizeExtras('x')).toEqual([])
    expect(sanitizeExtras([null, 5, 'a'])).toEqual([])
  })
})
