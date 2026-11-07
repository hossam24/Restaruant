import { useEffect, useState } from 'react'
import { useMenu } from '../data/menuStore'
import { cairoMinutes, openStatus, type OpenStatus } from './hours'

/** Open/closed right now, refreshed every minute. `null` when no opening hours are set. */
export function useOpenStatus(): OpenStatus | null {
  const hours = useMenu((s) => s.settings.hours)
  const [minutes, setMinutes] = useState(() => cairoMinutes())
  useEffect(() => {
    if (!hours) return
    setMinutes(cairoMinutes())
    const id = setInterval(() => setMinutes(cairoMinutes()), 60_000)
    return () => clearInterval(id)
  }, [hours])
  return hours ? openStatus(hours, minutes) : null
}
