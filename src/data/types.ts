export type CategoryId = string

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
  price?: number
  oldPrice?: number
  sizes?: Size[]
  chickenChoice?: boolean
  soldOut?: boolean
  hidden?: boolean
}

export type ChickenPart = 'ورك' | 'صدر'

export interface CartLine {
  key: string
  itemId: string
  sizeId?: string
  part?: ChickenPart
  note?: string
  quantity: number
}
