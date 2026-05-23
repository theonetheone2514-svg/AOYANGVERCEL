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
  'ก๋วยเตี๋ยว': '🍜',
  'ของทอด': '🍤',
  'ข้าว': '🍚',
  'ส้มตำ': '🥗',
  'ย่าง': '🍖',
  'ลาบ': '🥩',
  'น้ำตก': '🥘',
  'ต้ม': '🍲',
  'ซุป': '🥣',
  'เครื่องดื่ม': '🥤',
}

const categoryColors: Record<string, string> = {
  'ก๋วยเตี๋ยว': 'bg-orange-100 text-orange-700',
  'ของทอด': 'bg-yellow-100 text-yellow-700',
  'ข้าว': 'bg-amber-100 text-amber-700',
  'ส้มตำ': 'bg-lime-100 text-lime-700',
  'ย่าง': 'bg-red-100 text-red-700',
  'ลาบ': 'bg-purple-100 text-purple-700',
  'น้ำตก': 'bg-pink-100 text-pink-700',
  'ต้ม': 'bg-blue-100 text-blue-700',
  'ซุป': 'bg-teal-100 text-teal-700',
  'เครื่องดื่ม': 'bg-cyan-100 text-cyan-700',
}

export default function MenuItemCard({ item, qty = 0, onAdd, onRemove }: MenuItemCardProps) {
  const emoji = categoryEmoji[item.category || ''] || '🍽️'
  const badgeColor = categoryColors[item.category || ''] || 'bg-gray-100 text-gray-600'
  const [imgError, setImgError] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className={`h-14 w-14 rounded-xl shrink-0 overflow-hidden ${item.image_url && !imgError ? '' : 'bg-gradient-to-br from-[#FFF8E7] to-orange-100 flex items-center justify-center text-2xl'}`}>
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          emoji
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="font-medium text-[#3E2723] text-sm truncate">{item.name}</h4>
          {item.category && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeColor}`}>
              {item.category}
            </span>
          )}
        </div>
        <div className="text-sm font-semibold text-[#E65100] mt-0.5">
          {Number(item.price).toLocaleString()} บาท
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {qty > 0 ? (
          <>
            <button
              onClick={() => onRemove?.(item.id)}
              className="w-8 h-8 rounded-full bg-[#E65100] text-white flex items-center justify-center hover:bg-[#d44900] transition active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-[#3E2723] w-5 text-center text-sm">{qty}</span>
            <button
              onClick={() => onAdd(item)}
              className="w-8 h-8 rounded-full bg-[#E65100] text-white flex items-center justify-center hover:bg-[#d44900] transition active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onAdd(item)}
            className="px-3 py-1.5 rounded-lg bg-[#E65100] text-white text-sm font-medium hover:bg-[#d44900] transition active:scale-90"
          >
            เพิ่ม
          </button>
        )}
      </div>
    </div>
  )
}
