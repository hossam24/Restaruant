import { FaCartShopping, FaMoon, FaSun } from 'react-icons/fa6'
import { RESTAURANT } from '../config'
import { useTheme } from '../lib/useTheme'

interface Props {
  count: number
  onOpenCart: () => void
}

export function Navbar({ count, onOpenCart }: Props) {
  const { theme, toggle } = useTheme()
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-l from-brand-500 to-brand-400 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <a href="#top" className="flex items-center gap-3 text-xl font-bold text-white">
          <img src="/icon-192.png" alt="" className="size-12 rounded-xl sm:size-14" />
          {RESTAURANT.name}
        </a>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="grid size-11 place-items-center rounded-full bg-white/20 text-lg text-white transition hover:bg-white/30"
          >
            {theme === 'dark' ? <FaSun aria-hidden /> : <FaMoon aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 font-bold text-accent shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <FaCartShopping aria-hidden />
            السلة
            <span
              aria-label={`${count} صنف في السلة`}
              className="absolute -start-2 -top-2 grid size-6 place-items-center rounded-full bg-red-600 text-xs font-bold text-white"
            >
              {count}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
