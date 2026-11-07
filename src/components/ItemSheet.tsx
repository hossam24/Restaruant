import { useState } from 'react'
import { FaMinus, FaPlus, FaXmark } from 'react-icons/fa6'
import { BREAST_SURCHARGE } from '../config'
import type { ChickenPart, MenuItem } from '../data/types'
import { unitPrice } from '../lib/pricing'
import { useModal } from '../lib/useModal'
import { useCart } from '../store/cartStore'
import { FoodImage } from './FoodImage'

interface Props {
  item: MenuItem
  onClose: () => void
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        'min-w-[5rem] flex-1 rounded-lg border-2 border-brand-500 px-3 py-2 font-semibold transition ' +
        (active ? 'bg-brand-500 text-white' : 'bg-surface text-accent hover:bg-brand-50')
      }
    >
      {children}
    </button>
  )
}

export function ItemSheet({ item, onClose }: Props) {
  useModal(true, onClose)
  const add = useCart((s) => s.add)
  const [sizeId, setSizeId] = useState(item.sizes?.[0].id)
  const [part, setPart] = useState<ChickenPart | undefined>(item.chickenChoice ? 'ورك' : undefined)
  const [note, setNote] = useState('')
  const [quantity, setQuantity] = useState(1)

  const price = unitPrice(item, sizeId, part)
  const oldPrice = item.oldPrice !== undefined ? item.oldPrice + (part === 'صدر' ? BREAST_SURCHARGE : 0) : undefined

  function submit() {
    add({ itemId: item.id, sizeId, part, note, quantity })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="pop-in relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-surface sm:max-w-lg sm:rounded-3xl"
      >
        <button
          type="button"
          aria-label="إغلاق"
          onClick={onClose}
          className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-surface/90 text-lg shadow hover:bg-surface"
        >
          <FaXmark aria-hidden />
        </button>
        <FoodImage src={item.image} alt={item.name} className="h-72 w-full bg-brand-50/60 object-contain p-3" />

        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 id="sheet-title" className="text-2xl font-extrabold">
              {item.name}
            </h2>
            {item.description && <p className="mt-2 leading-relaxed text-muted">{item.description}</p>}
          </div>

          {item.sizes && (
            <div>
              <p className="mb-2 font-bold">الحجم</p>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map((s) => (
                  <Choice key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                    {s.name} · {s.price}
                  </Choice>
                ))}
              </div>
            </div>
          )}

          {item.chickenChoice && (
            <div>
              <p className="mb-2 font-bold">تحب الورك ولا الصدر؟</p>
              <div className="flex flex-wrap gap-2">
                <Choice active={part === 'ورك'} onClick={() => setPart('ورك')}>
                  ورك
                </Choice>
                <Choice active={part === 'صدر'} onClick={() => setPart('صدر')}>
                  صدر (+{BREAST_SURCHARGE} جنيه)
                </Choice>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="item-note" className="mb-2 block font-bold">
              ملاحظة على الصنف (اختياري)
            </label>
            <input
              id="item-note"
              type="text"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: بدون بصل، سلطة زيادة"
              className="w-full rounded-lg border-2 border-line-strong px-3 py-2.5 focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="تقليل الكمية"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
                className="grid size-11 place-items-center rounded-lg bg-brand-500 text-white disabled:opacity-40"
              >
                <FaMinus aria-hidden />
              </button>
              <span className="min-w-10 text-center text-2xl font-extrabold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="زيادة الكمية"
                onClick={() => setQuantity((q) => q + 1)}
                className="grid size-11 place-items-center rounded-lg bg-brand-500 text-white"
              >
                <FaPlus aria-hidden />
              </button>
            </div>
            <div className="flex flex-1 items-baseline justify-end gap-2">
              {oldPrice !== undefined && <span className="text-faint line-through">{oldPrice * quantity}</span>}
              <span className={'text-2xl font-extrabold ' + (oldPrice !== undefined ? 'text-good' : 'text-accent')}>
                {price * quantity} جنيه
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={item.soldOut}
            className="w-full rounded-xl bg-gradient-to-l from-brand-500 to-brand-400 py-3.5 text-lg font-bold text-white transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.soldOut ? 'خلصت النهارده' : 'أضف للسلة'}
          </button>
        </div>
      </div>
    </div>
  )
}
