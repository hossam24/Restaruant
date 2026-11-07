const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'

export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
}

const EGYPT_MOBILE = /^01[0125]\d{8}$/
const PHONE_HINT = 'رقم الهاتف غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015'

export interface OrderForm {
  name: string
  phone: string
  additionalPhone: string
  address: string
  notes: string
}

export type FormErrors = Partial<Record<keyof OrderForm, string>>

export function validateOrder(form: OrderForm): FormErrors {
  const errors: FormErrors = {}
  if (!form.address.trim()) errors.address = 'من فضلك أدخل عنوان التوصيل!'
  if (!form.name.trim()) errors.name = 'من فضلك أدخل الاسم!'

  const phone = normalizeDigits(form.phone.trim())
  if (!phone) errors.phone = 'من فضلك أدخل رقم الهاتف!'
  else if (!EGYPT_MOBILE.test(phone)) errors.phone = PHONE_HINT

  const extra = normalizeDigits(form.additionalPhone.trim())
  if (extra && !EGYPT_MOBILE.test(extra)) {
    errors.additionalPhone = 'رقم الهاتف الإضافي غير صحيح! يجب أن يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015'
  }
  return errors
}
