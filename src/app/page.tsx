'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Store, MenuItem, Zone } from '@/lib/types'
import UserMenu from '@/components/UserMenu'
import SearchBar from '@/components/SearchBar'
import StoreCard from '@/components/StoreCard'
import MenuItemCard from '@/components/MenuItemCard'
import CartPanel from '@/components/CartPanel'
import { StoreCardSkeleton, MenuItemSkeleton } from '@/components/Skeleton'
import { DEFAULT_LOCATION } from '@/lib/utils'
import { getIsanGreeting } from '@/lib/greeting'
import { MapPin, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const MapView = dynamic(() => import('@/components/Map'), { ssr: false })

const allCategories = ['ทั้งหมด', 'ข้าว', 'ก๋วยเตี๋ยว', 'ส้มตำ', 'ลาบ', 'ย่าง', 'น้ำตก', 'ต้ม', 'ซุป', 'ของทอด', 'เครื่องดื่ม']

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [cart, setCart] = useState<Map<string, { item: MenuItem; qty: number }>>(new Map())
  const [showCart, setShowCart] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [storeRatings, setStoreRatings] = useState<Record<string, { average: number; count: number }>>({})
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [ordering, setOrdering] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [customerPoints, setCustomerPoints] = useState(0)
  const prevCount = useRef(0)
  const [bounce, setBounce] = useState(false)
  const greeting = getIsanGreeting()

  useEffect(() => {
    Promise.all([loadStores(), loadZones()])
  }, [])

  // Load saved location + points for logged-in user
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data: cust } = await supabase
        .from('customers')
        .select('id, points')
        .eq('phone', user.phone)
        .maybeSingle()
      if (!cust) return
      setCustomerPoints(cust.points || 0)
      const { data: loc } = await supabase
        .from('customer_locations')
        .select('lat, lng')
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (loc) {
        setSelectedLocation({ lat: loc.lat!, lng: loc.lng! })
      }
    })()
  }, [user])

  async function loadStores() {
    setLoadingStores(true)
    const { data } = await supabase.from('stores').select('*').order('name')
    if (data) setStores(data)

    // Fetch ratings for all stores
    const { data: allRatings } = await supabase.from('ratings').select('store_id, rating')
    if (allRatings) {
      const map: Record<string, { total: number; count: number }> = {}
      for (const r of allRatings) {
        if (!map[r.store_id]) map[r.store_id] = { total: 0, count: 0 }
        map[r.store_id].total += r.rating
        map[r.store_id].count += 1
      }
      const avgMap: Record<string, { average: number; count: number }> = {}
      for (const [id, v] of Object.entries(map)) {
        avgMap[id] = { average: Math.round((v.total / v.count) * 10) / 10, count: v.count }
      }
      setStoreRatings(avgMap)
    }

    setLoadingStores(false)
  }

  async function loadZones() {
    const { data } = await supabase.from('zones').select('*')
    if (data) setZones(data)
  }

  async function selectStore(store: Store) {
    setSelectedStore(store)
    setCategory('ทั้งหมด')
    setLoadingMenu(true)
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('store_id', store.id)
      .order('name')
    if (data) setMenu(data)
    setLoadingMenu(false)
  }

  function updateCart(item: MenuItem, delta: number) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(item.id)
      if (existing) {
        const newQty = existing.qty + delta
        if (newQty <= 0) {
          next.delete(item.id)
        } else {
          next.set(item.id, { ...existing, qty: newQty })
        }
      } else if (delta > 0) {
        next.set(item.id, { item, qty: 1 })
      }
      return next
    })
  }

  const cartTotal = useMemo(
    () => Array.from(cart.values()).reduce((sum, { item, qty }) => sum + Number(item.price) * qty, 0),
    [cart]
  )
  const cartCount = useMemo(
    () => Array.from(cart.values()).reduce((sum, { qty }) => sum + qty, 0),
    [cart]
  )

  useEffect(() => {
    if (cartCount > prevCount.current && prevCount.current > 0) {
      setBounce(true)
      setTimeout(() => setBounce(false), 400)
    }
    prevCount.current = cartCount
  }, [cartCount])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShowMap(false)
  }, [])

  const filteredStores = useMemo(() => {
    if (!search) return stores
    const q = search.toLowerCase()
    return stores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    )
  }, [stores, search])

  const filteredMenu = useMemo(() => {
    let items = menu
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((m) => m.name.toLowerCase().includes(q))
    }
    if (category !== 'ทั้งหมด') {
      items = items.filter((m) => m.category === category)
    }
    return items
  }, [menu, search, category])

  const groupedMenu = useMemo(() => {
    const groups = new Map<string, MenuItem[]>()
    for (const item of filteredMenu) {
      const cat = item.category || 'อื่นๆ'
      if (!groups.has(cat)) groups.set(cat, [])
      groups.get(cat)!.push(item)
    }
    return groups
  }, [filteredMenu])

  async function handleCheckout(paymentMethod: 'cash' | 'transfer') {
    if (!user) {
      router.push('/auth/login?redirect=/')
      return
    }
    if (!selectedLocation) {
      alert('กรุณาเลือกพิกัดจัดส่งบนแผนที่')
      return
    }
    if (!selectedStore) return

    setOrdering(true)

    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', user.phone)
      .single()
    if (!customer) {
      const { data: newCust } = await supabase
        .from('customers')
        .insert({ phone: user.phone })
        .select()
        .single()
      customer = newCust
    }
    if (!customer) {
      alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้')
      setOrdering(false)
      return
    }

    const items = Array.from(cart.values()).map(({ item, qty }) => ({
      menu_id: item.id,
      name: item.name,
      price: item.price,
      qty,
    }))
    const total = cartTotal + 10

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        store_id: selectedStore.id,
        total,
        delivery_fee: 10,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        address: DEFAULT_LOCATION.address,
        payment_method: paymentMethod,
        status: 'รอดำเนินการ',
      })
      .select()
      .single()

    if (error || !order) {
      alert('สั่งออเดอร์ไม่สำเร็จ: ' + (error?.message || ''))
      setOrdering(false)
      return
    }

    await supabase.from('order_items').insert(
      items.map((i) => ({ ...i, order_id: order.id }))
    )

    // Save location for next time
    await supabase.from('customer_locations').upsert({
      customer_id: customer.id,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: DEFAULT_LOCATION.address,
    }).maybeSingle()

    setCart(new Map())
    setShowCart(false)
    setOrdering(false)
    alert('✅ สั่งออเดอร์สำเร็จ! รอร้านค้ายืนยัน')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#FFF8E7] pb-24">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-[#BF360C] via-[#E65100] to-[#F57C00] text-white px-4 pt-4 pb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/20 rounded-full" />
          <div className="absolute top-12 left-1/2 w-16 h-16 bg-white/10 rounded-full" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="เอาหยังบ่" className="h-12 w-12 drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold drop-shadow-sm">เอาหยังบ่</h1>
                <p className="text-xs opacity-90">สั่งอาหารง่าย ๆ แถวบ้าน</p>
              </div>
            </div>
            <UserMenu />
          </div>
          <div className="text-center my-4">
            <p className="text-base font-bold drop-shadow-sm">{greeting.header}</p>
            <p className="text-sm text-orange-100 mt-1">{greeting.sub}</p>
          </div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="ค้นหาเมนูเด็ด..."
          />
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4 -mt-6 relative z-20">
        {/* Map toggle */}
        <button
          onClick={() => setShowMap(!showMap)}
          className={`w-full rounded-2xl border px-4 py-3 flex items-center justify-between transition hover:shadow-md ${
            selectedLocation
              ? 'bg-white shadow-sm border-gray-100'
              : 'bg-orange-50 border-orange-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            <MapPin className={`w-4 h-4 ${selectedLocation ? 'text-[#E65100]' : 'text-orange-500'}`} />
            <span className={selectedLocation ? 'text-gray-600' : 'text-orange-700 font-medium'}>
              {selectedLocation ? `📍 ${DEFAULT_LOCATION.address}` : '📍 เลือกพิกัดจัดส่ง'}
            </span>
          </div>
          {showMap ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showMap && (
          <>
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden h-48 border border-gray-100">
              <MapView
                zones={zones}
                selectedLocation={selectedLocation}
                onClick={handleMapClick}
              />
            </section>
            {selectedLocation && (
              <div className="bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100 flex items-center gap-2 text-sm">
                <span className="text-lg">📍</span>
                <span className="text-gray-600 text-xs">
                  ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
                </span>
              </div>
            )}
          </>
        )}

        {/* Stores */}
        <section>
          <h2 className="text-lg font-bold text-[#3E2723] mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm">🏪</span>
            ร้านค้าใกล้คุณ
            {!loadingStores && (
              <span className="text-sm font-normal text-gray-400">({filteredStores.length})</span>
            )}
          </h2>
          {loadingStores ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <StoreCardSkeleton key={i} />)}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
              <p className="text-4xl mb-2">😕</p>
              <p className="font-medium">ไม่พบร้านค้า</p>
              {search && <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={selectedStore?.id === store.id}
                  onSelect={selectStore}
                  rating={storeRatings[store.id]?.average}
                  ratingCount={storeRatings[store.id]?.count}
                />
              ))}
            </div>
          )}
        </section>

        {/* Menu */}
        {selectedStore && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#3E2723] flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-sm">📋</span>
                เมนู {selectedStore.name}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-sm text-gray-400 hover:text-[#E65100] transition px-3 py-1.5 rounded-full hover:bg-orange-50"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Category pills */}
            <div className="relative mb-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                      category === cat
                        ? 'bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white shadow-md shadow-orange-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E65100] hover:text-[#E65100] hover:shadow-sm'
                    }`}
                  >
                    {cat === 'ทั้งหมด' ? '🍽️ ทั้งหมด' : cat}
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FFF8E7] to-transparent pointer-events-none" />
            </div>

            {loadingMenu ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <MenuItemSkeleton key={i} />)}
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
                <p className="text-4xl mb-2">😕</p>
                <p className="font-medium">ไม่พบเมนู</p>
                {search && <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(groupedMenu.entries()).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1 flex items-center gap-1.5">
                      <span className="w-1 h-4 rounded-full bg-[#E65100]" />
                      {cat}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          qty={cart.get(item.id)?.qty || 0}
                          onAdd={(i) => updateCart(i, 1)}
                          onRemove={(id) => updateCart(cart.get(id)!.item, -1)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className={`fixed bottom-20 right-4 bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white rounded-full px-5 py-3.5 shadow-lg flex items-center gap-2.5 z-40 hover:shadow-xl transition active:scale-95 ${bounce ? 'animate-bounce' : ''}`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-white text-[#E65100] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {cartCount}
            </span>
          </div>
          <span className="font-bold">{cartTotal.toLocaleString()} ฿</span>
        </button>
      )}

      {/* Cart panel */}
      {showCart && (
        <CartPanel
          items={cart}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
          onUpdateQty={(item, delta) => updateCart(item, delta)}
          isLoggedIn={!!user}
          customerPoints={customerPoints}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-4 py-6 mt-6">
        <div className="text-center text-xs text-gray-400 space-y-1.5">
          <p className="text-sm font-medium text-gray-600">🍜 เอาหยังบ่</p>
          <p>📍 บ้านสูงเนิน สกลนคร</p>
          <p>📞 092-989-2085</p>
          <Link href="/about" className="inline-block mt-2 text-[#E65100] font-medium hover:underline">
            📍 เกี่ยวกับเรา
          </Link>
        </div>
      </footer>
    </div>
  )
}
