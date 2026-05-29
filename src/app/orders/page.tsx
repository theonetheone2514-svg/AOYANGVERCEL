'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import type { Order, OrderItem } from '@/lib/types'
import { getStatusColor, formatPrice, getElapsedMinutes } from '@/lib/utils'
import { ChevronLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const RatingModal = dynamic(() => import('@/components/RatingModal'), { ssr: false })

const statusTabs = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดส่ง', 'จัดส่งสำเร็จ', 'ยกเลิก']

type OrderWithItems = Order & { items: OrderItem[] }

function getPaymentLabel(method: string) {
  return method === 'transfer' ? '💳 โอน' : '💰 เงินสด'
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ทั้งหมด')
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [ratingOrder, setRatingOrder] = useState<OrderWithItems | null>(null)
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set())

  const loadOrders = useCallback(async () => {
    const { data: cust } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', user!.phone)
      .maybeSingle()
    if (!cust) { setLoading(false); return }
    setCustomerId(cust.id)

    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*), stores:store_id(name)')
      .eq('customer_id', cust.id)
      .order('created_at', { ascending: false })

    setOrders((data || []) as unknown as OrderWithItems[])

    // Check which orders already have ratings
    const { data: ratings } = await supabase
      .from('ratings')
      .select('order_id')
      .eq('customer_id', cust.id)
    if (ratings) {
      setRatedOrderIds(new Set(ratings.map((r) => r.order_id)))
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/auth/login?redirect=/orders'); return }
    loadOrders()
  }, [user, authLoading, loadOrders, router])

  const filtered = filter === 'ทั้งหมด'
    ? orders
    : orders.filter((o) => o.status === filter)

  function getStoreName(order: OrderWithItems): string {
    const s = (order as any).stores
    return s?.name || 'ร้านค้า'
  }

  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex flex-col">
      <header className="bg-gradient-to-r from-[#BF360C] to-[#E65100] text-white px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 hover:bg-white/10 rounded-lg transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold">📋 ประวัติออเดอร์</h1>
      </header>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none border-b border-gray-100 bg-white">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ${
              filter === tab
                ? 'bg-[#E65100] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p className="font-medium">ยังไม่มีออเดอร์</p>
            <p className="text-sm mt-1">ลองสั่งอาหารดูสิ</p>
            <Link href="/" className="inline-block mt-4 px-5 py-2 bg-[#E65100] text-white rounded-full text-sm font-medium">
              สั่งเลย
            </Link>
          </div>
        ) : (
          filtered.map((order) => {
            const elapsed = getElapsedMinutes(order.created_at)
            const isComplete = order.status === 'จัดส่งสำเร็จ'
            const canRate = isComplete && customerId && !ratedOrderIds.has(order.id)
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#3E2723]">{getStoreName(order)}</span>
                    <span className="text-xs text-gray-400">#{order.id.slice(0, 6)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="text-sm text-gray-600 space-y-0.5">
                  {(order.items || []).slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.qty}x {item.name}</span>
                      <span>{formatPrice(Number(item.price) * item.qty)}</span>
                    </div>
                  ))}
                  {(order.items?.length || 0) > 3 && (
                    <p className="text-xs text-gray-400">+อีก {(order.items?.length || 0) - 3} รายการ</p>
                  )}
                </div>

                <div className="border-t border-gray-50 pt-2 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {elapsed} นาที</span>
                    <span>{getPaymentLabel(order.payment_method)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canRate && (
                      <button
                        onClick={() => setRatingOrder(order)}
                        className="text-yellow-600 font-medium hover:text-yellow-700 transition"
                      >
                        ⭐ ให้คะแนน
                      </button>
                    )}
                    {isComplete && ratedOrderIds.has(order.id) && (
                      <span className="text-yellow-500">⭐</span>
                    )}
                    <span className="font-semibold text-[#E65100] text-sm">{formatPrice(Number(order.total))}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </main>

      {ratingOrder && customerId && (
        <RatingModal
          orderId={ratingOrder.id}
          storeId={ratingOrder.store_id}
          customerId={customerId}
          onClose={() => setRatingOrder(null)}
          onDone={() => {
            setRatedOrderIds((prev) => new Set(prev).add(ratingOrder.id))
            setRatingOrder(null)
          }}
        />
      )}
    </div>
  )
}
