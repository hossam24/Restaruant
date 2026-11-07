import { requireAdmin } from '../../_shared/auth'
import { json, type Env } from '../../_shared/http'

const cairoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  if (!env.APPS_SCRIPT_URL || !env.ORDER_SECRET) {
    return json({ error: 'ربط الشيت لسه متفعلش (APPS_SCRIPT_URL و ORDER_SECRET).' }, 503)
  }

  const asked = new URL(request.url).searchParams.get('date') ?? ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : cairoToday()

  const url = new URL(env.APPS_SCRIPT_URL)
  url.searchParams.set('secret', env.ORDER_SECRET)
  url.searchParams.set('date', date)
  const upstream = await fetch(url, { redirect: 'follow' })
  const result = (await upstream.json().catch(() => null)) as { status?: string; orders?: unknown[] } | null
  if (!upstream.ok || result?.status !== 'success') return json({ error: 'تعذر قراءة الطلبات من الشيت.' }, 502)
  return json({ date, orders: result.orders ?? [] })
}
