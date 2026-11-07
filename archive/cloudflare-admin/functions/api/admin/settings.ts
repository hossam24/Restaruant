import { sanitizeSettings } from '../../../src/data/shopData'
import { requireAdmin } from '../../_shared/auth'
import { json, KEYS, readShop, type Env } from '../../_shared/http'

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  if (!env.MENU_KV) return json({ error: 'التخزين (MENU_KV) لسه متربطش بالموقع، فمش هينفع نحفظ.' }, 503)

  let body: { settings?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400)
  }
  const clean = sanitizeSettings(body.settings, (await readShop(env)).settings)
  await env.MENU_KV.put(KEYS.settings, JSON.stringify(clean))
  return json({ settings: clean })
}
