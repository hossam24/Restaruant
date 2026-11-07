import { FaCircleInfo } from 'react-icons/fa6'
import { inCategory, useMenu } from '../data/menuStore'
import type { MenuItem } from '../data/types'
import { matchesQuery, sortItems, type SortMode } from '../lib/search'
import type { CategoryFilter } from './CategoryMenu'
import { MenuCard } from './MenuCard'

interface Props {
  category: CategoryFilter
  query: string
  sort: SortMode
  onOpen: (item: MenuItem) => void
  onClearSearch: () => void
}

export function MenuGrid({ category, query, sort, onOpen, onClearSearch }: Props) {
  const searching = query.trim() !== ''
  const all = useMenu((s) => s.items)
  const categories = useMenu((s) => s.categories)
  const base = searching ? inCategory(all, 'all').filter((i) => matchesQuery(i, query)) : inCategory(all, category)
  const items = sortItems(base, sort)
  const note = searching ? undefined : categories.find((c) => c.id === category)?.note

  return (
    <main className="min-w-0 flex-1 pb-8 md:pt-5">
      {searching && (
        <p className="mb-5 text-lg font-bold" aria-live="polite">
          {items.length > 0 ? `لقينا ${items.length} للبحث عن «${query.trim()}»` : ''}
        </p>
      )}
      {note && (
        <p className="pop-in mb-7 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-brand-500 to-brand-400 p-5 text-center text-lg font-bold text-white shadow-md">
          <FaCircleInfo aria-hidden /> {note}
        </p>
      )}
      {items.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center shadow-sm ring-1 ring-line">
          <p className="text-lg font-bold">{searching ? `مالقيناش «${query.trim()}» في المنيو` : 'مفيش أصناف في القسم ده دلوقتي.'}</p>
          {searching && (
            <>
              <p className="mt-2 text-muted">جرّب كلمة تانية، أو شوف الأقسام.</p>
              <button type="button" onClick={onClearSearch} className="mt-4 rounded-full bg-brand-500 px-6 py-2 font-bold text-white">
                امسح البحث
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}
    </main>
  )
}
