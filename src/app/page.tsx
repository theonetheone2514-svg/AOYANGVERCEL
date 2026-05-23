'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Store, MenuItem, Zone } from '@/lib/types'
import UserMenu from '@/components/UserMenu'

const MapView = dynamic(() => import('@/components/Map'), { ssr: false })

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<Map<string, { item: MenuItem; qty: number }>>(new Map())
  const [showCart, setShowCart] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    loadStores()
    loadZones()
  }, [])

  async function loadStores() {
    const { data } = await supabase.from('stores').select('*').order('name')
    if (data) setStores(data)
  }

  async function loadZones() {
    const { data } = await supabase.from('zones').select('*')
    if (data) setZones(data)
  }

  async function selectStore(store: Store) {
    setSelectedStore(store)
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('store_id', store.id)
      .order('name')
    if (data) setMenu(data)
  }

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(item.id)
      if (existing) {
        next.set(item.id, { ...existing, qty: existing.qty + 1 })
      } else {
        next.set(item.id, { item, qty: 1 })
      }
      return next
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(itemId)
      if (existing && existing.qty > 1) {
        next.set(itemId, { ...existing, qty: existing.qty - 1 })
      } else {
        next.delete(itemId)
      }
      return next
    })
  }

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, { item, qty }) => sum + item.price * qty,
    0
  )
  const cartCount = Array.from(cart.values()).reduce((sum, { qty }) => sum + qty, 0)

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
  }, [])

  return (
    <div className="flex flex-col min-h-dvh bg-[#FFF8E7] pb-20">
      {/* Header */}
      <header className="bg-[#9C4A35] text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">เอาหยังบ่</h1>
          <p className="text-sm opacity-90">สั่งอาหารง่าย ๆ แถวบ้าน</p>
        </div>
        <UserMenu />
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Map */}
        <section className="bg-white rounded-lg shadow h-48 overflow-hidden">
          <MapView
            zones={zones}
            selectedLocation={selectedLocation}
            onClick={handleMapClick}
          />
        </section>

        {/* Store list */}
        <section>
          <h2 className="text-lg font-semibold text-[#3E2723] mb-2">ร้านค้า</h2>
          <div className="space-y-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => selectStore(store)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedStore?.id === store.id
                    ? 'border-[#E65100] bg-orange-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3E2723]">{store.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      store.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {store.status === 'open' ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                {store.wait_time && (
                  <span className="text-xs text-gray-500">รอ ~{store.wait_time} นาที</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Menu */}
        {selectedStore && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-[#3E2723]">
                เมนู {selectedStore.name}
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className="text-sm text-gray-500 underline"
              >
                ปิด
              </button>
            </div>
            <div className="space-y-2">
              {menu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-[#3E2723]">{item.name}</div>
                    <div className="text-sm text-[#E65100] font-semibold">
                      {item.price} บาท
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-[#E65100] text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    เพิ่ม
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Selected location info */}
        {selectedLocation && (
          <section className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-[#3E2723]">
              📍 พิกัด: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </p>
          </section>
        )}
      </main>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-4 bg-[#E65100] text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 z-50"
        >
          <span className="bg-white text-[#E65100] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
          <span className="font-semibold">{cartTotal} บาท</span>
        </button>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ตะกร้า</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-500">ปิด</button>
            </div>
            {Array.from(cart.values()).map(({ item, qty }) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.price} บาท</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-medium">{qty}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-7 h-7 rounded-full border flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="w-16 text-right font-semibold">
                    {item.price * qty} บาท
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-4 pt-2 border-t font-bold text-lg">
              <span>รวม</span>
              <span>{cartTotal} บาท</span>
            </div>
            <button
              onClick={() => {
                if (!user) { router.push('/auth/login?redirect=/'); return }
                alert('สั่งออเดอร์แล้ว!')
              }}
              className="w-full mt-4 bg-[#E65100] text-white rounded-lg py-3 font-semibold"
            >
              {user ? 'สั่งเลย' : 'เข้าสู่ระบบก่อนสั่ง'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
