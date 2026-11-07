import { useMemo, useState } from 'react'
import { CATEGORIES } from '../data/categories'
import { menuItems } from '../data/menu'
import { applyOverrides, type ItemOverride, type Overrides } from '../data/overrides'
import type { CategoryId, MenuItem } from '../data/types'
import { normalizeArabic } from '../lib/search'
import { ApiError, saveOverrides } from './api'

/** What is typed in the boxes for one item. Prices are text so the field can be empty while typing. */
interface Draft {
  price: string
  oldPrice: string
  sizes: Record<string, string>
  hidden: boolean
  soldOut: boolean
}

type Drafts = Record<string, Draft>

const toDraft = (item: MenuItem): Draft => ({
  price: item.price === undefined ? '' : String(item.price),
  oldPrice: item.oldPrice === undefined ? '' : String(item.oldPrice),
  sizes: Object.fromEntries((item.sizes ?? []).map((s) => [s.id, String(s.price)])),
  hidden: !!item.hidden,
  soldOut: !!item.soldOut,
})

const toDrafts = (overrides: Overrides): Drafts =>
  Object.fromEntries(applyOverrides(menuItems, overrides).map((i) => [i.id, toDraft(i)]))

const same = (a: Draft, b: Draft) =>
  a.price === b.price &&
  a.oldPrice === b.oldPrice &&
  a.hidden === b.hidden &&
  a.soldOut === b.soldOut &&
  Object.keys(a.sizes).every((k) => a.sizes[k] === b.sizes[k])

const whole = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0

/** A message when the row cannot be saved, otherwise null. */
function problem(item: MenuItem, d: Draft): string | null {
  if (item.sizes) return item.sizes.every((s) => whole(d.sizes[s.id] ?? '')) ? null : 'كل الأحجام لازم يكون ليها سعر رقم صحيح.'
  if (!whole(d.price)) return 'السعر لازم يكون رقم صحيح أكبر من صفر.'
  if (d.oldPrice.trim() !== '' && (!whole(d.oldPrice) || Number(d.oldPrice) <= Number(d.price))) {
    return 'السعر قبل الخصم لازم يكون أكبر من السعر الحالي، أو سيبه فاضي لو مفيش عرض.'
  }
  return null
}

function toOverrides(drafts: Drafts): Overrides {
  const out: Overrides = {}
  for (const item of menuItems) {
    const d = drafts[item.id]
    const o: ItemOverride = {}
    if (item.sizes) o.sizes = Object.fromEntries(item.sizes.map((s) => [s.id, Number(d.sizes[s.id])]))
    else {
      o.price = Number(d.price)
      o.oldPrice = d.oldPrice.trim() === '' ? null : Number(d.oldPrice)
    }
    if (d.hidden) o.hidden = true
    if (d.soldOut) o.soldOut = true
    out[item.id] = o
  }
  return out // the server drops everything that equals the built-in menu
}

const input =
  'w-24 rounded-lg border-2 border-line-strong px-2 py-1.5 text-center focus:border-brand-400 focus:outline-none'

export function MenuEditor({ saved, onSaved }: { saved: Overrides; onSaved: (o: Overrides) => void }) {
  const [initial, setInitial] = useState<Drafts>(() => toDrafts(saved))
  const [drafts, setDrafts] = useState<Drafts>(initial)
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const changed = useMemo(() => menuItems.filter((i) => !same(drafts[i.id], initial[i.id])), [drafts, initial])
  const broken = changed.filter((i) => problem(i, drafts[i.id]))

  const visible = menuItems.filter(
    (i) =>
      (category === 'all' || i.category === category) &&
      normalizeArabic(`${i.name} ${i.description ?? ''}`).includes(normalizeArabic(query)),
  )

  const patch = (id: string, p: Partial<Draft>) => {
    setMessage(null)
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...p } }))
  }

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const cleaned = await saveOverrides(toOverrides(drafts))
      const fresh = toDrafts(cleaned)
      setInitial(fresh)
      setDrafts(fresh)
      onSaved(cleaned)
      setMessage({ ok: true, text: 'اتحفظ. الزباين هيشوفوا التعديلات خلال دقيقة تقريباً.' })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'تعذر الحفظ.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-28">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="دوّر على صنف..."
          aria-label="بحث"
          className="flex-1 rounded-full border-2 border-line px-5 py-2.5 focus:border-brand-400 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
          aria-label="القسم"
          className="rounded-full border-2 border-line px-5 py-2.5 font-semibold focus:border-brand-400 focus:outline-none"
        >
          <option value="all">كل الأقسام</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="flex flex-col gap-3">
        {visible.map((item) => {
          const d = drafts[item.id]
          const err = problem(item, d)
          const edited = !same(d, initial[item.id])
          return (
            <li
              key={item.id}
              className={
                'rounded-2xl bg-surface p-4 ring-1 ' + (err ? 'ring-2 ring-bad' : edited ? 'ring-2 ring-brand-400' : 'ring-line')
              }
            >
              <div className="flex items-start gap-3">
                <img src={item.image} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg bg-brand-50 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-muted">{CATEGORIES.find((c) => c.id === item.category)?.label}</p>
                </div>
                {edited && (
                  <button type="button" onClick={() => patch(item.id, initial[item.id])} className="shrink-0 text-sm text-muted underline">
                    تراجع
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
                {item.sizes ? (
                  item.sizes.map((s) => (
                    <label key={s.id} className="flex flex-col gap-1 text-sm font-semibold">
                      {s.name}
                      <input
                        inputMode="numeric"
                        value={d.sizes[s.id]}
                        onChange={(e) => patch(item.id, { sizes: { ...d.sizes, [s.id]: e.target.value } })}
                        className={input}
                      />
                    </label>
                  ))
                ) : (
                  <>
                    <label className="flex flex-col gap-1 text-sm font-semibold">
                      السعر (جنيه)
                      <input inputMode="numeric" value={d.price} onChange={(e) => patch(item.id, { price: e.target.value })} className={input} />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-semibold">
                      قبل الخصم (للعروض)
                      <input
                        inputMode="numeric"
                        value={d.oldPrice}
                        placeholder="مفيش عرض"
                        onChange={(e) => patch(item.id, { oldPrice: e.target.value })}
                        className={input}
                      />
                    </label>
                  </>
                )}
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={d.soldOut} onChange={(e) => patch(item.id, { soldOut: e.target.checked })} className="size-5 accent-orange-600" />
                  خلص النهارده
                </label>
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={d.hidden} onChange={(e) => patch(item.id, { hidden: e.target.checked })} className="size-5 accent-orange-600" />
                  إخفاء من المنيو
                </label>
              </div>
              {err && <p role="alert" className="mt-2 text-sm font-semibold text-bad">{err}</p>}
            </li>
          )
        })}
        {visible.length === 0 && <li className="py-10 text-center text-muted">مفيش أصناف بالاسم ده.</li>}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className={'font-semibold ' + (message ? (message.ok ? 'text-good' : 'text-bad') : 'text-muted')}>
            {message?.text ??
              (changed.length === 0 ? 'مفيش تعديلات جديدة.' : `${changed.length} صنف اتعدل ولسه ما اتحفظش.`)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={changed.length === 0 || busy}
              onClick={() => {
                setDrafts(initial)
                setMessage(null)
              }}
              className="rounded-full border-2 border-line-strong px-5 py-2 font-bold disabled:opacity-40"
            >
              تراجع عن الكل
            </button>
            <button
              type="button"
              disabled={changed.length === 0 || broken.length > 0 || busy}
              onClick={save}
              className="rounded-full bg-brand-500 px-7 py-2 font-bold text-white disabled:opacity-40"
            >
              {busy ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
