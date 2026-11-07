import { FaCartShopping } from 'react-icons/fa6'

interface Props {
  count: number
  subtotal: number
  hidden: boolean
  onOpen: () => void
}

/** Phone-only shortcut so the customer never has to scroll up to find the cart. */
export function FloatingCartBar({ count, subtotal, hidden, onOpen }: Props) {
  if (count === 0 || hidden) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="pop-in flex w-full items-center justify-between gap-3 rounded-2xl bg-brand-600 px-5 py-3.5 font-bold text-white shadow-xl"
      >
        <span className="flex items-center gap-3">
          <FaCartShopping aria-hidden />
          عرض السلة
          <span className="grid min-w-7 place-items-center rounded-full bg-surface px-2 text-sm text-accent">{count}</span>
        </span>
        <span>{subtotal} جنيه</span>
      </button>
    </div>
  )
}
