import type { CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
  note?: string
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'العروض', label: 'العروض' },
  { id: 'الأطباق الرئيسية', label: 'الأطباق الرئيسية', note: 'كل الأطباق الرئيسية بتتقدم مع عيش وسلطات' },
  { id: 'السندوتشات', label: 'السندوتشات' },
  { id: 'المقبلات والسلطات', label: 'المقبلات والسلطات' },
  { id: 'المشروبات', label: 'المشروبات' },
]
