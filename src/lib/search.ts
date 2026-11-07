import type { MenuItem } from '../data/types'

/** Makes "فرخة", "فرخه" and "فَرْخَة" the same word, and "أ/إ/آ" the same letter. */
export function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every word the customer typed must appear in the name or description. */
export function matchesQuery(item: MenuItem, query: string): boolean {
  const tokens = normalizeArabic(query).split(' ').filter(Boolean)
  if (tokens.length === 0) return true
  const hay = normalizeArabic(`${item.name} ${item.description ?? ''}`)
  return tokens.every((t) => hay.includes(t))
}

export const minPrice = (item: MenuItem): number =>
  item.sizes ? Math.min(...item.sizes.map((s) => s.price)) : (item.price ?? 0)

export type SortMode = 'default' | 'asc' | 'desc'

export function sortItems(items: MenuItem[], mode: SortMode): MenuItem[] {
  if (mode === 'default') return items
  const dir = mode === 'asc' ? 1 : -1
  return [...items].sort((a, b) => (minPrice(a) - minPrice(b)) * dir)
}
