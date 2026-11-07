import { json, type Env } from './http'

const enc = new TextEncoder()
const SESSION_MS = 12 * 60 * 60 * 1000

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

/** Compares two strings without stopping at the first difference. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  return diff === 0
}

const secretOf = (env: Env) => env.SESSION_SECRET || env.ADMIN_PASSWORD || ''

export async function passwordMatches(env: Env, given: string): Promise<boolean> {
  if (!env.ADMIN_PASSWORD) return false
  // Hash both sides so the comparison always runs over equal-length values.
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(env.ADMIN_PASSWORD)),
  ])
  return safeEqual(toHex(a), toHex(b))
}

/** "expiry.signature". Anyone can read the expiry, nobody can forge it without the secret. */
export async function issueToken(env: Env): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_MS
  return { token: `${expiresAt}.${await sign(secretOf(env), String(expiresAt))}`, expiresAt }
}

async function tokenValid(env: Env, token: string): Promise<boolean> {
  const [exp, sig] = token.split('.')
  if (!exp || !sig || !secretOf(env)) return false
  if (!(Number(exp) > Date.now())) return false
  return safeEqual(sig, await sign(secretOf(env), exp))
}

/** Returns an error response when the caller is not the signed-in owner, otherwise null. */
export async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  if (!env.ADMIN_PASSWORD) return json({ error: 'لوحة التحكم لسه متفعلتش على السيرفر.' }, 503)
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!(await tokenValid(env, token))) return json({ error: 'سجّل دخولك الأول.' }, 401)
  return null
}
