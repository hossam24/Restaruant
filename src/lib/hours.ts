import type { Hours } from '../config'

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function cairoMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return get('hour') * 60 + get('minute')
}

export interface OpenStatus {
  open: boolean
  changesAt: string
}

export function openStatus(hours: Hours, minutes: number): OpenStatus {
  const o = toMinutes(hours.open)
  const c = toMinutes(hours.close)
  const open = o === c ? true : o < c ? minutes >= o && minutes < c : minutes >= o || minutes < c
  return { open, changesAt: open ? hours.close : hours.open }
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'م' : 'ص'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}
