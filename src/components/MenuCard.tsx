import { useState } from 'react'
import { FaCartPlus, FaMinus, FaPlus, FaTrash } from 'react-icons/fa6'
import { BREAST_SURCHARGE } from '../config'
import type { ChickenPart, MenuItem } from '../data/types'
import { lineKey, unitPrice } from '../lib/pricing'
import { useCart } from '../store/cartStore'
import { FoodImage } from './FoodImage'

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        'min-w-[4.5rem] flex-1 rounded-lg border-2 border-brand-500 px-3 py-1.5 text-sm font-semibold transition ' +
        (active ? 'bg-brand-500 text-white' : 'bg-surface text-accent hover:bg-brand-50')
      }
    >
      {children}
    </button>
  )
}

const stepBtn =
  'grid size-10 shrink-0 place-items-center rounded-lg text-white transition hover:scale-105 active:scale-95'

export function MenuCard({ item, onOpen }: { item: MenuItem; onOpen: (item: MenuItem) => void }) {
  const [sizeId, setSizeId] = useState(item.sizes?.[0].id)
  const [part, setPart] = useState<ChickenPart | undefined>(item.chickenChoice ? 'ورك' : undefined)

  const add = useCart((s) => s.add)
  const increment = useCart((s) => s.increment)
  const decrement = useCart((s) => s.decrement)
  const remove = useCart((s) => s.remove)

  const key = lineKey(item.id, sizeId, part)
  const inCart = useCart((s) => s.lines.find((l) => l.key === key))

  const price = unitPrice(item, sizeId, part)
  const oldPrice = item.oldPrice !== undefined ? item.oldPrice + (part === 'صدر' ? BREAST_SURCHARGE : 0) : undefined

  return (
    <article className="pop-in flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg">
      <button type="button" onClick={() => onOpen(item)} aria-label={`تفاصيل ${item.name}`} className="block cursor-zoom-in">
        <FoodImage
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          width={600}
          height={450}
          className="h-56 w-full bg-brand-50/60 object-contain p-2"
        />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-xl font-bold">
          <button type="button" onClick={() => onOpen(item)} className="text-start hover:text-accent">
            {item.name}
          </button>
        </h3>
        {item.description && <p className="text-sm leading-relaxed text-muted">{item.description}</p>}

        {item.sizes && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="الحجم">
            {item.sizes.map((s) => (
              <Choice key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                {s.name}
              </Choice>
            ))}
          </div>
        )}

        {item.chickenChoice && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="الجزء">
            <Choice active={part === 'ورك'} onClick={() => setPart('ورك')}>
              ورك
            </Choice>
            <Choice active={part === 'صدر'} onClick={() => setPart('صدر')}>
              صدر (+{BREAST_SURCHARGE} جنيه)
            </Choice>
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-3 pt-1">
          {oldPrice !== undefined ? (
            <>
              <span className="text-lg text-faint line-through">{oldPrice} جنيه</span>
              <span className="text-2xl font-extrabold text-good">{price} جنيه</span>
            </>
          ) : (
            <span className="text-2xl font-extrabold text-accent">{price} جنيه</span>
          )}
        </div>

        {item.soldOut ? (
          <p className="rounded-xl bg-sunken py-3 text-center font-bold text-muted">خلصت النهارده، جرّب صنف تاني 🙏</p>
        ) : inCart ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="تقليل الكمية"
              onClick={() => decrement(key)}
              className={stepBtn + ' bg-brand-500'}
            >
              <FaMinus aria-hidden />
            </button>
            <div className="flex-1 rounded-lg bg-sunken py-1.5 text-center text-xl font-bold" aria-live="polite">
              {inCart.quantity}
            </div>
            <button
              type="button"
              aria-label="زيادة الكمية"
              onClick={() => increment(key)}
              className={stepBtn + ' bg-brand-500'}
            >
              <FaPlus aria-hidden />
            </button>
            <button type="button" aria-label="حذف من السلة" onClick={() => remove(key)} className={stepBtn + ' bg-red-600'}>
              <FaTrash aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => add({ itemId: item.id, sizeId, part })}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-brand-400 py-3 font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
          >
            <FaCartPlus aria-hidden /> أضف للسلة
          </button>
        )}
      </div>
    </article>
  )
}
