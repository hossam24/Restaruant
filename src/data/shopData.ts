// Opening hours and delivery fee. They come from the "الإعدادات" tab of the Google Sheet
// (or from the defaults in config.ts when no sheet is connected).
import { DELIVERY, HOURS, type DeliveryConfig, type Hours } from '../config'

export interface Settings {
  /** `null` = do not show open/closed status. */
  hours: Hours | null
  delivery: DeliveryConfig
}

export const DEFAULT_SETTINGS: Settings = { hours: HOURS, delivery: DELIVERY }

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const int = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

/** Anything missing or invalid falls back to `fallback`, so a bad cell in the sheet can never break the site. */
export function sanitizeSettings(raw: unknown, fallback: Settings = DEFAULT_SETTINGS): Settings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const d = (typeof r.delivery === 'object' && r.delivery !== null ? r.delivery : {}) as Record<string, unknown>

  let hours = fallback.hours
  if (r.hours === null) hours = null
  else if (typeof r.hours === 'object') {
    const h = r.hours as Record<string, unknown>
    if (typeof h.open === 'string' && typeof h.close === 'string' && TIME.test(h.open) && TIME.test(h.close) && h.open !== h.close) {
      hours = { open: h.open, close: h.close }
    }
  }

  const delivery: DeliveryConfig = { ...fallback.delivery }
  if (d.fee === null || int(d.fee, 0, 10_000)) delivery.fee = d.fee as number | null
  if (d.freeOver === null || int(d.freeOver, 1, 100_000)) delivery.freeOver = d.freeOver as number | null
  if (d.estimate === null) delivery.estimate = null
  else if (typeof d.estimate === 'string') delivery.estimate = d.estimate.trim().slice(0, 60) || null
  // A free-delivery threshold means nothing without a fee to waive.
  if (delivery.fee === null) delivery.freeOver = null

  return { hours, delivery }
}
