import { requireAdmin } from '../../_shared/auth'
import { json, type Env } from '../../_shared/http'

const MAX_BYTES = 700_000

/** Recognises the file by its first bytes, never by what the browser claims it is. SVG is deliberately not allowed. */
function sniff(b: Uint8Array): 'image/webp' | 'image/jpeg' | 'image/png' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return 'image/webp'
  }
  return null
}

/** Stores one photo for a new menu item and returns its address. The admin page shrinks photos before sending. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env)
  if (denied) return denied
  if (!env.MENU_KV) return json({ error: 'التخزين (MENU_KV) لسه متربطش بالموقع، فمش هينفع نرفع صور.' }, 503)

  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.length === 0) return json({ error: 'مفيش صورة.' }, 400)
  if (bytes.length > MAX_BYTES) return json({ error: 'الصورة كبيرة أوي (الحد 700 كيلوبايت).' }, 413)
  const type = sniff(bytes)
  if (!type) return json({ error: 'نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.' }, 415)

  const raw = crypto.getRandomValues(new Uint8Array(8))
  const id = [...raw].map((b) => b.toString(16).padStart(2, '0')).join('')
  await env.MENU_KV.put(`img:${id}`, bytes, { metadata: { type, at: Date.now() } })
  return json({ url: `/api/img/${id}` })
}
