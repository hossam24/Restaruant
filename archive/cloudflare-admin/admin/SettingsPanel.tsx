import { useState } from 'react'
import type { Settings } from '../data/shopData'
import { ApiError, saveSettings } from './api'

const field =
  'rounded-lg border-2 border-line-strong px-3 py-2 focus:border-brand-400 focus:outline-none disabled:opacity-40'

const whole = (s: string) => /^\d+$/.test(s.trim())

export function SettingsPanel({ saved, onSaved }: { saved: Settings; onSaved: (s: Settings) => void }) {
  const [hoursOn, setHoursOn] = useState(saved.hours !== null)
  const [open, setOpen] = useState(saved.hours?.open ?? '10:00')
  const [close, setClose] = useState(saved.hours?.close ?? '02:00')
  const [feeOn, setFeeOn] = useState(saved.delivery.fee !== null)
  const [fee, setFee] = useState(String(saved.delivery.fee ?? 0))
  const [freeOn, setFreeOn] = useState(saved.delivery.freeOver !== null)
  const [freeOver, setFreeOver] = useState(String(saved.delivery.freeOver ?? 300))
  const [estimate, setEstimate] = useState(saved.delivery.estimate ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const problem =
    hoursOn && open === close
      ? 'وقت الفتح ووقت القفل لازم يكونوا مختلفين.'
      : feeOn && !whole(fee)
        ? 'رسوم التوصيل لازم تكون رقم (ممكن صفر).'
        : feeOn && freeOn && (!whole(freeOver) || Number(freeOver) < 1)
          ? 'حد التوصيل المجاني لازم يكون رقم أكبر من صفر.'
          : null

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const next: Settings = {
        hours: hoursOn ? { open, close } : null,
        delivery: {
          fee: feeOn ? Number(fee) : null,
          freeOver: feeOn && freeOn ? Number(freeOver) : null,
          estimate: estimate.trim() || null,
        },
      }
      const clean = await saveSettings(next)
      onSaved(clean)
      setMessage({ ok: true, text: 'اتحفظ. الزباين هيشوفوه خلال دقيقة تقريباً.' })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'تعذر الحفظ.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
        <h2 className="text-lg font-extrabold">مواعيد الشغل</h2>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={hoursOn} onChange={(e) => setHoursOn(e.target.checked)} className="size-5 accent-orange-600" />
          اعرض "مفتوحين / مقفولين" على الموقع
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold">
            بنفتح الساعة
            <input type="time" value={open} disabled={!hoursOn} onChange={(e) => setOpen(e.target.value)} className={field} dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            بنقفل الساعة
            <input type="time" value={close} disabled={!hoursOn} onChange={(e) => setClose(e.target.value)} className={field} dir="ltr" />
          </label>
        </div>
        <p className="text-sm text-muted">لو القفل بعد نص الليل (مثلاً 2 الفجر) اكتبه عادي، الموقع بيفهمه. التوقيت بتوقيت القاهرة.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
        <h2 className="text-lg font-extrabold">التوصيل</h2>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={feeOn} onChange={(e) => setFeeOn(e.target.checked)} className="size-5 accent-orange-600" />
          أضيف رسوم توصيل على الإجمالي
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          رسوم التوصيل (جنيه)
          <input inputMode="numeric" value={fee} disabled={!feeOn} onChange={(e) => setFee(e.target.value)} className={field + ' w-32'} />
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={freeOn} disabled={!feeOn} onChange={(e) => setFreeOn(e.target.checked)} className="size-5 accent-orange-600" />
          التوصيل مجاني لو الطلب وصل
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          حد التوصيل المجاني (جنيه)
          <input inputMode="numeric" value={freeOver} disabled={!feeOn || !freeOn} onChange={(e) => setFreeOver(e.target.value)} className={field + ' w-32'} />
        </label>
        <p className="text-sm text-muted">لو سبت رسوم التوصيل مقفولة، الإجمالي بيفضل مكتوب عليه "غير شامل التوصيل".</p>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          الوقت المتوقع للتوصيل (اختياري)
          <input value={estimate} maxLength={60} onChange={(e) => setEstimate(e.target.value)} placeholder="مثال: خلال 45 دقيقة تقريباً" className={field} />
        </label>
      </section>

      {problem && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {problem}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button type="button" disabled={busy || problem !== null} onClick={save} className="rounded-full bg-brand-500 px-7 py-2.5 font-bold text-white disabled:opacity-40">
          {busy ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
        {message && (
          <p aria-live="polite" className={'font-semibold ' + (message.ok ? 'text-good' : 'text-bad')}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
