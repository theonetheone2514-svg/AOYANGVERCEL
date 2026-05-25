'use client'

import { useState } from 'react'
import type { Store } from '@/lib/types'

const storeIcons: Record<string, string> = {
  'S01': '🍜', 'S02': '🍚', 'S03': '🥗', 'S04': '🍗', 'S05': '🥩',
}

const storeGradients: Record<string, string> = {
  'S01': 'from-orange-400 to-amber-500',
  'S02': 'from-yellow-400 to-orange-500',
  'S03': 'from-green-400 to-lime-500',
  'S04': 'from-red-400 to-rose-500',
  'S05': 'from-purple-400 to-pink-500',
}

interface StoreCardProps {
  store: Store
  selected: boolean
  onSelect: (store: Store) => void
}

export default function StoreCard({ store, selected, onSelect }: StoreCardProps) {
  const icon = storeIcons[store.id] || '🏪'
  const gradient = storeGradients[store.id] || 'from-gray-400 to-gray-500'
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={() => onSelect(store)}
      className={`w-full text-left bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${
        selected
          ? 'ring-2 ring-[#E65100] shadow-lg'
          : 'shadow-sm'
      }`}
    >
      <div className="h-36 relative overflow-hidden">
        {store.image_url && !imgError ? (
          <img
            src={store.image_url}
            alt={store.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-6xl drop-shadow-lg">{icon}</span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Status badge */}
        <span
          className={`absolute top-2.5 right-2.5 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm backdrop-blur-sm ${
            store.status === 'open'
              ? 'bg-green-500/90 text-white'
              : 'bg-gray-500/80 text-white'
          }`}
        >
          {store.status === 'open' ? '📍 เปิด' : 'ปิด'}
        </span>
        {/* Store name overlay */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <h3 className="text-white font-bold text-sm drop-shadow-md truncate">{store.name}</h3>
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between">
        {store.wait_time ? (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>⏱</span> {store.wait_time} นาที
          </span>
        ) : <span />}
        {store.status === 'open' && (
          <span className="text-xs text-green-600 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            เปิดอยู่
          </span>
        )}
      </div>
    </button>
  )
}
