import { create } from 'zustand'
import { SHEET_API_URL } from '../config'
import { menuItems as builtIn } from './menu'
import { parseSheetMenu, type SheetMenu } from './sheetMenu'
import { DEFAULT_SETTINGS, type Settings } from './shopData'
import type { CategoryId, MenuItem } from './types'

interface MenuState {
  /** The menu from the Google Sheet (or the built-in one). Includes hidden items: filter with `isVisible`. */
  items: MenuItem[]
  /** Opening hours and delivery fee: from the sheet, or the defaults from config.ts. */
  settings: Settings
  apply: (menu: SheetMenu) => void
}

const CACHE_KEY = 'rasheedy-sheet-v1'

/** What we received last time, checked again on the way back in. Lets the menu show instantly, even offline. */
function cached(): SheetMenu | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? parseSheetMenu(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

const start: SheetMenu = (SHEET_API_URL ? cached() : null) ?? { items: builtIn, settings: DEFAULT_SETTINGS }

export const useMenu = create<MenuState>((set) => ({
  items: start.items,
  settings: start.settings,
  apply: (menu) => set({ items: menu.items, settings: menu.settings }),
}))

export const getItem = (id: string): MenuItem | undefined => useMenu.getState().items.find((i) => i.id === id)

export const isVisible = (i: MenuItem) => !i.hidden

export const inCategory = (items: MenuItem[], category: CategoryId | 'all'): MenuItem[] =>
  items.filter((i) => isVisible(i) && (category === 'all' || i.category === category))

/**
 * Asks the Google Sheet for the latest menu. Any problem (offline, slow, a half-edited sheet) keeps the menu
 * that is already on screen, so the site never ends up with an empty or broken menu.
 */
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
    } catch {
      /* storage full or blocked: not important */
    }
  } catch {
    /* offline, timed out, or not JSON: keep what we have */
  } finally {
    clearTimeout(timer)
  }
}
