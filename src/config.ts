import brand from './brand.json'

export interface Phone {
  label: string
  href: string
}

export const RESTAURANT = {
  name: brand.name,
  tagline: brand.tagline,
  description: brand.description,
  whatsapp: brand.whatsapp,
  phones: (brand.phones as string[]).map((p): Phone => ({ label: p, href: 'tel:' + p.replace(/[^\d+]/g, '') })),
  address: brand.address,
  socials: brand.socials,
} as const

export const BREAST_SURCHARGE = 10

export interface Hours {
  open: string
  close: string
}

export const HOURS: Hours | null = { open: '10:00', close: '02:00' }

export interface DeliveryConfig {
  fee: number | null
  freeOver: number | null
  estimate: string | null
}

export const DELIVERY: DeliveryConfig = {
  fee: null,
  freeOver: null,
  estimate: null,
}

export const SHEET_API_URL: string = import.meta.env.VITE_SHEET_API_URL ?? ''
