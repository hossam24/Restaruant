import { sanitizeExtras } from '../../../src/data/shopData'
import { requireAdmin } from '../../_shared/auth'
import { json, KEYS, type Env } from '../../_shared/http'

const MAX_BODY = 100_000
const ONE_HOUR = 3_600_000

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  if (!env.MENU_KV) return json({ error: 'التخزين (MENU_KV) لسه متربطش بالموقع، فمش هينفع نحفظ.' }, 503)

  const text = await request.text()
  if (text.length > MAX_BODY) return json({ error: 'الطلب كبير أوي.' }, 413)
  let body: { extras?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400)
  }

  const clean = sanitizeExtras(body.extras)
  await env.MENU_KV.put(KEYS.extras, JSON.stringify(clean))

  const used = new Set(clean.map((i) => i.image.replace('/api/img/', 'img:')))
  const stored = await env.MENU_KV.list<{ at?: number }>({ prefix: 'img:' })
  await Promise.all(
    stored.keys
      .filter((k) => !used.has(k.name) && (k.metadata?.at ?? 0) < Date.now() - ONE_HOUR)
      .map((k) => env.MENU_KV!.delete(k.name)),
  )
  return json({ extras: clean })
}
