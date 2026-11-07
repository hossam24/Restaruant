import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrderForm } from '../lib/validation'

type Saved = Pick<OrderForm, 'name' | 'phone' | 'additionalPhone' | 'address'>

interface CustomerState extends Saved {
  remember: (form: OrderForm) => void
  forget: () => void
}

const BLANK: Saved = { name: '', phone: '', additionalPhone: '', address: '' }

/** Stays on the customer's own device (localStorage). Never sent anywhere except inside the order itself. */
export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      ...BLANK,
      remember: (f) => set({ name: f.name, phone: f.phone, additionalPhone: f.additionalPhone, address: f.address }),
      forget: () => set(BLANK),
    }),
    { name: 'rasheedy-customer', version: 1 },
  ),
)
