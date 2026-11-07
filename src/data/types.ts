export type CategoryId =
  | 'offers'
  | 'sandwich'
  | 'wagabatFardy'
  | 'wagabatZawgy'
  | 'mashawy'
  | 'sawaany'
  | 'edafat'

export interface Size {
  id: string
  name: string
  price: number
}

export interface MenuItem {
  id: string
  category: CategoryId
  name: string
  description?: string
  image: string
  /** Current selling price. Absent when the item is sold by size. */
  price?: number
  /** Struck-through price shown next to `price` for offers. */
  oldPrice?: number
  sizes?: Size[]
  /** Offers the customer a choice between leg (ورك) and breast (صدر, +10). */
  chickenChoice?: boolean
  /** Set from the admin panel: the item cannot be ordered today. */
  soldOut?: boolean
  /** Set from the admin panel: the item is not shown to customers. */
  hidden?: boolean
}

export type ChickenPart = 'ورك' | 'صدر'

/** What is stored in the cart: only the choice, never the price. Prices come from the menu. */
export interface CartLine {
  key: string
  itemId: string
  sizeId?: string
  part?: ChickenPart
  /** Customer's note for this item only, e.g. "بدون بصل". */
  note?: string
  quantity: number
}
