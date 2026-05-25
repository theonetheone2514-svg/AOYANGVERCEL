'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    Promise.all([loadStores(), loadZones()])
  }, [])

  async function loadStores() {
    setLoadingStores(true)
    const { data } = await supabase.from('stores').select('*').order('name')
    if (data) setStores(data)
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

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
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

    setCart(new Map())
    setShowCart(false)
    setOrdering(false)
    alert('✅ สั่งออเดอร์สำเร็จ! รอร้านค้ายืนยัน')
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#FFF8E7] pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#9C4A35] to-[#E65100] text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍜</span>
            <div>
              <h1 className="text-2xl font-bold">เอาหยังบ่</h1>
              <p className="text-xs opacity-90">สั่งอาหารง่าย ๆ แถวบ้าน</p>
            </div>
          </div>
          <UserMenu />
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาร้านหรือเมนู..."
        />
      </header>

      <main className="flex-1 px-4 space-y-4 -mt-3">
        {/* Map */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden h-56 border border-gray-100">
          <MapView
            zones={zones}
            selectedLocation={selectedLocation}
            onClick={handleMapClick}
          />
        </section>

        {/* Selected location */}
        {selectedLocation && (
          <div className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 flex items-center gap-2 text-sm">
            <span className="text-lg">📍</span>
            <div className="text-[#3E2723]">
              <span className="font-medium">{DEFAULT_LOCATION.address}</span>
              <span className="text-gray-400 ml-2">
                ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
              </span>
            </div>
          </div>
        )}

        {/* Stores */}
        <section>
          <h2 className="text-lg font-bold text-[#3E2723] mb-3 flex items-center gap-2">
            <span>🏪</span> ร้านค้า
            {!loadingStores && (
              <span className="text-sm font-normal text-gray-500">({filteredStores.length} ร้าน)</span>
            )}
          </h2>
          {loadingStores ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <StoreCardSkeleton key={i} />)}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              <p className="text-lg mb-1">😕</p>
              <p>ไม่พบร้านค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  selected={selectedStore?.id === store.id}
                  onSelect={selectStore}
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
                <span>📋</span> เมนู {selectedStore.name}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-sm text-gray-500 hover:text-[#E65100] transition px-3 py-1 rounded-full hover:bg-orange-50"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    category === cat
                      ? 'bg-[#E65100] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#E65100] hover:text-[#E65100]'
                  }`}
                >
                  {cat === 'ทั้งหมด' ? '🍽️ ทั้งหมด' : cat}
                </button>
              ))}
            </div>

            {loadingMenu ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <MenuItemSkeleton key={i} />)}
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p className="text-lg mb-1">😕</p>
                <p>ไม่พบเมนู</p>
                {search && <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(groupedMenu.entries()).map(([cat, items]) => (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">{cat}</h3>
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
          className="fixed bottom-20 right-4 bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 z-40 hover:shadow-xl transition active:scale-95"
        >
          <span className="bg-white text-[#E65100] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
          <span className="font-semibold">{cartTotal.toLocaleString()} บาท</span>
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
        />
      )}
    </div>
  )
}
