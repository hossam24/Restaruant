import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'menu-theme'

const systemTheme = (): Theme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

function current(): Theme {
  const set = document.documentElement.dataset.theme
  return set === 'dark' || set === 'light' ? set : systemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(current)
  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {}
    setTheme(next)
  }, [])
  return { theme, toggle }
}
