import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { ShopData } from '../data/shopData'
import { ApiError, clearToken, fetchShop, getToken, login } from './api'
import { ExtrasEditor } from './ExtrasEditor'
import { MenuEditor } from './MenuEditor'
import { OrdersPanel } from './OrdersPanel'
import { SettingsPanel } from './SettingsPanel'

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(password)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تسجيل الدخول.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-24 flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-surface p-7 shadow-xl ring-1 ring-line">
      <h1 className="text-center text-2xl font-extrabold">لوحة التحكم</h1>
      <label className="flex flex-col gap-1.5 font-bold">
        كلمة السر
        <input
          type="password"
          value={password}
          autoFocus
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border-2 border-line-strong px-3 py-2.5 font-normal focus:border-brand-400 focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold leading-relaxed text-bad">
          {error}
        </p>
      )}
      {import.meta.env.DEV && (
        <p className="rounded-lg bg-sunken p-3 text-sm text-muted">
          على جهازك: كلمة السر في ملف <code dir="ltr">.dev.vars</code> (سطر <code dir="ltr">ADMIN_PASSWORD</code>). تقدر تغيّرها لأي كلمة تحبها.
        </p>
      )}
      <button
        type="submit"
        disabled={busy || password === ''}
        className="rounded-xl bg-gradient-to-l from-brand-500 to-brand-400 py-3 font-bold text-white disabled:opacity-50"
      >
        {busy ? 'جاري الدخول...' : 'دخول'}
      </button>
      <a href="/" className="text-center text-sm text-muted underline">
        الرجوع للموقع
      </a>
    </form>
  )
}

type Tab = 'menu' | 'extras' | 'settings' | 'orders'
const TABS: [Tab, string][] = [
  ['menu', 'المنيو والأسعار'],
  ['extras', 'أصناف جديدة'],
  ['settings', 'المواعيد والتوصيل'],
  ['orders', 'طلبات اليوم'],
]

export default function Admin() {
  const [signedIn, setSignedIn] = useState(() => getToken() !== null)
  const [tab, setTab] = useState<Tab>('menu')
  const [shop, setShop] = useState<(ShopData & { sheetUrl: string | null }) | null>(null)
  const [error, setError] = useState('')

  const signOut = useCallback(() => {
    clearToken()
    setSignedIn(false)
    setShop(null)
  }, [])

  useEffect(() => {
    document.title = 'لوحة التحكم'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    if (!signedIn) return
    fetchShop()
      .then(setShop)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return signOut()
        setError(e instanceof ApiError ? e.message : 'تعذر تحميل البيانات.')
      })
  }, [signedIn, signOut])

  if (!signedIn) return <Login onDone={() => setSignedIn(true)} />

  const loading = <p className="py-10 text-center text-muted">جاري التحميل...</p>

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
        <div className="flex gap-4 text-sm">
          <a href="/" className="text-muted underline">
            الموقع
          </a>
          <button type="button" onClick={signOut} className="text-muted underline">
            تسجيل خروج
          </button>
        </div>
      </header>

      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={
              'rounded-full border-2 border-brand-400 px-5 py-2 font-bold ' + (tab === id ? 'bg-brand-400 text-white' : 'bg-surface text-accent')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-warn-bg p-4 font-semibold text-warn ring-1 ring-warn-line">
          {error}
        </p>
      )}
      {!error && tab === 'orders' && <OrdersPanel onExpired={signOut} sheetUrl={shop?.sheetUrl ?? null} />}
      {!error && tab !== 'orders' && !shop && loading}
      {!error && shop && tab === 'menu' && <MenuEditor saved={shop.overrides} onSaved={(overrides) => setShop({ ...shop, overrides })} />}
      {!error && shop && tab === 'extras' && <ExtrasEditor saved={shop.extras} onSaved={(extras) => setShop({ ...shop, extras })} />}
      {!error && shop && tab === 'settings' && <SettingsPanel saved={shop.settings} onSaved={(settings) => setShop({ ...shop, settings })} />}
    </div>
  )
}
