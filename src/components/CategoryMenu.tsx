import { useMemo } from 'react'
import { inCategory, useMenu } from '../data/menuStore'
import type { CategoryId } from '../data/types'

const arabicNumber = new Intl.NumberFormat('ar-EG')

export type CategoryFilter = CategoryId | 'all'

interface Props {
  active: CategoryFilter
  onChange: (c: CategoryFilter) => void
}

export function CategoryMenu({ active, onChange }: Props) {
  const items = useMenu((s) => s.items)
  const categories = useMenu((s) => s.categories)

  const tabs = useMemo(() => {
    const all = inCategory(items, 'all')
    const withCount = categories
      .map((c) => ({ id: c.id as CategoryFilter, label: c.label, count: all.filter((i) => i.category === c.id).length }))
      .filter((c) => c.count > 0)
    return [{ id: 'all' as CategoryFilter, label: 'الكل', count: all.length }, ...withCount]
  }, [items, categories])

  return (
    <nav
      aria-label="أقسام المنيو"
      className="flex snap-x gap-2.5 overflow-x-auto py-5 [scrollbar-width:none] md:sticky md:top-24 md:w-60 md:shrink-0 md:snap-none md:flex-col md:gap-1.5 md:self-start md:overflow-y-auto md:overflow-x-visible md:rounded-2xl md:bg-surface md:p-3 md:shadow-sm md:ring-1 md:ring-line md:max-h-[calc(100vh-7rem)] [&::-webkit-scrollbar]:hidden"
    >
      <p className="mb-1 hidden px-3 pt-2 text-sm font-bold text-muted md:block">أقسام المنيو</p>
      {tabs.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(tab.id)}
            className={
              'flex shrink-0 snap-start items-center justify-between gap-3 whitespace-nowrap rounded-full border-2 px-5 py-2 font-semibold transition md:w-full md:whitespace-normal md:rounded-xl md:border-0 md:px-4 md:py-3 md:text-start ' +
              (on
                ? 'border-brand-400 bg-brand-400 text-white'
                : 'border-brand-400 bg-surface text-accent hover:bg-brand-50 md:bg-transparent')
            }
          >
            <span>{tab.label}</span>
            <span
              aria-hidden
              className={'hidden rounded-full px-2 py-0.5 text-xs font-bold md:inline ' + (on ? 'bg-white/25 text-white' : 'bg-brand-50 text-accent')}
            >
              {arabicNumber.format(tab.count)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
