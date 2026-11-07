import { CATEGORIES } from '../data/categories'
import type { CategoryId } from '../data/types'

export type CategoryFilter = CategoryId | 'all'

interface Props {
  active: CategoryFilter
  onChange: (c: CategoryFilter) => void
}

const TABS: { id: CategoryFilter; label: string }[] = [{ id: 'all', label: 'الكل' }, ...CATEGORIES]

export function CategoryTabs({ active, onChange }: Props) {
  return (
    // One swipeable row on phones (saves five rows of height), centred and wrapping on wider screens.
    <nav
      aria-label="أقسام المنيو"
      className="mx-auto flex max-w-6xl snap-x gap-2.5 overflow-x-auto px-4 py-5 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:py-7 [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(tab.id)}
            className={
              'shrink-0 snap-start whitespace-nowrap rounded-full border-2 border-brand-400 px-5 py-2 font-semibold transition ' +
              (on ? 'bg-brand-400 text-white' : 'bg-surface text-accent hover:bg-brand-50')
            }
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
