'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, getElapsedMinutes, getStatusColor, cn } from '@/lib/utils'
import { getCsrfHeaders } from '@/lib/csrf-client'
import { showOrderToast } from '@/components/Toast'
import EmptyState from '@/components/EmptyState'
import { StatsCardSkeleton } from '@/components/Skeleton'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Props {
  storeId: string
}

const statusFlow = [
  { status: 'รอดำเนินการ', next: 'กำลังเตรียมอาหาร', label: 'รับออเดอร์', color: 'bg-green-600' },
  { status: 'กำลังเตรียมอาหาร', next: 'พร้อมจัดส่ง', label: 'ทำเสร็จแล้ว', color: 'bg-blue-600' },
  { status: 'พร้อมจัดส่ง', next: 'กำลังจัดส่ง', label: 'ไรเดอร์รับแล้ว', color: 'bg-purple-600' },
  { status: 'กำลังจัดส่ง', next: 'จัดส่งสำเร็จ', label: 'จัดส่งสำเร็จ', color: 'bg-gray-500' },
]

export default function OrdersTab({ storeId }: Props) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const loadedRef = useRef(false)

  const loadOrders = useCallback(async () => {
    if (!storeId) return
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setOrders(data)
    setLoading(false)
    loadedRef.current = true
  }, [storeId])

  useEffect(() => {
    loadOrders()

    // Backup polling every 30s (in case Realtime not enabled)
    const pollInterval = setInterval(loadOrders, 30000)

    // Realtime subscription
    const channel = supabase
      .channel(`orders-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const newOrder = payload.new
          // Fetch with items
          supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('id', newOrder.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setOrders((prev) => [data, ...prev])
                const itemsText = (data.items || []).map((i: any) => `${i.qty}x ${i.name}`).join(', ')
                showOrderToast({
                  id: data.id,
                  title: '🆕 ออเดอร์ใหม่!',
                  message: itemsText,
                  total: Number(data.total),
                })
              }
            })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const updated = payload.new as any
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id ? { ...o, ...updated } : o
            )
          )
        }
      )
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [loadOrders, storeId])

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ status }),
    })
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter)

  const activeOrders = orders.filter((o) =>
    !['จัดส่งสำเร็จ', 'ยกเลิก'].includes(o.status)
  )
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-[#E65100]">{activeOrders.length}</div>
          <div className="text-xs text-gray-500">รอดำเนินการ</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter((o) => o.status === 'จัดส่งสำเร็จ').length}
          </div>
          <div className="text-xs text-gray-500">สำเร็จวันนี้</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <div className="text-2xl font-bold text-[#3E2723]">
            {formatPrice(orders.filter((o) => o.status === 'จัดส่งสำเร็จ').reduce((s, o) => s + Number(o.total), 0))}
          </div>
          <div className="text-xs text-gray-500">ยอดขาย</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'รอดำเนินการ', 'กำลังเตรียมอาหาร', 'พร้อมจัดส่ง', 'กำลังจัดส่ง', 'จัดส่งสำเร็จ', 'ยกเลิก'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition',
              filter === s
                ? 'bg-[#E65100] text-white'
                : 'bg-white text-gray-600 border'
            )}
          >
            {s === 'all' ? 'ทั้งหมด' : s}
          </button>
        ))}
      </div>

      {/* Order list */}
      {filteredOrders.length === 0 ? (
        <EmptyState icon="📭" title="ไม่มีออเดอร์" description="รอออเดอร์ใหม่..." />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusAction = statusFlow.find((s) => s.status === order.status)
            return (
              <div key={order.id} className="bg-white rounded-lg border p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-500">
                      {getElapsedMinutes(order.created_at)} นาทีที่แล้ว
                    </span>
                    <span className={cn('ml-2 text-xs px-2 py-0.5 rounded-full', getStatusColor(order.status))}>
                      {order.status}
                    </span>
                    <span className={cn(
                      'ml-1 text-xs px-2 py-0.5 rounded-full',
                      order.payment_method === 'transfer'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    )}>
                      {order.payment_method === 'transfer' ? '💳 โอน' : '💵 เงินสด'}
                    </span>
                  </div>
                  <span className="font-bold text-[#E65100]">{formatPrice(order.total)}</span>
                </div>

                <div className="text-sm text-gray-600 space-y-0.5">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id || item.menu_id}>
                      {item.qty}x {item.name} = {formatPrice(item.price * item.qty)}
                    </div>
                  ))}
                </div>

                {order.note && (
                  <p className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    หมายเหตุ: {order.note}
                  </p>
                )}

                {order.address && (
                  <p className="text-xs text-gray-400">📍 {order.address}</p>
                )}

                {/* Action button */}
                {statusAction && !['จัดส่งสำเร็จ', 'ยกเลิก', 'กำลังจัดส่ง'].includes(order.status) && (
                  <button
                    onClick={() => updateStatus(order.id, statusAction.next)}
                    className={cn('w-full py-2 rounded-lg text-sm font-medium text-white', statusAction.color)}
                  >
                    {statusAction.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
