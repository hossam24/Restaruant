import { menuItems } from '../../src/data/menu'
import { sanitizeOverrides } from '../../src/data/overrides'
import { DEFAULT_SETTINGS, sanitizeExtras, sanitizeSettings, type ShopData } from '../../src/data/shopData'
export interface Env {
  MENU_KV?: KVNamespace
  ADMIN_PASSWORD?: string
  SHEET_URL?: string
  SESSION_SECRET?: string
  APPS_SCRIPT_URL?: string
  ORDER_SECRET?: string
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

export const clientIp = (request: Request) => request.headers.get('CF-Connecting-IP') ?? 'unknown'

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
