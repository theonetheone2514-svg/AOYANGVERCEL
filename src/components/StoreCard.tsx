'use client'

import type { Store } from '@/lib/types'

const storeIcons: Record<string, string> = {
  'S01': '🍜',
  'S02': '🍚',
  'S03': '🥗',
  'S04': '🍗',
  'S05': '🥩',
}

const storeColors: Record<string, string> = {
  'S01': 'from-orange-200 to-amber-100',
  'S02': 'from-yellow-200 to-orange-100',
  'S03': 'from-green-200 to-lime-100',
  'S04': 'from-red-200 to-rose-100',
  'S05': 'from-purple-200 to-pink-100',
}

interface StoreCardProps {
  store: Store
  selected: boolean
  onSelect: (store: Store) => void
}

export default function StoreCard({ store, selected, onSelect }: StoreCardProps) {
  const icon = storeIcons[store.id] || '🏪'
  const gradient = storeColors[store.id] || 'from-gray-200 to-gray-100'

  return (
    <button
      onClick={() => onSelect(store)}
      className={`w-full text-left bg-white rounded-xl border-2 overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
        selected
          ? 'border-[#E65100] shadow-md ring-1 ring-[#E65100]/20'
          : 'border-gray-100 shadow-sm'
      }`}
    >
      <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <span className="text-5xl">{icon}</span>
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
            store.status === 'open'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-500'
          }`}
        >
          {store.status === 'open' ? '📍 เปิด' : 'ปิด'}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-[#3E2723] truncate">{store.name}</h3>
        <div className="flex items-center gap-3 mt-1">
          {store.wait_time && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span>⏱</span> {store.wait_time} นาที
            </span>
          )}
          {store.status === 'open' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              เปิดอยู่
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
