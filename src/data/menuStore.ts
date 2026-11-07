import { create } from 'zustand'
import { SHEET_API_URL } from '../config'
import { DEFAULT_CATEGORIES, type Category } from './categories'
import { menuItems as builtIn } from './menu'
import { parseSheetMenu, type SheetMenu } from './sheetMenu'
import { DEFAULT_SETTINGS, type Settings } from './shopData'
import type { CategoryId, MenuItem } from './types'

interface MenuState {
  items: MenuItem[]
  categories: Category[]
  settings: Settings
  apply: (menu: SheetMenu) => void
}

const CACHE_KEY = 'menu-sheet-v1'

function cached(): SheetMenu | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? parseSheetMenu(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

const start: SheetMenu = (SHEET_API_URL ? cached() : null) ?? { items: builtIn, categories: DEFAULT_CATEGORIES, settings: DEFAULT_SETTINGS }

export const useMenu = create<MenuState>((set) => ({
  items: start.items,
  categories: start.categories,
  settings: start.settings,
  apply: (menu) => set({ items: menu.items, categories: menu.categories, settings: menu.settings }),
}))

export const getItem = (id: string): MenuItem | undefined => useMenu.getState().items.find((i) => i.id === id)

export const isVisible = (i: MenuItem) => !i.hidden

export const inCategory = (items: MenuItem[], category: CategoryId | 'all'): MenuItem[] =>
  items.filter((i) => isVisible(i) && (category === 'all' || i.category === category))

export async function refreshMenu(): Promise<void> {
  if (!SHEET_API_URL) return
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), 15_000)
  try {
    const res = await fetch(`${SHEET_API_URL}?action=menu`, { signal: abort.signal })
    if (!res.ok) return
    const payload: unknown = await res.json()
    const menu = parseSheetMenu(payload)
    if (!menu) return
    useMenu.getState().apply(menu)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
    } catch {}
  } catch {} finally {
    clearTimeout(timer)
  }
}
