import { describe, expect, it } from 'vitest'
import { DEFAULT_IMAGE, parseSheetMenu, resolveImage } from './sheetMenu'

const ok = { id: 'x-abc12345', category: 'sandwich', name: 'ساندوتش', price: 40 }
const parse = (items: unknown[], settings?: unknown) => parseSheetMenu({ ok: true, items, settings })

describe('resolveImage', () => {
  it('turns a site photo name into its address', () => {
    expect(resolveImage('offers/alf-hana.webp')).toBe('/imgs/offers/alf-hana.webp')
    expect(resolveImage('/imgs/offers/alf-hana.webp')).toBe('/imgs/offers/alf-hana.webp')
  })
  it('encodes Arabic file names', () => {
    expect(resolveImage('offers/تربية.webp')).toBe('/imgs/offers/%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9.webp')
  })
  it('accepts https links only', () => {
    expect(resolveImage('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
    for (const bad of ['http://example.com/a.jpg', 'javascript:alert(1)', 'data:text/html,x', '//evil.example/a.png', '../../etc/passwd', 'C:\\a.jpg', 'ftp://x/a.jpg']) {
      expect(resolveImage(bad)).toBe(DEFAULT_IMAGE)
    }
  })
  it('uses the default picture when empty', () => {
    expect(resolveImage('')).toBe(DEFAULT_IMAGE)
    expect(resolveImage(undefined)).toBe(DEFAULT_IMAGE)
    expect(resolveImage(42)).toBe(DEFAULT_IMAGE)
  })
})

describe('parseSheetMenu', () => {
  it('keeps a valid item', () => {
    expect(parse([ok])?.items[0]).toMatchObject({ id: 'x-abc12345', category: 'sandwich', name: 'ساندوتش', price: 40, image: DEFAULT_IMAGE })
  })
  it('reads sizes, offers, and the flags', () => {
    const items = parse([
      { ...ok, id: 'a1', price: undefined, sizes: [{ id: 's1', name: 'كيلو', price: 450 }, { id: 's2', name: 'نص', price: 225 }] },
      { ...ok, id: 'a2', price: 99, oldPrice: 130, chickenChoice: true, soldOut: true, hidden: true },
    ])!.items
    expect(items[0].sizes).toHaveLength(2)
    expect(items[0].price).toBeUndefined()
    expect(items[1]).toMatchObject({ oldPrice: 130, chickenChoice: true, soldOut: true, hidden: true })
  })
  it('drops bad rows but keeps the good ones', () => {
    const items = parseSheetMenu({
      ok: true,
      categories: [{ id: 'sandwich', label: 'سندوتشات' }],
      items: [
      ok,
      { ...ok, id: 'bad id!' },
      { ...ok, id: 'b2', name: ' ' },
      { ...ok, id: 'b3', price: 0 },
      { ...ok, id: 'b4', price: '40' },
      { ...ok, id: 'b5', category: 'nope' },
      { ...ok, id: 'b6', price: undefined, sizes: [{ id: 's9', name: 'x', price: 5 }] },
      { ...ok, id: 'b7', price: undefined, sizes: [{ id: 's1', name: 'x', price: -5 }] },
      null,
      'text',
      ],
    })!.items
    expect(items.map((i) => i.id)).toEqual(['x-abc12345'])
  })
  it('uses the sections the sheet lists, in its order, with their notes', () => {
    const m = parseSheetMenu({
      ok: true,
      categories: [
        { id: 'حلويات', label: 'حلويات', note: 'طازجة كل يوم' },
        { id: 'sandwich', label: 'سندوتشات' },
        { id: 'sandwich', label: 'مكرر' },
        { id: '', label: 'فاضي' },
        'x',
      ],
      items: [ok, { ...ok, id: 'a-2', category: 'حلويات' }],
    })!
    expect(m.categories).toEqual([
      { id: 'حلويات', label: 'حلويات', note: 'طازجة كل يوم' },
      { id: 'sandwich', label: 'سندوتشات' },
    ])
    expect(m.items).toHaveLength(2)
  })
  it('without a sections list (older script) the sections are the ones the items use', () => {
    const m = parse([ok, { ...ok, id: 'a-2', category: 'drinks' }, { ...ok, id: 'a-3' }])!
    expect(m.categories.map((c) => c.id)).toEqual(['sandwich', 'drinks'])
  })
  it('removes duplicates', () => {
    expect(parse([ok, ok])!.items).toHaveLength(1)
  })
  it('ignores a "before" price that is not higher', () => {
    expect(parse([{ ...ok, oldPrice: 40 }])!.items[0].oldPrice).toBeUndefined()
    expect(parse([{ ...ok, oldPrice: 60 }])!.items[0].oldPrice).toBe(60)
  })
  it('returns null (keep the current menu) when nothing is usable', () => {
    expect(parseSheetMenu(null)).toBeNull()
    expect(parseSheetMenu('x')).toBeNull()
    expect(parseSheetMenu({ ok: false, error: 'boom' })).toBeNull()
    expect(parseSheetMenu({ ok: true, items: [] })).toBeNull()
    expect(parseSheetMenu({ ok: true, items: [{ bad: true }] })).toBeNull()
    expect(parseSheetMenu({ ok: true })).toBeNull()
  })
  it('cleans the settings too', () => {
    const m = parse([ok], { hours: { open: '10:00', close: '02:00' }, delivery: { fee: 20, freeOver: 300, estimate: 'خلال 45 دقيقة' } })!
    expect(m.settings.hours).toEqual({ open: '10:00', close: '02:00' })
    expect(m.settings.delivery).toEqual({ fee: 20, freeOver: 300, estimate: 'خلال 45 دقيقة' })
    expect(parse([ok], { hours: null, delivery: { fee: null } })!.settings.hours).toBeNull()
    expect(parse([ok], { delivery: { fee: -3 } })!.settings.delivery.fee).toBeNull()
  })
})
