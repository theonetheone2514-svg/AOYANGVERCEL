'use client'

import { useState } from 'react'
import type { MenuItem } from '@/lib/types'
import { Minus, Plus } from 'lucide-react'

interface MenuItemCardProps {
  item: MenuItem
  qty?: number
  onAdd: (item: MenuItem) => void
  onRemove?: (itemId: string) => void
}

const categoryEmoji: Record<string, string> = {
  'ก๋วยเตี๋ยว': '🍜', 'ของทอด': '🍤', 'ข้าว': '🍚', 'ส้มตำ': '🥗',
  'ย่าง': '🍖', 'ลาบ': '🥩', 'น้ำตก': '🥘', 'ต้ม': '🍲', 'ซุป': '🥣', 'เครื่องดื่ม': '🥤',
}

const imageGradients: Record<string, string> = {
  'ก๋วยเตี๋ยว': 'from-orange-300 to-amber-400',
  'ของทอด': 'from-yellow-300 to-amber-400',
  'ข้าว': 'from-amber-300 to-yellow-400',
  'ส้มตำ': 'from-lime-300 to-green-400',
  'ย่าง': 'from-red-300 to-rose-400',
  'ลาบ': 'from-purple-300 to-pink-400',
  'น้ำตก': 'from-pink-300 to-rose-400',
  'ต้ม': 'from-blue-300 to-cyan-400',
  'ซุป': 'from-teal-300 to-emerald-400',
  'เครื่องดื่ม': 'from-cyan-300 to-sky-400',
}

export default function MenuItemCard({ item, qty = 0, onAdd, onRemove }: MenuItemCardProps) {
  const emoji = categoryEmoji[item.category || ''] || '🍽️'
  const imgGrad = imageGradients[item.category || ''] || 'from-gray-300 to-gray-400'
  const [imgError, setImgError] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-orange-100/60 overflow-hidden transition-all hover:shadow-md hover:border-orange-200 active:scale-[0.99]">
      <div className="flex">
        {/* Image */}
        <div className="w-24 h-24 shrink-0 relative overflow-hidden">
          {item.image_url && !imgError ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${imgGrad} flex items-center justify-center`}>
              <span className="text-3xl drop-shadow">{emoji}</span>
            </div>
          )}
          {item.stock !== undefined && item.stock <= 5 && item.stock > 0 && (
            <span className="absolute top-1 left-1 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
              เหลือ {item.stock}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-[#3E2723] text-sm leading-tight line-clamp-2">{item.name}</h4>
            {item.category && (
              <span className="inline-block mt-1 text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                {item.category}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-base font-bold text-[#E65100]">
              ฿{Number(item.price).toLocaleString()}
            </span>
            {qty > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRemove?.(item.id)}
                  className="w-7 h-7 rounded-full bg-[#E65100] text-white flex items-center justify-center hover:bg-[#d44900] transition active:scale-90 shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-[#3E2723] w-6 text-center text-sm">{qty}</span>
                <button
                  onClick={() => onAdd(item)}
                  disabled={item.stock !== undefined && item.stock <= qty}
                  className="w-7 h-7 rounded-full bg-[#E65100] text-white flex items-center justify-center hover:bg-[#d44900] transition active:scale-90 shadow-sm disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAdd(item)}
                disabled={item.stock !== undefined && item.stock <= 0}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E65100] to-[#F57C00] text-white flex items-center justify-center hover:shadow-md hover:scale-105 transition active:scale-90 shadow-sm disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
