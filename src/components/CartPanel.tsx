'use client'

import { useEffect } from 'react'
import { X, Minus, Plus, ShoppingBag, Truck, ChevronRight } from 'lucide-react'
import type { MenuItem } from '@/lib/types'

interface CartItem {
  item: MenuItem
  qty: number
}

interface CartPanelProps {
  items: Map<string, CartItem>
  onClose: () => void
  onCheckout: () => void
  onUpdateQty: (item: MenuItem, delta: number) => void
  isLoggedIn: boolean
  deliveryFee?: number
}

export default function CartPanel({
  items,
  onClose,
  onCheckout,
  onUpdateQty,
  isLoggedIn,
  deliveryFee = 10,
}: CartPanelProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const cartArray = Array.from(items.values())
  const subtotal = cartArray.reduce((sum, { item, qty }) => sum + Number(item.price) * qty, 0)
  const total = subtotal + deliveryFee

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 bg-[#FFF8E7] shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-[#9C4A35] text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-lg font-bold">ตะกร้าสินค้า</h2>
            <span className="bg-white/20 text-sm px-2 py-0.5 rounded-full">
              {cartArray.reduce((s, { qty }) => s + qty, 0)} รายการ
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        {cartArray.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <ShoppingBag className="w-16 h-16" />
            <p className="text-lg">ตะกร้าว่างเปล่า</p>
            <p className="text-sm">เพิ่มเมนูที่อยากกินเลย</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cartArray.map(({ item, qty }) => (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FFF8E7] to-orange-100 flex items-center justify-center shrink-0 text-xl">
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#3E2723] text-sm truncate">{item.name}</p>
                  <p className="text-sm text-[#E65100] font-semibold">
                    {Number(item.price).toLocaleString()} บาท
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onUpdateQty(item, -1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition active:scale-90"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="font-semibold text-[#3E2723] w-6 text-center text-sm">{qty}</span>
                  <button
                    onClick={() => onUpdateQty(item, 1)}
                    className="w-7 h-7 rounded-full bg-[#E65100] text-white flex items-center justify-center hover:bg-[#d44900] transition active:scale-90"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>ค่าอาหาร</span>
              <span>{subtotal.toLocaleString()} บาท</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> ค่าจัดส่ง
              </span>
              <span>{deliveryFee} บาท</span>
            </div>
            <div className="flex justify-between text-[#3E2723] font-bold text-base pt-1.5 border-t border-gray-100">
              <span>รวมทั้งหมด</span>
              <span className="text-[#E65100]">{total.toLocaleString()} บาท</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={cartArray.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition disabled:opacity-50 bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white hover:shadow-lg active:scale-[0.98]"
          >
            {isLoggedIn ? 'สั่งเลย' : 'เข้าสู่ระบบก่อนสั่ง'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
