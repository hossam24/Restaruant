import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrderForm } from '../lib/validation'

type Saved = Pick<OrderForm, 'name' | 'phone' | 'additionalPhone' | 'address'>

interface CustomerState extends Saved {
  remember: (form: OrderForm) => void
  forget: () => void
}

const BLANK: Saved = { name: '', phone: '', additionalPhone: '', address: '' }

export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      ...BLANK,
      remember: (f) => set({ name: f.name, phone: f.phone, additionalPhone: f.additionalPhone, address: f.address }),
      forget: () => set(BLANK),
    }),
    { name: 'menu-customer', version: 1 },
  ),
)
