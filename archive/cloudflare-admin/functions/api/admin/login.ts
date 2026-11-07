import { issueToken, passwordMatches } from '../../_shared/auth'
import { clientIp, json, rateLimited, type Env } from '../../_shared/http'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD) return json({ error: 'لوحة التحكم لسه متفعلتش على السيرفر.' }, 503)

  if (await rateLimited(env, `login:${clientIp(request)}`, 10, 900)) {
    return json({ error: 'محاولات كتير. استنى شوية وجرّب تاني.' }, 429)
  }

  let password = ''
  try {
    password = String(((await request.json()) as { password?: unknown }).password ?? '')
  } catch {
    return json({ error: 'طلب غير صالح.' }, 400)
  }
  if (!(await passwordMatches(env, password))) return json({ error: 'كلمة السر غلط.' }, 401)

  const { token, expiresAt } = await issueToken(env)
  return json({ token, expiresAt })
}
