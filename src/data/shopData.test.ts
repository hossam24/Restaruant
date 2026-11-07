import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, sanitizeSettings } from './shopData'

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
  it('lets the sheet switch hours off with null', () => {
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
