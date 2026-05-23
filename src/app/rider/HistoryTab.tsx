'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Props {
  riderId: string
}

export default function HistoryTab({ riderId }: Props) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!riderId) return
    supabase
      .from('orders')
      .select('*, items:order_items(*), stores(name)')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setOrders(data)
        setLoading(false)
      })
  }, [riderId])

  const completed = orders.filter((o) => o.status === 'จัดส่งสำเร็จ')
  const totalEarnings = completed.reduce((s, o) => s + Number(o.delivery_fee || 10), 0)
  const cancelled = orders.filter((o) => o.status === 'ยกเลิก')

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-[#E65100]">{completed.length}</div>
          <div className="text-xs text-gray-500">ส่งสำเร็จ</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{formatPrice(totalEarnings)}</div>
          <div className="text-xs text-gray-500">รายได้รวม</div>
        </div>
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-gray-500">{cancelled.length}</div>
          <div className="text-xs text-gray-500">ยกเลิก</div>
        </div>
      </div>

      {/* History list */}
      <div>
        <h3 className="font-semibold text-sm text-[#3E2723] mb-2">ประวัติการส่ง</h3>
        {completed.length === 0 ? (
          <EmptyState icon="📜" title="ยังไม่มีประวัติ" description="งานแรกของคุณรออยู่!" />
        ) : (
          <div className="space-y-2">
            {completed.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-3">
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium text-sm">{order.stores?.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(order.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    +{formatPrice(order.delivery_fee || 10)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(order.items || []).map((i: any) => i.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
