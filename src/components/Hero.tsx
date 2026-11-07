import { RESTAURANT } from '../config'
import { formatTime } from '../lib/hours'
import { useOpenStatus } from '../lib/useOpenStatus'

function StatusPill() {
  const status = useOpenStatus()
  if (!status) return null
  return (
    <p
      className={
        'mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-base font-bold ' +
        (status.open ? 'bg-surface text-good' : 'bg-black/25 text-white')
      }
    >
      <span aria-hidden className={'size-2.5 rounded-full ' + (status.open ? 'bg-green-600' : 'bg-amber-300')} />
      {status.open
        ? `فاتحين دلوقتي · لحد ${formatTime(status.changesAt)}`
        : `قافلين دلوقتي · بنفتح ${formatTime(status.changesAt)}`}
    </p>
  )
}

export function Hero() {
  return (
    <section id="top" className="bg-gradient-to-l from-brand-500 to-brand-400 px-4 pb-12 pt-10 text-center text-white">
      <h1 className="text-balance text-3xl font-extrabold sm:text-5xl">أهلاً بيك في {RESTAURANT.name}</h1>
      {RESTAURANT.tagline && <p className="mt-4 text-xl font-semibold sm:text-2xl">{RESTAURANT.tagline}</p>}
      {RESTAURANT.description && (
        <p className="mx-auto mt-3 max-w-xl text-balance text-lg text-white/90">{RESTAURANT.description}</p>
      )}
      <StatusPill />
    </section>
  )
}
