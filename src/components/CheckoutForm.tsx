import { useState, type FormEvent } from 'react'
import { FaMotorcycle, FaWhatsapp } from 'react-icons/fa6'
import type { ResolvedLine, SentOrder, Totals } from '../lib/pricing'
import { saveOrderToSheet } from '../lib/sheets'
import { validateOrder, type FormErrors, type OrderForm } from '../lib/validation'
import { buildOrderMessage, whatsappUrl } from '../lib/whatsapp'
import { useCart } from '../store/cartStore'
import { useCustomer } from '../store/customerStore'

const ORDER: (keyof OrderForm)[] = ['address', 'name', 'phone', 'additionalPhone']

interface Props {
  lines: ResolvedLine[]
  totals: Totals
  onSent: (order: SentOrder) => void
}

const inputCls = (invalid: boolean) =>
  'w-full rounded-lg border-2 bg-surface px-3 py-2.5 text-base transition focus:border-brand-400 focus:outline-none ' +
  (invalid ? 'border-red-500' : 'border-line-strong')

function Field(props: {
  id: keyof OrderForm
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="font-bold">
        {props.label}
        {props.required && <span className="me-1 text-bad">*</span>}
      </label>
      {props.children}
      {props.error && (
        <p id={`${props.id}-error`} role="alert" className="text-sm font-semibold text-bad">
          {props.error}
        </p>
      )}
    </div>
  )
}

export function CheckoutForm({ lines, totals, onSent }: Props) {
  const saved = useCustomer()
  const complete = useCart((s) => s.complete)
  const [form, setForm] = useState<OrderForm>({
    name: saved.name,
    phone: saved.phone,
    additionalPhone: saved.additionalPhone,
    address: saved.address,
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const hasSaved = !!(saved.name || saved.phone || saved.address)

  const set = (key: keyof OrderForm) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const props = (key: keyof OrderForm) => ({
    id: key,
    value: form[key],
    onChange: set(key),
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
    className: inputCls(!!errors[key]),
  })

  const soldOut = lines.filter((l) => l.item.soldOut)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (lines.length === 0 || soldOut.length > 0) return
    const found = validateOrder(form)
    setErrors(found)
    const first = ORDER.find((k) => found[k])
    if (first) {
      document.getElementById(first)?.focus()
      return
    }
    const url = whatsappUrl(buildOrderMessage(lines, form, totals))
    saveOrderToSheet(lines, form)
    window.open(url, '_blank')
    saved.remember(form)
    complete()
    setForm((f) => ({ ...f, notes: '' }))
    onSent({ url, name: form.name.trim(), lines, totals })
  }

  function forget() {
    saved.forget()
    setForm({ name: '', phone: '', additionalPhone: '', address: '', notes: form.notes })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4 rounded-xl bg-soft p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <FaMotorcycle aria-hidden className="text-accent" /> تفاصيل التوصيل
      </h3>

      <Field id="address" label="العنوان" required error={errors.address}>
        <textarea {...props('address')} rows={3} autoComplete="street-address" placeholder="أدخل عنوان التوصيل بالتفصيل..." />
      </Field>
      <Field id="name" label="الاسم" required error={errors.name}>
        <input {...props('name')} type="text" autoComplete="name" placeholder="أدخل اسمك" />
      </Field>
      <Field id="phone" label="رقم الهاتف" required error={errors.phone}>
        <input {...props('phone')} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={inputCls(!!errors.phone) + ' text-end'} placeholder="مثال: 01234567890" />
      </Field>
      <Field id="additionalPhone" label="رقم هاتف إضافي (اختياري)" error={errors.additionalPhone}>
        <input {...props('additionalPhone')} type="tel" inputMode="tel" dir="ltr" className={inputCls(!!errors.additionalPhone) + ' text-end'} placeholder="مثال: 01234567890" />
      </Field>
      <Field id="notes" label="ملاحظات إضافية (اختياري)">
        <textarea {...props('notes')} rows={2} placeholder="أي ملاحظات خاصة بالطلب..." />
      </Field>

      {soldOut.length > 0 && (
        <p role="alert" className="rounded-lg bg-warn-bg p-3 text-center font-semibold text-warn ring-1 ring-warn-line">
          للأسف {soldOut.map((l) => l.item.name).join('، ')} خلصت النهارده. شيلها من السلة وكمّل طلبك.
        </p>
      )}

      <button
        type="submit"
        disabled={lines.length === 0 || soldOut.length > 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-wa py-3.5 text-lg font-bold text-white transition hover:bg-wa-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaWhatsapp aria-hidden className="text-2xl" /> إرسال الطلب عبر واتساب
      </button>

      <p className="text-center text-sm text-muted">
        بياناتك بتتحفظ على جهازك بس، عشان طلبك الجاي يبقى أسرع.
        {hasSaved && (
          <>
            {' '}
            <button type="button" onClick={forget} className="underline hover:text-bad">
              امسح بياناتي
            </button>
          </>
        )}
      </p>
    </form>
  )
}
