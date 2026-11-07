import { useCallback, useEffect, useState } from 'react'
import { normalizeDigits } from '../lib/validation'
import { ApiError, fetchOrders, type AdminOrder } from './api'

const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())

const amount = (t: string) => Number(normalizeDigits(t).replace(/[^\d.]/g, '')) || 0

export function OrdersPanel({ onExpired, sheetUrl }: { onExpired: () => void; sheetUrl: string | null }) {
  const [date, setDate] = useState(cairoToday)
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    setOrders(null)
    try {
      setOrders((await fetchOrders(date)).orders)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onExpired()
      setError(e instanceof ApiError ? e.message : 'تعذر تحميل الطلبات.')
    }
  }, [date, onExpired])

  useEffect(() => {
    void load()
  }, [load])

  const total = (orders ?? []).reduce((sum, o) => sum + amount(o.total), 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-semibold">
          اليوم
          <input
            type="date"
            value={date}
            max={cairoToday()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-lg border-2 border-line-strong px-3 py-1.5"
          />
        </label>
        <button type="button" onClick={load} className="rounded-full border-2 border-brand-500 px-5 py-1.5 font-bold text-accent">
          تحديث
        </button>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noreferrer" className="rounded-full bg-good/15 px-5 py-1.5 font-bold text-good underline">
            فتح شيت الطلبات
          </a>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-warn-bg p-4 font-semibold text-warn ring-1 ring-warn-line">{error}</p>}
      {!error && orders === null && <p className="py-10 text-center text-muted">جاري التحميل...</p>}

      {orders && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface p-4 text-center ring-1 ring-line">
              <p className="text-sm text-muted">عدد الطلبات</p>
              <p className="text-3xl font-extrabold">{orders.length}</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 text-center ring-1 ring-line">
              <p className="text-sm text-muted">إجمالي المبيعات (من غير التوصيل)</p>
              <p className="text-3xl font-extrabold text-accent">{total} جنيه</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="py-10 text-center text-muted">مفيش طلبات في اليوم ده.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...orders].reverse().map((o, i) => (
                <li key={i} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-lg font-bold">{o.name}</p>
                    <p className="text-sm text-muted" dir="ltr">
                      {o.time.slice(11, 16) || o.time}
                    </p>
                  </div>
                  <p className="mt-1 text-sm">
                    <a href={`tel:${o.phone}`} dir="ltr" className="font-bold text-accent">
                      {o.phone}
                    </a>
                    {o.additionalPhone && (
                      <>
                        {' · '}
                        <a href={`tel:${o.additionalPhone}`} dir="ltr" className="font-bold text-accent">
                          {o.additionalPhone}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-muted">📍 {o.address}</p>
                  <p className="mt-2 leading-relaxed">{o.items.split(' | ').map((line, n) => <span key={n} className="block">• {line}</span>)}</p>
                  {o.notes && <p className="mt-1 text-sm text-accent">📝 {o.notes}</p>}
                  <p className="mt-2 text-end text-lg font-extrabold text-accent">{o.total}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
