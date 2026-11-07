import { menuItems } from '../../../src/data/menu'
import { sanitizeOverrides } from '../../../src/data/overrides'
import { requireAdmin } from '../../_shared/auth'
import { json, KEYS, readShop, type Env } from '../../_shared/http'

const MAX_BODY = 200_000

/** Everything the owner has saved, uncached, for the admin page. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  return json({ ...(await readShop(env)), sheetUrl: googleSheetUrl(env.SHEET_URL) })
}

/** Only a real Google Sheets address is passed on, so a typo in the setting can never become a strange link. */
function googleSheetUrl(value: string | undefined): string | null {
  try {
    const u = new URL(value ?? '')
    return u.protocol === 'https:' && u.hostname === 'docs.google.com' && u.pathname.startsWith('/spreadsheets/') ? u.href : null
  } catch {
    return null
  }
}

/** Replaces all changes to built-in items. The body is cleaned first: nothing from the browser is trusted. */
export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  if (!env.MENU_KV) {
    return json({ error: 'التخزين (MENU_KV) لسه متربطش بالموقع، فمش هينفع نحفظ.' }, 503)
  }

  const text = await request.text()
  if (text.length > MAX_BODY) return json({ error: 'الطلب كبير أوي.' }, 413)

  let body: { overrides?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400)
  }

  const clean = sanitizeOverrides(body.overrides, menuItems)
  await env.MENU_KV.put(KEYS.overrides, JSON.stringify(clean))
  return json({ overrides: clean })
}
