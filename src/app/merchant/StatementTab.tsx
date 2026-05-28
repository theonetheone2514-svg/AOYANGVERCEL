'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, calculateCommission, netAfterCommission } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants'

interface Props {
  storeId: string
}

export default function StatementTab({ storeId }: Props) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    if (!storeId) return
    const since = new Date(Date.now() - days * 86400000).toISOString()
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('store_id', storeId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data)
        setLoading(false)
      })
  }, [storeId, days])

  const completed = orders.filter((o) => o.status === 'จัดส่งสำเร็จ')
  const foodTotal = completed.reduce((s, o) => {
    const items = o.items || []
    const food = items.reduce((fs: number, i: any) => fs + Number(i.price) * i.qty, 0)
    return s + food
  }, 0)
  const deliveryTotal = completed.reduce((s, o) => s + Number(o.delivery_fee || 10), 0)
  const commission = calculateCommission(foodTotal, DEFAULT_COMMISSION_RATE)
  const netIncome = netAfterCommission(foodTotal, deliveryTotal, DEFAULT_COMMISSION_RATE)

  const periods = [
    { label: 'วันนี้', days: 1 },
    { label: '7 วัน', days: 7 },
    { label: '30 วัน', days: 30 },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              days === p.days ? 'bg-[#E65100] text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border p-3">
          <div className="text-xs text-gray-500">ออเดอร์สำเร็จ</div>
          <div className="text-xl font-bold text-[#3E2723]">{completed.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-xs text-gray-500">ค่าอาหารรวม</div>
          <div className="text-xl font-bold text-[#3E2723]">{formatPrice(foodTotal)}</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-xs text-gray-500">ค่าส่งรวม</div>
          <div className="text-xl font-bold text-blue-600">{formatPrice(deliveryTotal)}</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-xs text-gray-500">ค่าคอม 15%</div>
          <div className="text-xl font-bold text-red-600">{formatPrice(commission)}</div>
        </div>
      </div>

      {/* Net income */}
      <div className="bg-[#9C4A35] text-white rounded-lg p-4">
        <div className="text-sm opacity-90">รายได้สุทธิ (หลังหักค่าคอม)</div>
        <div className="text-3xl font-bold">{formatPrice(netIncome)}</div>
        <div className="text-xs opacity-75 mt-1">
          ค่าอาหาร {formatPrice(foodTotal)} - ค่าคอม {formatPrice(commission)} + ค่าส่ง {formatPrice(deliveryTotal)}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <h3 className="font-semibold text-sm text-[#3E2723] mb-2">ออเดอร์ล่าสุด</h3>
        <div className="space-y-2">
          {completed.slice(0, 10).map((order) => {
            const items = order.items || []
            const food = items.reduce((s: number, i: any) => s + Number(i.price) * i.qty, 0)
            return (
              <div key={order.id} className="bg-white rounded-lg border p-2 text-sm flex justify-between">
                <div>
                  <span className="text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString('th-TH')}
                  </span>
                  <span className="ml-2">{items.length} รายการ</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(food)}</div>
                  <div className="text-xs text-green-600">+ค่าส่ง {formatPrice(order.delivery_fee)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
