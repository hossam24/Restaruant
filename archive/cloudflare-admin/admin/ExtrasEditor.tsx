import { useMemo, useState } from 'react'
import { CATEGORIES } from '../data/categories'
import { DEFAULT_IMAGE, MAX_EXTRAS } from '../data/shopData'
import type { CategoryId, MenuItem } from '../data/types'
import { ApiError, saveExtras, uploadImage } from './api'

interface Draft {
  id: string
  category: CategoryId
  name: string
  description: string
  price: string
  oldPrice: string
  image: string
  hidden: boolean
  soldOut: boolean
}

const toDraft = (i: MenuItem): Draft => ({
  id: i.id,
  category: i.category,
  name: i.name,
  description: i.description ?? '',
  price: String(i.price ?? ''),
  oldPrice: i.oldPrice === undefined ? '' : String(i.oldPrice),
  image: i.image,
  hidden: !!i.hidden,
  soldOut: !!i.soldOut,
})

function toItem(d: Draft): MenuItem {
  const item: MenuItem = { id: d.id, category: d.category, name: d.name.trim(), image: d.image, price: Number(d.price) }
  if (d.description.trim()) item.description = d.description.trim()
  if (d.oldPrice.trim()) item.oldPrice = Number(d.oldPrice)
  if (d.hidden) item.hidden = true
  if (d.soldOut) item.soldOut = true
  return item
}

const whole = (s: string) => /^\d+$/.test(s.trim()) && Number(s) > 0

function problem(d: Draft): string | null {
  if (!d.name.trim()) return 'اكتب اسم الصنف.'
  if (!whole(d.price)) return 'السعر لازم يكون رقم صحيح أكبر من صفر.'
  if (d.oldPrice.trim() && (!whole(d.oldPrice) || Number(d.oldPrice) <= Number(d.price))) {
    return 'السعر قبل الخصم لازم يكون أكبر من السعر الحالي، أو سيبه فاضي.'
  }
  return null
}

const newId = () => 'x-' + Math.random().toString(36).slice(2, 10).padEnd(8, '0')

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 900 / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82))
  if (!blob) throw new Error('shrink failed')
  return blob
}

const field = 'rounded-lg border-2 border-line-strong px-3 py-2 focus:border-brand-400 focus:outline-none'

export function ExtrasEditor({ saved, onSaved }: { saved: MenuItem[]; onSaved: (items: MenuItem[]) => void }) {
  const [initial, setInitial] = useState(() => JSON.stringify(saved.map(toDraft)))
  const [drafts, setDrafts] = useState<Draft[]>(() => saved.map(toDraft))
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const dirty = useMemo(() => JSON.stringify(drafts) !== initial, [drafts, initial])
  const broken = drafts.some((d) => problem(d))

  const patch = (id: string, p: Partial<Draft>) => {
    setMessage(null)
    setDrafts((all) => all.map((d) => (d.id === id ? { ...d, ...p } : d)))
  }

  async function pick(id: string, file: File | undefined) {
    if (!file) return
    setUploading(id)
    setMessage(null)
    try {
      patch(id, { image: await uploadImage(await shrink(file)) })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'تعذر تجهيز الصورة. جرّب صورة تانية.' })
    } finally {
      setUploading(null)
    }
  }

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const cleaned = await saveExtras(drafts.map(toItem))
      const fresh = cleaned.map(toDraft)
      setInitial(JSON.stringify(fresh))
      setDrafts(fresh)
      onSaved(cleaned)
      setMessage({ ok: true, text: 'اتحفظ. الزباين هيشوفوا الأصناف الجديدة خلال دقيقة تقريباً.' })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'تعذر الحفظ.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pb-28">
      <p className="mb-4 text-muted">أصناف بتضيفها انت، وبتظهر في المنيو جنب الأصناف الأصلية. الصنف بيتباع بسعر واحد.</p>

      <ul className="flex flex-col gap-3">
        {drafts.map((d) => {
          const err = problem(d)
          return (
            <li key={d.id} className={'rounded-2xl bg-surface p-4 ring-1 ' + (err ? 'ring-2 ring-bad' : 'ring-line')}>
              <div className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <img src={d.image || DEFAULT_IMAGE} alt="" className="size-24 rounded-xl bg-brand-50 object-contain" />
                  <label className="cursor-pointer rounded-full border-2 border-brand-400 px-3 py-1 text-sm font-bold text-accent">
                    {uploading === d.id ? 'جاري الرفع...' : 'اختار صورة'}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading !== null} onChange={(e) => void pick(d.id, e.target.files?.[0])} />
                  </label>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input value={d.name} maxLength={80} placeholder="اسم الصنف" aria-label="اسم الصنف" onChange={(e) => patch(d.id, { name: e.target.value })} className={field} />
                  <input value={d.description} maxLength={200} placeholder="وصف قصير (اختياري)" aria-label="الوصف" onChange={(e) => patch(d.id, { description: e.target.value })} className={field} />
                  <select value={d.category} aria-label="القسم" onChange={(e) => patch(d.id, { category: e.target.value as CategoryId })} className={field}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  السعر (جنيه)
                  <input inputMode="numeric" value={d.price} onChange={(e) => patch(d.id, { price: e.target.value })} className={field + ' w-24 text-center'} />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  قبل الخصم (للعروض)
                  <input inputMode="numeric" value={d.oldPrice} placeholder="مفيش عرض" onChange={(e) => patch(d.id, { oldPrice: e.target.value })} className={field + ' w-24 text-center'} />
                </label>
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={d.soldOut} onChange={(e) => patch(d.id, { soldOut: e.target.checked })} className="size-5 accent-orange-600" />
                  خلص النهارده
                </label>
                <label className="flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={d.hidden} onChange={(e) => patch(d.id, { hidden: e.target.checked })} className="size-5 accent-orange-600" />
                  إخفاء من المنيو
                </label>
              </div>
              {err && (
                <p role="alert" className="mt-2 text-sm font-semibold text-bad">
                  {err}
                </p>
              )}

              <div className="mt-3 text-end">
                {deleting === d.id ? (
                  <span className="inline-flex items-center gap-3 text-sm font-semibold">
                    متأكد إنك عايز تحذف "{d.name || 'الصنف'}"؟
                    <button
                      type="button"
                      onClick={() => {
                        setDrafts((all) => all.filter((x) => x.id !== d.id))
                        setDeleting(null)
                      }}
                      className="rounded-full bg-red-600 px-4 py-1 text-white"
                    >
                      أيوه احذف
                    </button>
                    <button type="button" onClick={() => setDeleting(null)} className="underline">
                      لا
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setDeleting(d.id)} className="text-sm text-muted underline hover:text-bad">
                    حذف الصنف
                  </button>
                )}
              </div>
            </li>
          )
        })}
        {drafts.length === 0 && <li className="rounded-2xl bg-surface py-10 text-center text-muted ring-1 ring-line">لسه ما أضفتش أي صنف جديد.</li>}
      </ul>

      <button
        type="button"
        disabled={drafts.length >= MAX_EXTRAS}
        onClick={() => setDrafts((all) => [...all, { id: newId(), category: 'offers', name: '', description: '', price: '', oldPrice: '', image: DEFAULT_IMAGE, hidden: false, soldOut: false }])}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-brand-400 py-4 text-lg font-bold text-accent hover:bg-brand-50"
      >
        + إضافة صنف جديد
      </button>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className={'font-semibold ' + (message ? (message.ok ? 'text-good' : 'text-bad') : 'text-muted')}>
            {message?.text ?? (dirty ? 'فيه تعديلات لسه ما اتحفظتش.' : 'مفيش تعديلات جديدة.')}
          </p>
          <button
            type="button"
            disabled={!dirty || broken || busy || uploading !== null}
            onClick={save}
            className="rounded-full bg-brand-500 px-7 py-2 font-bold text-white disabled:opacity-40"
          >
            {busy ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  )
}
