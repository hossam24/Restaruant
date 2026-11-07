import { FaCircleInfo, FaFacebookF, FaInstagram, FaPhone, FaPhoneVolume, FaShareNodes, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { RESTAURANT } from '../config'

const social = 'grid size-11 place-items-center rounded-full bg-white/20 text-xl text-white transition hover:-translate-y-1 hover:bg-surface hover:text-accent'
const heading = 'mb-4 flex items-center gap-2 text-2xl font-bold'

export function Footer() {
  const { phones, whatsapp, address, socials } = RESTAURANT
  const waLink = `https://wa.me/${whatsapp}`
  const links = [
    { href: socials.facebook, label: 'Facebook', icon: <FaFacebookF aria-hidden /> },
    { href: socials.instagram, label: 'Instagram', icon: <FaInstagram aria-hidden /> },
    { href: whatsapp ? waLink : '', label: 'WhatsApp', icon: <FaWhatsapp aria-hidden /> },
    { href: socials.tiktok, label: 'TikTok', icon: <FaTiktok aria-hidden /> },
  ].filter((l) => l.href)
  const hasContact = phones.length > 0 || whatsapp !== ''

  return (
    <footer className="mt-12 bg-gradient-to-l from-brand-500 to-brand-400 text-white">
      {(hasContact || address || links.length > 0) && (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          {hasContact && (
            <section>
              <h2 className={heading}>
                <FaPhoneVolume aria-hidden /> للطلب والاستفسار
              </h2>
              <ul className="flex flex-col gap-3 text-lg">
                {phones.map((p) => (
                  <li key={p.href} className="flex items-center gap-3">
                    <FaPhone aria-hidden />
                    <a href={p.href} dir="ltr" className="hover:underline">
                      {p.label}
                    </a>
                  </li>
                ))}
                {whatsapp && (
                  <li className="flex items-center gap-3">
                    <FaWhatsapp aria-hidden />
                    <a href={waLink} className="hover:underline">
                      <span dir="ltr">{whatsapp}</span> (واتساب)
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {address && (
            <section>
              <h2 className={heading}>
                <FaCircleInfo aria-hidden /> العنوان
              </h2>
              <p className="text-lg leading-loose">{address}</p>
            </section>
          )}

          {links.length > 0 && (
            <section>
              <h2 className={heading}>
                <FaShareNodes aria-hidden /> تابعنا على
              </h2>
              <p className="mb-4 text-lg">كن على اطلاع دائم بأحدث العروض والأطباق الجديدة</p>
              <div className="flex gap-3">
                {links.map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noreferrer" title={l.label} aria-label={l.label} className={social}>
                    {l.icon}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="border-t border-white/20 py-5 text-center text-sm text-white/90">
        © {new Date().getFullYear()} {RESTAURANT.name}
      </div>
    </footer>
  )
}
