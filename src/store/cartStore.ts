import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine, ChickenPart } from '../data/types'
import { lineKey } from '../lib/pricing'

export interface AddArgs {
  itemId: string
  sizeId?: string
  part?: ChickenPart
  note?: string
  quantity?: number
}

interface CartState {
  lines: CartLine[]
  /** The cart as it was when the last order was sent. Lets the customer order the same again. */
  lastOrder: CartLine[]
  add: (args: AddArgs) => void
  increment: (key: string) => void
  /** Removes the line when the quantity would reach zero. */
  decrement: (key: string) => void
  remove: (key: string) => void
  clear: () => void
  /** Called after an order was sent: remembers it and empties the cart. */
  complete: () => void
  reorder: () => void
}

const bump = (lines: CartLine[], key: string, by: number) =>
  lines.flatMap((l) => {
    if (l.key !== key) return [l]
    const quantity = l.quantity + by
    return quantity > 0 ? [{ ...l, quantity }] : []
  })

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      lastOrder: [],
      add: ({ itemId, sizeId, part, note, quantity = 1 }) =>
        set((s) => {
          const cleanNote = note?.trim() || undefined
          const key = lineKey(itemId, sizeId, part, cleanNote)
          if (s.lines.some((l) => l.key === key)) return { lines: bump(s.lines, key, quantity) }
          return { lines: [...s.lines, { key, itemId, sizeId, part, note: cleanNote, quantity }] }
        }),
      increment: (key) => set((s) => ({ lines: bump(s.lines, key, 1) })),
      decrement: (key) => set((s) => ({ lines: bump(s.lines, key, -1) })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      complete: () => set((s) => ({ lastOrder: s.lines.length ? s.lines : s.lastOrder, lines: [] })),
      reorder: () => set((s) => ({ lines: s.lastOrder })),
    }),
    { name: 'rasheedy-cart', version: 1 },
  ),
)
