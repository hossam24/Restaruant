import { useEffect, useState } from 'react'

export function OfflineNotice() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (online) return null
  return (
    <p role="status" className="bg-warn-bg px-4 py-2 text-center font-semibold text-warn">
      مفيش إنترنت دلوقتي. تقدر تتصفح المنيو، بس إرسال الطلب محتاج إنترنت.
    </p>
  )
}
