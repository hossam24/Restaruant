import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartDrawer } from './components/CartDrawer'
import { CategoryMenu, type CategoryFilter } from './components/CategoryMenu'
import { FloatingCartBar } from './components/FloatingCartBar'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { ItemSheet } from './components/ItemSheet'
import { MenuGrid } from './components/MenuGrid'
import { Navbar } from './components/Navbar'
import { OfflineNotice } from './components/OfflineNotice'
import { SearchBar } from './components/SearchBar'
import { SuccessDialog } from './components/SuccessDialog'
import { refreshMenu, useMenu } from './data/menuStore'
import type { MenuItem } from './data/types'
import { cartCount, cartSubtotal, resolveLines, type SentOrder } from './lib/pricing'
import type { SortMode } from './lib/search'
import { useCart } from './store/cartStore'

export default function App() {
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('default')
  const [cartOpen, setCartOpen] = useState(false)
  const [detail, setDetail] = useState<MenuItem | null>(null)
  const [sent, setSent] = useState<SentOrder | null>(null)

  const stored = useCart((s) => s.lines)
  const menu = useMenu((s) => s.items)
  const lines = useMemo(() => resolveLines(stored), [stored, menu])

  useEffect(() => {
    void refreshMenu()
    const onVisible = () => document.visibilityState === 'visible' && void refreshMenu()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const closeCart = useCallback(() => setCartOpen(false), [])
  const closeDetail = useCallback(() => setDetail(null), [])
  const closeDone = useCallback(() => setSent(null), [])

  function handleSent(order: SentOrder) {
    setCartOpen(false)
    setSent(order)
  }

  const count = cartCount(lines)
  const anyModalOpen = cartOpen || detail !== null || sent !== null
  const liveDetail = detail ? (menu.find((i) => i.id === detail.id) ?? detail) : null

  return (
    <>
      <OfflineNotice />
      <Navbar count={count} onOpenCart={() => setCartOpen(true)} />
      <Hero />
      <SearchBar query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
      <div className="mx-auto flex max-w-6xl flex-col px-4 md:flex-row md:gap-8">
        <CategoryMenu
          active={category}
          onChange={(c) => {
            setCategory(c)
            setQuery('')
          }}
        />
        <MenuGrid category={category} query={query} sort={sort} onOpen={setDetail} onClearSearch={() => setQuery('')} />
      </div>
      <Footer />
      {count > 0 && <div aria-hidden className="h-20 md:hidden" />}

      <FloatingCartBar count={count} subtotal={cartSubtotal(lines)} hidden={anyModalOpen} onOpen={() => setCartOpen(true)} />
      {liveDetail && <ItemSheet key={liveDetail.id} item={liveDetail} onClose={closeDetail} />}
      <CartDrawer open={cartOpen} lines={lines} onClose={closeCart} onSent={handleSent} />
      <SuccessDialog order={sent} onClose={closeDone} />
    </>
  )
}

