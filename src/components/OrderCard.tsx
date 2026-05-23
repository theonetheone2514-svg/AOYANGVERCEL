'use client'

import { formatPrice, getElapsedMinutes, getStatusColor } from '@/lib/utils'
import type { Order, OrderItem } from '@/lib/types'

interface OrderCardProps {
  order: Order
  items?: OrderItem[]
  onStatusChange?: (orderId: string, status: string) => void
  actions?: { label: string; status: string; color?: string }[]
}

export default function OrderCard({ order, items, onStatusChange, actions }: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs text-gray-500">
            {getElapsedMinutes(order.created_at)} นาทีที่แล้ว
          </span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
        <span className="font-bold text-[#E65100]">{formatPrice(order.total)}</span>
      </div>

      {items && items.length > 0 && (
        <div className="text-sm text-gray-600 space-y-0.5">
          {items.map((item) => (
            <div key={item.id}>
              {item.qty}x {item.name} = {formatPrice(item.price * item.qty)}
            </div>
          ))}
        </div>
      )}

      {order.note && (
        <p className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
          หมายเหตุ: {order.note}
        </p>
      )}

      {order.address && (
        <p className="text-xs text-gray-400">📍 {order.address}</p>
      )}

      {actions && onStatusChange && (
        <div className="flex gap-2 pt-1">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => onStatusChange(order.id, action.status)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium text-white ${
                action.color || 'bg-[#E65100]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
