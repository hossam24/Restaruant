import type { Overrides } from '../data/overrides'
import type { Settings, ShopData } from '../data/shopData'
import type { MenuItem } from '../data/types'

const KEY = 'admin-token'

export interface AdminOrder {
  time: string
  name: string
  phone: string
  additionalPhone: string
  address: string
  items: string
  total: string
  notes: string
  type: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export const getToken = (): string | null => {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export const clearToken = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}

async function call<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (auth) headers.set('Authorization', `Bearer ${getToken() ?? ''}`)

  let res: Response
  try {
    res = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError('مفيش اتصال بالسيرفر. اتأكد من الإنترنت.', 0)
  }
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null
  if (!res.ok || body === null) {
    if (res.status === 401 && auth) clearToken()
    const unreachable =
      'مش قادر أوصل لخدمة الإدارة (' +
      res.status +
      '). لو بتجرب على جهازك: شغّل npm run dev:full وافتح http://127.0.0.1:8788/admin. ولو الموقع أونلاين: اتأكد إن الـ Functions اتنشرت.'
    throw new ApiError(body?.error ?? unreachable, res.status)
  }
  return body as T
}

export async function login(password: string): Promise<void> {
  const { token } = await call<{ token: string }>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ password }) },
    false,
  )
  try {
    sessionStorage.setItem(KEY, token)
  } catch {}
}

export const fetchShop = () => call<ShopData & { sheetUrl: string | null }>('/api/admin/menu')

export const saveOverrides = (overrides: Overrides) =>
  call<{ overrides: Overrides }>('/api/admin/menu', { method: 'PUT', body: JSON.stringify({ overrides }) }).then(
    (r) => r.overrides,
  )

export const fetchOrders = (date: string) =>
  call<{ date: string; orders: AdminOrder[] }>(`/api/admin/orders?date=${encodeURIComponent(date)}`)

export const saveExtras = (extras: MenuItem[]) =>
  call<{ extras: MenuItem[] }>('/api/admin/extras', { method: 'PUT', body: JSON.stringify({ extras }) }).then((r) => r.extras)

export const saveSettings = (settings: Settings) =>
  call<{ settings: Settings }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) }).then((r) => r.settings)

export async function uploadImage(blob: Blob): Promise<string> {
  const res = await fetch('/api/admin/image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken() ?? ''}`, 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  }).catch(() => null)
  const body = (await res?.json().catch(() => null)) as { url?: string; error?: string } | null
  if (!res || !res.ok || !body?.url) throw new ApiError(body?.error ?? 'تعذر رفع الصورة.', res?.status ?? 0)
  return body.url
}
