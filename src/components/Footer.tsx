import { FaCircleInfo, FaFacebookF, FaInstagram, FaPhone, FaPhoneVolume, FaShareNodes, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { RESTAURANT } from '../config'

const social = 'grid size-11 place-items-center rounded-full bg-white/20 text-xl text-white transition hover:-translate-y-1 hover:bg-surface hover:text-accent'
const heading = 'mb-4 flex items-center gap-2 text-2xl font-bold'

export function Footer() {
  const waLink = `https://wa.me/${RESTAURANT.whatsapp}`
  return (
    <>
      <footer className="mt-12 bg-gradient-to-l from-brand-500 to-brand-400 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <section>
            <h2 className={heading}>
              <FaPhoneVolume aria-hidden /> للطلب والاستفسار
            </h2>
            <ul className="flex flex-col gap-3 text-lg">
              {RESTAURANT.phones.map((p) => (
                <li key={p.href} className="flex items-center gap-3">
                  <FaPhone aria-hidden />
                  <a href={p.href} dir="ltr" className="hover:underline">
                    {p.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <FaWhatsapp aria-hidden />
                <a href={waLink} className="hover:underline">
                  <span dir="ltr">{RESTAURANT.whatsapp}</span> (واتساب)
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className={heading}>
              <FaCircleInfo aria-hidden /> العنوان
            </h2>
            <p className="text-lg leading-loose">{RESTAURANT.address}</p>
          </section>

          <section>
            <h2 className={heading}>
              <FaShareNodes aria-hidden /> تابعنا على
            </h2>
            <p className="mb-4 text-lg">كن على اطلاع دائم بأحدث العروض والأطباق الجديدة</p>
            <div className="flex gap-3">
              <a href={RESTAURANT.socials.facebook} target="_blank" rel="noreferrer" title="Facebook" aria-label="Facebook" className={social}>
                <FaFacebookF aria-hidden />
              </a>
              <a href={RESTAURANT.socials.instagram} target="_blank" rel="noreferrer" title="Instagram" aria-label="Instagram" className={social}>
                <FaInstagram aria-hidden />
              </a>
              <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp" aria-label="WhatsApp" className={social}>
                <FaWhatsapp aria-hidden />
              </a>
              <a href={RESTAURANT.socials.tiktok} target="_blank" rel="noreferrer" title="TikTok" aria-label="TikTok" className={social}>
                <FaTiktok aria-hidden />
              </a>
            </div>
          </section>
        </div>

        <div className="border-t border-white/20 py-5 text-center">
          <a href="https://alma2da.com/" target="_blank" rel="noreferrer" className="inline-block">
            <img src="/imgs/alma2da-logo.webp" alt="Alma2da" loading="lazy" className="h-[70px] w-auto" />
          </a>
        </div>
      </footer>

      <div className="bg-stone-900 px-4 py-4 text-center text-sm text-faint">
        <p>
          تم تصميم وتطوير الموقع بواسطة (<span className="font-bold text-white"> Tech-Track </span>)
        </p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-2">
          لطلب إنشاء موقعك الخاص:
          <a href="tel:+201062693832" dir="ltr" className="inline-flex items-center gap-1 font-bold text-sky-400 hover:opacity-80">
            <FaPhone aria-hidden /> 01062693832
          </a>
          |
          <a href="https://wa.me/201062693832" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-wa hover:opacity-80">
            <FaWhatsapp aria-hidden /> واتساب
          </a>
        </p>
      </div>
    </>
  )
}
