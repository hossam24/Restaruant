import type { CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
  /** Short note shown above the items of this category. */
  note?: string
}

// Same order as the tabs on the old site.
export const CATEGORIES: Category[] = [
  { id: 'offers', label: 'العروض' },
  { id: 'sandwich', label: 'سندوتشات رشيدي' },
  { id: 'mashawy', label: 'مشويات رشيدي', note: 'جميع المشويات تقدم مع عيش و سلطات' },
  { id: 'wagabatFardy', label: 'وجبات رشيدي فردية' },
  { id: 'wagabatZawgy', label: 'وجبات رشيدي زوجية' },
  { id: 'sawaany', label: 'صواني عائلية' },
  { id: 'edafat', label: 'الاضافات' },
]
