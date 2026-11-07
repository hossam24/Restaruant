import { menuItems } from '../../src/data/menu'
import { sanitizeOverrides } from '../../src/data/overrides'
import { DEFAULT_SETTINGS, sanitizeExtras, sanitizeSettings, type ShopData } from '../../src/data/shopData'
export interface Env {
  /** Where the owner's menu changes are stored. Create a KV namespace and bind it with this name. */
  MENU_KV?: KVNamespace
  /** Password for /admin. */
  ADMIN_PASSWORD?: string
  /** Optional: the address of the Google Sheet itself. Only used for the "open the Sheet" link in /admin. */
  SHEET_URL?: string
  /** Optional separate secret used to sign admin sessions. Falls back to ADMIN_PASSWORD. */
  SESSION_SECRET?: string
  /** Google Apps Script web app URL (the one that writes to the Sheet). */
  APPS_SCRIPT_URL?: string
  /** Shared secret that the Apps Script also knows. Stops anyone else from writing to the Sheet. */
  ORDER_SECRET?: string
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

export const clientIp = (request: Request) => request.headers.get('CF-Connecting-IP') ?? 'unknown'

/**
 * Allows `limit` calls per `windowSec` for this key. KV is only eventually consistent, so this is a brake
 * against floods and guessing, not an exact counter. Without KV it does nothing.
 */
export async function rateLimited(env: Env, key: string, limit: number, windowSec: number): Promise<boolean> {
  if (!env.MENU_KV) return false
  const slot = Math.floor(Date.now() / (windowSec * 1000))
  const k = `rl:${key}:${slot}`
  const used = Number((await env.MENU_KV.get(k)) ?? 0)
  if (used >= limit) return true
  await env.MENU_KV.put(k, String(used + 1), { expirationTtl: Math.max(60, windowSec * 2) })
  return false
}

const KEYS = { overrides: 'menu-overrides', extras: 'menu-extras', settings: 'settings' } as const
export { KEYS }

/** Everything the owner changed. Cleaned on the way out, so a bad stored value can never reach customers. */
export async function readShop(env: Env): Promise<ShopData> {
  if (!env.MENU_KV) return { overrides: {}, extras: [], settings: DEFAULT_SETTINGS }
  const kv = env.MENU_KV
  const [overrides, extras, settings] = await Promise.all([
    kv.get(KEYS.overrides, 'json'),
    kv.get(KEYS.extras, 'json'),
    kv.get(KEYS.settings, 'json'),
  ])
  return {
    overrides: sanitizeOverrides(overrides, menuItems),
    extras: sanitizeExtras(extras),
    settings: sanitizeSettings(settings),
  }
}
