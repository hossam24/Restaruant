import { describe, expect, it } from 'vitest'
import { menuItems } from './menu'
import { applyOverrides, sanitizeOverrides } from './overrides'

const single = menuItems.find((i) => !i.sizes && i.oldPrice === undefined)!
const offer = menuItems.find((i) => i.oldPrice !== undefined)!
const sized = menuItems.find((i) => i.sizes)!

describe('sanitizeOverrides', () => {
  it('keeps valid changes', () => {
    const out = sanitizeOverrides({ [single.id]: { price: single.price! + 5, soldOut: true } }, menuItems)
    expect(out).toEqual({ [single.id]: { price: single.price! + 5, soldOut: true } })
  })
  it('drops unknown items and garbage', () => {
    expect(sanitizeOverrides({ nope: { price: 5 } }, menuItems)).toEqual({})
    expect(sanitizeOverrides(null, menuItems)).toEqual({})
    expect(sanitizeOverrides('x', menuItems)).toEqual({})
    expect(sanitizeOverrides({ [single.id]: 'x' }, menuItems)).toEqual({})
  })
  it('rejects bad prices', () => {
    for (const bad of [0, -5, 1.5, '50', 1e9, NaN, null]) {
      expect(sanitizeOverrides({ [single.id]: { price: bad } }, menuItems)).toEqual({})
    }
  })
  it('does not store values equal to the built-in menu', () => {
    expect(sanitizeOverrides({ [single.id]: { price: single.price } }, menuItems)).toEqual({})
  })
  it('only stores flags that are exactly true', () => {
    expect(sanitizeOverrides({ [single.id]: { hidden: 'yes', soldOut: 1 } }, menuItems)).toEqual({})
    expect(sanitizeOverrides({ [single.id]: { hidden: true } }, menuItems)).toEqual({ [single.id]: { hidden: true } })
  })
  it('accepts size prices by id and ignores unknown sizes', () => {
    const first = sized.sizes![0]
    const out = sanitizeOverrides({ [sized.id]: { sizes: { [first.id]: first.price + 10, ghost: 5 } } }, menuItems)
    expect(out).toEqual({ [sized.id]: { sizes: { [first.id]: first.price + 10 } } })
  })
  it('ignores a plain price sent for a sized item', () => {
    expect(sanitizeOverrides({ [sized.id]: { price: 5 } }, menuItems)).toEqual({})
  })
  it('creates an offer only when the old price is higher than the price', () => {
    const p = single.price!
    expect(sanitizeOverrides({ [single.id]: { oldPrice: p + 20 } }, menuItems)).toEqual({ [single.id]: { oldPrice: p + 20 } })
    expect(sanitizeOverrides({ [single.id]: { oldPrice: p } }, menuItems)).toEqual({})
    expect(sanitizeOverrides({ [single.id]: { oldPrice: p - 1 } }, menuItems)).toEqual({})
  })
  it('removes an existing offer with null', () => {
    expect(sanitizeOverrides({ [offer.id]: { oldPrice: null } }, menuItems)).toEqual({ [offer.id]: { oldPrice: null } })
  })
  it('drops an offer that a raised price would make nonsense', () => {
    const out = sanitizeOverrides({ [offer.id]: { price: offer.oldPrice! + 10 } }, menuItems)
    expect(out[offer.id]).toEqual({ price: offer.oldPrice! + 10, oldPrice: null })
  })
})

describe('applyOverrides', () => {
  it('changes the price and leaves everything else alone', () => {
    const items = applyOverrides(menuItems, { [single.id]: { price: 999 } })
    expect(items.find((i) => i.id === single.id)!.price).toBe(999)
    expect(items.length).toBe(menuItems.length)
    expect(items.find((i) => i.id === offer.id)).toBe(offer)
  })
  it('adds, changes and removes an offer', () => {
    const p = single.price!
    expect(applyOverrides(menuItems, { [single.id]: { oldPrice: p + 30 } }).find((i) => i.id === single.id)!.oldPrice).toBe(p + 30)
    expect(applyOverrides(menuItems, { [offer.id]: { oldPrice: null } }).find((i) => i.id === offer.id)!.oldPrice).toBeUndefined()
  })
  it('changes size prices', () => {
    const s = sized.sizes![1]
    const out = applyOverrides(menuItems, { [sized.id]: { sizes: { [s.id]: 1 } } }).find((i) => i.id === sized.id)!
    expect(out.sizes![1].price).toBe(1)
    expect(out.sizes![0].price).toBe(sized.sizes![0].price)
  })
  it('flags hidden and sold-out items without removing them', () => {
    const out = applyOverrides(menuItems, { [single.id]: { hidden: true, soldOut: true } }).find((i) => i.id === single.id)!
    expect(out.hidden).toBe(true)
    expect(out.soldOut).toBe(true)
  })
  it('does not modify the built-in menu', () => {
    const before = JSON.stringify(menuItems)
    applyOverrides(menuItems, { [single.id]: { price: 1 }, [offer.id]: { oldPrice: null } })
    expect(JSON.stringify(menuItems)).toBe(before)
  })
})
