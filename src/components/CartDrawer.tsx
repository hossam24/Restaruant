import { FaArrowRotateLeft, FaCartShopping, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6'
import { inCategory, useMenu } from '../data/menuStore'
import { formatTime } from '../lib/hours'
import { cartSubtotal, orderTotals, resolveLines, unitPrice, type ResolvedLine, type SentOrder, type Totals } from '../lib/pricing'
import { useModal } from '../lib/useModal'
import { useOpenStatus } from '../lib/useOpenStatus'
import { useCart } from '../store/cartStore'
import { CheckoutForm } from './CheckoutForm'

interface Props {
  open: boolean
  lines: ResolvedLine[]
  onClose: () => void
  onSent: (order: SentOrder) => void
}

function TotalsView({ t }: { t: Totals }) {
  if (t.deliveryFee === null) {
    return (
      <p className="my-5 text-center text-xl font-extrabold leading-relaxed text-accent">
        الإجمالي : {t.total} جنيه غير شامل التوصيل
      </p>
    )
  }
  return (
    <div className="my-5 flex flex-col gap-1.5 rounded-xl bg-brand-50 p-4 font-semibold">
      <div className="flex justify-between">
        <span>المجموع الفرعي</span>
        <span>{t.subtotal} جنيه</span>
      </div>
      <div className="flex justify-between">
        <span>التوصيل</span>
        <span className={t.freeDelivery ? 'text-good' : ''}>{t.freeDelivery ? 'مجاني' : `${t.deliveryFee} جنيه`}</span>
      </div>
      <div className="flex justify-between border-t border-brand-100 pt-2 text-xl font-extrabold text-accent">
        <span>الإجمالي</span>
        <span>{t.total} جنيه</span>
      </div>
      {t.remainingForFree !== null && (
        <p className="mt-1 text-center text-sm font-bold text-good">
          زوّد {t.remainingForFree} جنيه وتوصيلك يبقى مجاني 🎉
        </p>
      )}
    </div>
  )
}

function ClosedNotice() {
  const status = useOpenStatus()
  if (!status || status.open) return null
  return (
    <p className="mb-4 rounded-xl bg-warn-bg p-3 text-center font-semibold text-warn ring-1 ring-warn-line">
      احنا مقفولين دلوقتي وبنفتح {formatTime(status.changesAt)}. ابعت طلبك عادي وهنرد عليك أول ما نفتح.
    </p>
  )
}

export function CartDrawer({ open, lines, onClose, onSent }: Props) {
  useModal(open, onClose)
  const { increment, decrement, remove, clear, add, reorder } = useCart.getState()
  const lastOrder = useCart((s) => s.lastOrder)
  const menu = useMenu((s) => s.items)
  const delivery = useMenu((s) => s.settings.delivery)

  if (!open) return null

  const totals = orderTotals(cartSubtotal(lines), delivery)
  const previous = resolveLines(lastOrder)
  const suggestions = inCategory(menu, 'edafat')
    .filter((i) => !i.soldOut && !lines.some((l) => l.itemId === i.id))
    .slice(0, 4)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="pop-in max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 sm:max-w-lg sm:rounded-3xl sm:p-7"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="cart-title" className="text-2xl font-extrabold">
            سلة الطلبات
          </h2>
          <button type="button" aria-label="إغلاق" onClick={onClose} className="grid size-10 place-items-center rounded-full text-xl hover:bg-sunken">
            <FaXmark aria-hidden />
          </button>
        </div>

        <ClosedNotice />

        {lines.length === 0 ? (
          <div className="py-8 text-center text-muted">
            <FaCartShopping aria-hidden className="mx-auto mb-4 text-5xl text-faint" />
            <p className="text-lg font-bold">السلة فاضية، اختار حاجة حلوة من المنيو</p>
            {previous.length > 0 && (
              <button
                type="button"
                onClick={reorder}
                className="mx-auto mt-5 flex items-center gap-2 rounded-full border-2 border-brand-500 px-5 py-2.5 font-bold text-accent transition hover:bg-brand-50"
              >
                <FaArrowRotateLeft aria-hidden /> اطلب نفس آخر طلب ({previous.length} صنف)
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <li key={l.key} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <strong className="block">{l.name}</strong>
                    {l.note && <span className="block text-sm text-accent">📝 {l.note}</span>}
                    <span className="text-sm text-muted">{l.unitPrice} جنيه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="تقليل الكمية"
                      disabled={l.quantity <= 1}
                      onClick={() => decrement(l.key)}
                      className="size-8 rounded-full bg-brand-400 font-bold text-white disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="min-w-7 text-center font-bold">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="زيادة الكمية"
                      onClick={() => increment(l.key)}
                      className="size-8 rounded-full bg-brand-400 font-bold text-white"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label={`حذف ${l.name}`}
                      onClick={() => remove(l.key)}
                      className="grid size-8 place-items-center rounded-md bg-red-600 text-white"
                    >
                      <FaTrash aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-end">
              <button type="button" onClick={clear} className="text-sm text-muted underline hover:text-bad">
                تفريغ السلة
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-bold">تحب تضيف حاجة معاه؟</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => add({ itemId: s.id })}
                      className="flex items-center gap-1.5 rounded-full border-2 border-brand-100 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-accent transition hover:border-brand-400"
                    >
                      <FaPlus aria-hidden className="text-xs" /> {s.name} · {unitPrice(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <TotalsView t={totals} />

        <CheckoutForm lines={lines} totals={totals} onSent={onSent} />
      </div>
    </div>
  )
}
