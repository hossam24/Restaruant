import { FaCircleCheck } from 'react-icons/fa6'
import { useMenu } from '../data/menuStore'
import type { SentOrder } from '../lib/pricing'
import { useModal } from '../lib/useModal'

interface Props {
  /** The order that was just sent, or null when the dialog is closed. */
  order: SentOrder | null
  onClose: () => void
}

export function SuccessDialog({ order, onClose }: Props) {
  useModal(order !== null, onClose)
  const estimate = useMenu((s) => s.settings.delivery.estimate)
  if (order === null) return null
  const { totals } = order
  const firstName = order.name.split(' ')[0]

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="done-title"
        className="pop-in max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface p-7 text-center shadow-2xl"
      >
        <FaCircleCheck aria-hidden className="mx-auto mb-3 text-6xl text-green-600" />
        <h2 id="done-title" className="text-2xl font-extrabold">
          تم إرسال طلبك بنجاح يا {firstName}!
        </h2>
        <p className="mt-2 text-muted">
          {estimate ? `هيوصلك ${estimate}. ` : ''}هنراجع الطلب ونكلمك لو احتجنا أي حاجة.
        </p>

        <ul className="mt-5 divide-y divide-line rounded-xl bg-soft px-4 text-start">
          {order.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 py-2.5">
              <span>
                {l.name} <span className="text-muted">×{l.quantity}</span>
                {l.note && <span className="block text-sm text-accent">📝 {l.note}</span>}
              </span>
              <span className="shrink-0 font-semibold">{l.total} جنيه</span>
            </li>
          ))}
          <li className="flex justify-between py-2.5 text-lg font-extrabold text-accent">
            <span>الإجمالي</span>
            <span>
              {totals.total} جنيه{totals.deliveryFee === null && ' + التوصيل'}
            </span>
          </li>
        </ul>

        <p className="mt-4 text-muted">
          لو واتساب ما اتفتحش معاك،{' '}
          <a href={order.url} target="_blank" rel="noreferrer" className="font-bold text-accent underline">
            اضغط هنا لإرسال الرسالة
          </a>
          .
        </p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-5 rounded-lg bg-gradient-to-l from-brand-500 to-brand-400 px-8 py-3 font-bold text-white transition hover:scale-105"
        >
          حسناً
        </button>
      </div>
    </div>
  )
}
