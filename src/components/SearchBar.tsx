import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'
import type { SortMode } from '../lib/search'

interface Props {
  query: string
  onQuery: (q: string) => void
  sort: SortMode
  onSort: (s: SortMode) => void
}

export function SearchBar({ query, onQuery, sort, onSort }: Props) {
  return (
    <div className="mx-auto flex max-w-6xl gap-2 px-4 pt-6 sm:gap-3 sm:pt-7">
      <div className="relative min-w-0 flex-1">
        <label htmlFor="search" className="sr-only">
          ابحث في المنيو
        </label>
        <FaMagnifyingGlass aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="دوّر على أكلتك..."
          className="w-full rounded-full border-2 border-line bg-surface py-3 pe-12 ps-11 text-base shadow-sm transition focus:border-brand-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="مسح البحث"
            onClick={() => onQuery('')}
            className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-sunken"
          >
            <FaXmark aria-hidden />
          </button>
        )}
      </div>
      <div>
        <label htmlFor="sort" className="sr-only">
          ترتيب
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSort(e.target.value as SortMode)}
          className="w-[7.5rem] rounded-full border-2 border-line bg-surface px-3 py-3 text-sm font-semibold shadow-sm focus:border-brand-400 focus:outline-none sm:w-auto sm:px-5 sm:text-base"
        >
          <option value="default">الترتيب</option>
          <option value="asc">الأرخص</option>
          <option value="desc">الأغلى</option>
        </select>
      </div>
    </div>
  )
}
