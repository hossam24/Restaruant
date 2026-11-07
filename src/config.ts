// Everything an owner may want to change without touching components.
export const RESTAURANT = {
  name: 'مطعم رشيدي',
  /** International format, no "+": used for wa.me links. */
  whatsapp: '201501108083',
  phones: [
    { label: '0403297431', href: 'tel:0403297431' },
    { label: '01501108083', href: 'tel:+201501108083' },
  ],
  address: 'شارع الحلو مع الامام البصيري امام كلية تجارة من الحلو',
  socials: {
    facebook: 'https://www.facebook.com/RasheedyRestaurant',
    instagram: 'https://www.instagram.com/rasheedy.restaurant',
    tiktok: 'https://www.tiktok.com/@rasheedytanta',
  },
} as const

/** Extra charge for choosing breast (صدر) instead of leg (ورك). */
export const BREAST_SURCHARGE = 10

export interface Hours {
  /** 24h "HH:MM", Cairo time. */
  open: string
  /** If earlier than `open`, the restaurant closes after midnight (e.g. open 12:00, close 02:00). */
  close: string
}

/**
 * Opening hours (Cairo time). Set to `null` to hide the open/closed status.
 * Currently 10:00 to 02:00 (closes after midnight) - change if that is not right.
 */
export const HOURS: Hours | null = { open: '10:00', close: '02:00' }

export interface DeliveryConfig {
  /** Delivery fee in EGP. `null` = not decided: totals say "غير شامل التوصيل" like the old site. */
  fee: number | null
  /** Orders at or above this subtotal get free delivery. `null` = never free. */
  freeOver: number | null
  /** Shown on the confirmation screen, e.g. 'خلال 45 دقيقة تقريباً'. `null` = hidden. */
  estimate: string | null
}

export const DELIVERY: DeliveryConfig = {
  fee: null,
  freeOver: null,
  estimate: null,
}

/**
 * The address of YOUR Google Sheet script (the "Web app URL" you copy after Deploy, ending in /exec).
 * Paste it between the quotes below. See google-apps-script.js for the 5-minute setup.
 *
 * - Empty: the website shows the built-in menu from src/data/menu.ts and orders are NOT logged in a sheet
 *   (they still go out on WhatsApp).
 * - Filled: the menu, opening hours and delivery fee come from the sheet, and each order is logged in it.
 *
 * For local testing a different address can be given with the VITE_SHEET_API_URL setting.
 */
export const SHEET_API_URL: string =
  import.meta.env.VITE_SHEET_API_URL ??
  'https://script.google.com/macros/s/AKfycbwguCTHV1JeDnXOQ_Xix6GRPrbO5pcgIHXzp9o2v5kAW8U8-feTzf7MF6pRp_2n1sLr/exec'
