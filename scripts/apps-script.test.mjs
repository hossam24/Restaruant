import { beforeEach, describe, expect, it } from 'vitest'
import { createRuntime } from './fake-sheets.mjs'

const MENU = 'المنيو'
const SETTINGS = 'الإعدادات'
const CATEGORIES = 'الأقسام'
const customer = { name: 'سارة أحمد', phone: '01012345678', additionalPhone: '', address: 'شارع التحرير، القاهرة', notes: '' }

let rt
beforeEach(() => {
  rt = createRuntime()
  rt.setup()
})

const rowOf = (id) => rt.menuSheet().getRange(1, 1, rt.menuSheet().getLastRow(), 1).getValues().findIndex((r) => r[0] === id) + 1
const COL = { id: 1, category: 2, name: 3, description: 4, price: 5, oldPrice: 6, size1: 7, size1Price: 8, chicken: 13, available: 14, visible: 15, image: 16 }

describe('setup', () => {
  it('creates the three tabs, fills the menu, the sections and the settings', () => {
    expect(rt.sheets.has(MENU)).toBe(true)
    expect(rt.sheets.has(SETTINGS)).toBe(true)
    expect(rt.sheets.has(CATEGORIES)).toBe(true)
    expect(rt.menuSheet().getLastRow()).toBe(18)
    expect(rt.sheets.get(CATEGORIES).getLastRow()).toBe(6)
    expect(rt.sheets.get(SETTINGS).getRange(2, 1).getValue()).toBe('يفتح الساعة')
  })
  it('adds dropdown lists for the category and the yes/no columns', () => {
    const lists = rt.menuSheet().validations
    expect(lists.some((v) => v.col === 2 && v.list.includes('العروض') && v.fromTab === CATEGORIES)).toBe(true)
    expect(lists.some((v) => v.col === 13 && v.cols === 3 && v.list.join() === 'نعم,لا')).toBe(true)
  })
  it('is safe to run again: it does not duplicate or overwrite the menu', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, 99)
    rt.setup()
    expect(rt.menuSheet().getLastRow()).toBe(18)
    expect(rt.menuSheet().getRange(rowOf('sandwich-1'), COL.price).getValue()).toBe(99)
  })
})

describe('the sections (الأقسام tab)', () => {
  const catRows = () => rt.menu().categories
  it('are sent to the website in the order of the tab, with their notes', () => {
    expect(catRows().map((c) => c.label)).toEqual(['العروض', 'الأطباق الرئيسية', 'السندوتشات', 'المقبلات والسلطات', 'المشروبات'])
    expect(catRows()[1]).toEqual({ id: 'الأطباق الرئيسية', label: 'الأطباق الرئيسية', note: 'كل الأطباق الرئيسية بتتقدم مع عيش وسلطات' })
  })
  it('accept a brand-new section: items can use it straight away', () => {
    rt.edit(CATEGORIES, 7, 1, 'الحلويات')
    const next = rt.menuSheet().getLastRow() + 1
    rt.paste(MENU, next, 2, [['الحلويات', 'كنافة', '', 60]])
    expect(catRows().at(-1).label).toBe('الحلويات')
    expect(rt.menu().items.find((i) => i.name === 'كنافة')).toMatchObject({ category: 'الحلويات', price: 60 })
  })
  it('can be reordered and renamed by editing the tab', () => {
    rt.edit(CATEGORIES, 2, 1, 'المشروبات')
    rt.edit(CATEGORIES, 6, 1, 'العروض')
    expect(catRows().map((c) => c.label)).toEqual(['المشروبات', 'الأطباق الرئيسية', 'السندوتشات', 'المقبلات والسلطات', 'العروض'])
  })
  it('ignore blank and repeated names', () => {
    rt.edit(CATEGORIES, 3, 1, 'العروض')
    rt.edit(CATEGORIES, 4, 1, '')
    expect(catRows().map((c) => c.label)).toEqual(['العروض', 'المقبلات والسلطات', 'المشروبات'])
  })
  it('tell the owner when an item uses a section that is not in the tab', () => {
    rt.edit(CATEGORIES, 2, 1, 'غير موجود')
    expect(rt.ctx.checkMenu()).toContain('القسم مش موجود في ورقة الأقسام')
    expect(rt.menu().items.some((i) => i.category === 'العروض')).toBe(false)
  })
  it('an empty tab gives an empty menu and a clear message instead of an error', () => {
    rt.sheets.get(CATEGORIES).cells.clear()
    expect(rt.menu().items).toEqual([])
    expect(rt.ctx.checkMenu()).toContain('ورقة الأقسام فاضية')
  })
})

describe('the menu the website receives', () => {
  it('has every item with the right shape', () => {
    const { ok, items } = rt.menu()
    expect(ok).toBe(true)
    expect(items).toHaveLength(17)
    expect(new Set(items.map((i) => i.id)).size).toBe(17)
    expect(items.filter((i) => i.sizes)).toHaveLength(2)
    expect(items.filter((i) => i.chickenChoice)).toHaveLength(2)
    const kofta = items.find((i) => i.id === 'main-2')
    expect(kofta.sizes).toEqual([
      { id: 's1', name: 'ربع كيلو', price: 115 },
      { id: 's2', name: 'نص كيلو', price: 225 },
      { id: 's3', name: 'كيلو', price: 450 },
    ])
    expect(kofta.price).toBeUndefined()
  })
  it('keeps offers as price + oldPrice', () => {
    const offer = rt.menu().items.find((i) => i.id === 'offers-1')
    expect(offer).toMatchObject({ price: 99, oldPrice: 130, category: 'العروض', chickenChoice: true })
  })
  it('reads the opening hours and delivery settings (text cells, not times)', () => {
    expect(rt.menu().settings).toEqual({ hours: { open: '10:00', close: '02:00' }, delivery: { fee: null, freeOver: null, estimate: null } })
  })
  it('also understands hours that Google turned into real times', () => {
    rt.sheets.get(SETTINGS).formats.clear()
    rt.edit(SETTINGS, 2, 2, '9:30')
    expect(rt.menu().settings.hours).toEqual({ open: '09:30', close: '02:00' })
  })
  it('turns hours off when one of them is empty', () => {
    rt.edit(SETTINGS, 3, 2, '')
    expect(rt.menu().settings.hours).toBeNull()
  })
  it('reads delivery fee, free-delivery threshold and estimate', () => {
    rt.edit(SETTINGS, 4, 2, 20)
    rt.edit(SETTINGS, 5, 2, 300)
    rt.edit(SETTINGS, 6, 2, 'خلال 45 دقيقة')
    expect(rt.menu().settings.delivery).toEqual({ fee: 20, freeOver: 300, estimate: 'خلال 45 دقيقة' })
  })
  it('ignores a free-delivery threshold when there is no fee', () => {
    rt.edit(SETTINGS, 5, 2, 300)
    expect(rt.menu().settings.delivery.freeOver).toBeNull()
  })
  it('accepts a delivery fee of zero', () => {
    rt.edit(SETTINGS, 4, 2, 0)
    expect(rt.menu().settings.delivery.fee).toBe(0)
  })
})

describe('what the owner can do in the sheet', () => {
  it('changes a price and the site sees it', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, 77)
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').price).toBe(77)
  })
  it('accepts a price typed with Arabic digits', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, '٨٨')
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').price).toBe(88)
  })
  it('adds and removes an offer with the "before" price', () => {
    const r = rowOf('sandwich-1')
    rt.edit(MENU, r, COL.oldPrice, 50)
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').oldPrice).toBe(50)
    rt.edit(MENU, r, COL.oldPrice, '')
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').oldPrice).toBeUndefined()
  })
  it('ignores a "before" price that is not higher than the price', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.oldPrice, 10)
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').oldPrice).toBeUndefined()
  })
  it('marks an item sold out, and back', () => {
    const r = rowOf('sandwich-1')
    rt.edit(MENU, r, COL.available, 'لا')
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').soldOut).toBe(true)
    rt.edit(MENU, r, COL.available, 'نعم')
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').soldOut).toBeUndefined()
  })
  it('hides an item', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.visible, 'لا')
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').hidden).toBe(true)
  })
  it('adds a new item on a new row and it gets a code by itself', () => {
    const next = rt.menuSheet().getLastRow() + 1
    rt.paste(MENU, next, 2, [['العروض', 'وجبة جديدة', 'وصف', 120, 150]])
    const added = rt.menu().items.find((i) => i.name === 'وجبة جديدة')
    expect(added).toMatchObject({ category: 'العروض', price: 120, oldPrice: 150, description: 'وصف' })
    expect(added.id).toMatch(/^x-[a-f0-9]{8}$/)
    expect(rt.menuSheet().getRange(next, 1).getValue()).toBe(added.id)
  })
  it('gives separate codes to several rows pasted at once', () => {
    const next = rt.menuSheet().getLastRow() + 1
    rt.paste(MENU, next, 2, [['العروض', 'أ', '', 10], ['العروض', 'ب', '', 20], ['العروض', 'ج', '', 30]])
    const ids = rt.menu().items.filter((i) => ['أ', 'ب', 'ج'].includes(i.name)).map((i) => i.id)
    expect(new Set(ids).size).toBe(3)
  })
  it('turns a plain item into a sized one by filling the size columns', () => {
    const r = rowOf('sandwich-1')
    rt.edit(MENU, r, COL.size1, 'كبير')
    rt.edit(MENU, r, COL.size1Price, 60)
    const item = rt.menu().items.find((i) => i.id === 'sandwich-1')
    expect(item.sizes).toEqual([{ id: 's1', name: 'كبير', price: 60 }])
    expect(item.price).toBeUndefined()
  })
  it('accepts a photo name or a full https link and drops anything else', () => {
    const r = rowOf('sandwich-1')
    const photo = () => rt.menu().items.find((i) => i.id === 'sandwich-1').image
    rt.edit(MENU, r, COL.image, 'https://example.com/a.jpg')
    expect(photo()).toBe('https://example.com/a.jpg')
    rt.edit(MENU, r, COL.image, '/imgs/offers/x.webp')
    expect(photo()).toBe('offers/x.webp')
    for (const bad of ['javascript:alert(1)', '../../secret', 'http://insecure.example/a.jpg', 'C:\\a.jpg']) {
      rt.edit(MENU, r, COL.image, bad)
      expect(photo()).toBeUndefined()
    }
  })
  it('shows the new price within a minute even without an edit trigger', () => {
    rt.menu()
    rt.menuSheet().getRange(rowOf('sandwich-1'), COL.price).setValue(55)
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').price).not.toBe(55)
    rt.clock.offset += 61_000
    expect(rt.menu().items.find((i) => i.id === 'sandwich-1').price).toBe(55)
  })
})

describe('mistakes in the sheet never break the menu', () => {
  const problemsFor = () => {
    const msg = rt.ctx.checkMenu()
    return msg
  }
  it('skips a row with a bad price and explains it', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, 'abc')
    expect(rt.menu().items).toHaveLength(16)
    expect(problemsFor()).toContain('سطر ' + rowOf('sandwich-1'))
  })
  it('skips a row with a category that is not in the list', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.category, 'قسم غلط')
    expect(rt.menu().items).toHaveLength(16)
  })
  it('skips an incomplete size and a duplicate code', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.size1, 'كبير')
    rt.edit(MENU, rowOf('sandwich-2'), COL.id, 'sandwich-3')
    expect(rt.menu().items).toHaveLength(15)
  })
  it('reports a healthy menu as healthy', () => {
    expect(problemsFor()).toContain('17')
  })
  it('ignores empty rows and rows with a price of zero or a decimal', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, 0)
    rt.edit(MENU, rowOf('sandwich-2'), COL.price, 12.5)
    expect(rt.menu().items).toHaveLength(15)
  })
  it('does not crash when the menu tab is empty', () => {
    rt.menuSheet().cells.clear()
    const res = rt.menu()
    expect(res.ok).toBe(true)
    expect(res.items).toEqual([])
  })
})

describe('orders', () => {
  const sandwich = (over = {}) => ({ itemId: 'sandwich-1', quantity: 2, ...over })
  const last = () => rt.ordersToday().at(-1)

  it('records a valid order with prices computed from the sheet', () => {
    const res = rt.order({
      customer,
      lines: [
        sandwich({ note: 'بدون بصل', price: 1, total: 1 }),
        { itemId: 'main-2', sizeId: 's2', quantity: 1 },
        { itemId: 'offers-2', part: 'صدر', quantity: 1 },
      ],
      total: 5,
    })
    expect(res.status).toBe('success')
    const row = last()
    expect(row[1]).toBe('سارة أحمد')
    expect(row[2]).toBe('01012345678')
    expect(row[5]).toBe('كفتة مشوي (2x) - 70 جنيه [بدون بصل] | كفتة مشوية - نص كيلو (1x) - 225 جنيه | وجبة الصحاب (صدر) (1x) - 140 جنيه')
    expect(row[6]).toBe('435 جنيه')
    expect(row[8]).toBe('توصيل')
  })
  it('creates the day tab with a header the first time', () => {
    rt.order({ customer, lines: [sandwich()] })
    expect(rt.ordersToday()[0][0]).toBe('Date & Time')
    expect(rt.ordersToday()).toHaveLength(2)
  })
  it('uses the price the owner just changed', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.price, 100)
    rt.order({ customer, lines: [sandwich({ quantity: 1 })] })
    expect(last()[6]).toBe('100 جنيه')
  })
  it('adds the delivery fee, and waives it over the free-delivery amount', () => {
    rt.edit(SETTINGS, 4, 2, 20)
    rt.edit(SETTINGS, 5, 2, 100)
    rt.order({ customer, lines: [sandwich({ quantity: 1 })] })
    expect(last()[6]).toBe('55 جنيه')
    rt.order({ customer: { ...customer, phone: '01112345678' }, lines: [sandwich({ quantity: 3 })] })
    expect(last()[6]).toBe('105 جنيه')
  })
  it('stores Arabic-digit phone numbers as normal digits', () => {
    rt.order({ customer: { ...customer, phone: '٠١٠١٢٣٤٥٦٧٨' }, lines: [sandwich()] })
    expect(last()[2]).toBe('01012345678')
  })
  it('ignores a leg/breast choice on items that do not offer it', () => {
    rt.order({ customer, lines: [sandwich({ quantity: 1, part: 'صدر' })] })
    expect(last()[6]).toBe('35 جنيه')
  })
  it('falls back to the first size when the size is unknown', () => {
    rt.order({ customer, lines: [{ itemId: 'main-2', sizeId: 'nope', quantity: 1 }] })
    expect(last()[6]).toBe('115 جنيه')
  })
  it('flags an order for an item that sold out meanwhile, but still records it', () => {
    rt.edit(MENU, rowOf('sandwich-1'), COL.available, 'لا')
    rt.order({ customer, lines: [sandwich({ quantity: 1 })] })
    expect(last()[5]).toContain('(كان خلصان)')
  })

  describe('is refused when it is not valid', () => {
    const refused = (body) => {
      const before = rt.ordersToday().length
      const res = rt.order(body)
      expect(res.status).toBe('error')
      expect(rt.ordersToday().length).toBe(before)
    }
    it('bad phone', () => refused({ customer: { ...customer, phone: '123' }, lines: [sandwich()] }))
    it('bad extra phone', () => refused({ customer: { ...customer, additionalPhone: '12' }, lines: [sandwich()] }))
    it('missing name', () => refused({ customer: { ...customer, name: '  ' }, lines: [sandwich()] }))
    it('missing address', () => refused({ customer: { ...customer, address: '' }, lines: [sandwich()] }))
    it('unknown item', () => refused({ customer, lines: [sandwich({ itemId: 'fake-9' })] }))
    it('hidden item', () => {
      rt.edit(MENU, rowOf('sandwich-1'), COL.visible, 'لا')
      refused({ customer, lines: [sandwich()] })
    })
    it('empty order', () => refused({ customer, lines: [] }))
    it('41 lines', () => refused({ customer, lines: Array.from({ length: 41 }, () => sandwich()) }))
    for (const q of [0, -1, 1.5, 100, '3', null]) it(`quantity ${JSON.stringify(q)}`, () => refused({ customer, lines: [sandwich({ quantity: q })] }))
    it('not JSON', () => refused('hello'))
    it('too big', () => refused(JSON.stringify({ customer, lines: [sandwich()], junk: 'x'.repeat(40000) })))
  })

  it('stops one phone number from sending more than 3 orders in 10 minutes', () => {
    const codes = []
    for (let i = 0; i < 5; i++) codes.push(rt.order({ customer, lines: [sandwich()] }).status)
    expect(codes).toEqual(['success', 'success', 'success', 'error', 'error'])
    rt.clock.offset += 601_000
    expect(rt.order({ customer, lines: [sandwich()] }).status).toBe('success')
    expect(rt.order({ customer: { ...customer, phone: '01512345678' }, lines: [sandwich()] }).status).toBe('success')
  })
  it('stops a flood from many phones (120 orders per 10 minutes overall)', () => {
    let accepted = 0
    for (let i = 0; i < 130; i++) {
      const phone = '010' + String(10000000 + i)
      if (rt.order({ customer: { ...customer, phone }, lines: [sandwich()] }).status === 'success') accepted++
    }
    expect(accepted).toBe(120)
  })
})
