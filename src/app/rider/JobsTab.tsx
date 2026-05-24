'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, getElapsedMinutes } from '@/lib/utils'
import { showOrderToast } from '@/components/Toast'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Props {
  rider: any
  onUpdate: (rider: any) => void
}

export default function JobsTab({ rider, onUpdate }: Props) {
  const [available, setAvailable] = useState<any[]>([])
  const [active, setActive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const seenIds = useRef<Set<string>>(new Set())

  const loadJobs = useCallback(async () => {
    const { data: pending } = await supabase
      .from('orders')
      .select('*, items:order_items(*), stores(name), customers(name, phone)')
      .eq('status', 'พร้อมจัดส่ง')

    if (pending) {
      const unassigned = pending.filter((o) => !o.rider_id)
      unassigned.forEach((o) => {
        if (!seenIds.current.has(o.id)) {
          seenIds.current.add(o.id)
          const itemsText = (o.items || []).map((i: any) => `${i.qty}x ${i.name}`).join(', ')
          showOrderToast({
            id: o.id,
            title: '🆕 งานใหม่!',
            message: `${o.stores?.name || ''} — ${itemsText}`,
            total: Number(o.total),
          })
        }
      })
      setAvailable(unassigned)
    }

    if (rider?.id) {
      const { data: myJobs } = await supabase
        .from('orders')
        .select('*, items:order_items(*), stores(name), customers(name, phone)')
        .eq('rider_id', rider.id)
        .in('status', ['กำลังจัดส่ง'])
        .order('created_at', { ascending: false })
      if (myJobs) setActive(myJobs)
    }

    setLoading(false)
  }, [rider?.id])

  useEffect(() => {
    loadJobs()
    const interval = setInterval(loadJobs, 15000)
    return () => clearInterval(interval)
  }, [loadJobs])

  async function acceptJob(orderId: string) {
    const { data } = await supabase
      .from('orders')
      .update({ rider_id: rider.id, status: 'กำลังจัดส่ง' })
      .eq('id', orderId)
      .is('rider_id', null)
      .select()
      .single()

    if (!data) {
      alert('⚠️ ออเดอร์นี้มีไรเดอร์รับไปแล้ว')
      loadJobs()
      return
    }

    await supabase.from('riders').update({ online: true }).eq('id', rider.id)
    onUpdate({ ...rider, online: true })
    loadJobs()
  }

  async function completeJob(orderId: string) {
    const { data: order } = await supabase
      .from('orders').select('delivery_fee').eq('id', orderId).single()

    const fee = Number(order?.delivery_fee || 10)

    const { data: current } = await supabase
      .from('riders').select('earnings, jobs_count').eq('id', rider.id).single()

    await supabase.from('riders').update({
      earnings: (Number(current?.earnings) || 0) + fee,
      jobs_count: (current?.jobs_count || 0) + 1,
    }).eq('id', rider.id)

    await supabase.from('orders').update({ status: 'จัดส่งสำเร็จ' }).eq('id', orderId)

    onUpdate({
      ...rider,
      earnings: (Number(current?.earnings) || 0) + fee,
      jobs_count: (current?.jobs_count || 0) + 1,
    })
    loadJobs()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 space-y-6">
      {/* Online status indicator */}
      <div className="flex items-center gap-2 bg-white rounded-lg border p-3">
        <div className={`w-3 h-3 rounded-full ${rider?.online ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-600">
          {rider?.online ? '🟢 ออนไลน์ — พร้อมรับงาน' : '🔴 ออฟไลน์ — เปิดรับงานในตั้งค่า'}
        </span>
      </div>

      {/* Active delivery */}
      {active.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#3E2723] mb-2">📦 กำลังจัดส่ง</h2>
          <div className="space-y-3">
            {active.map((order) => (
              <div key={order.id} className="bg-blue-50 rounded-lg border border-blue-200 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-800">{order.stores?.name}</span>
                  <span className="text-xs text-gray-500">{getElapsedMinutes(order.created_at)} นาที</span>
                </div>
                <div className="text-sm text-gray-600">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id}>{item.qty}x {item.name}</div>
                  ))}
                </div>
                {order.customers?.name && (
                  <p className="text-xs text-gray-600">👤 {order.customers.name}</p>
                )}
                {order.customers?.phone && (
                  <p className="text-xs text-gray-600">📞 {order.customers.phone}</p>
                )}
                {order.address && (
                  <p className="text-xs text-gray-400">📍 {order.address}</p>
                )}
                <div className="flex gap-2">
                  {(order.lat && order.lng) ? (
                    <a
                      href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 border border-blue-300 text-blue-700 py-2 rounded-lg text-sm font-medium text-center"
                    >
                      🗺️ เปิดแผนที่
                    </a>
                  ) : order.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 border border-blue-300 text-blue-700 py-2 rounded-lg text-sm font-medium text-center"
                    >
                      🗺️ เปิดแผนที่
                    </a>
                  ) : null}
                  <button
                    onClick={() => completeJob(order.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    ✅ ส่งสำเร็จ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available jobs */}
      <section>
        <h2 className="text-sm font-semibold text-[#3E2723] mb-2">
          🆕 งานใหม่ ({available.length})
        </h2>
        {available.length === 0 ? (
          <EmptyState icon="🛵" title="ไม่มีงาน" description="รอออเดอร์ใหม่..." />
        ) : (
          <div className="space-y-3">
            {available.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-[#3E2723]">{order.stores?.name}</span>
                  <span className="font-bold text-[#E65100]">{formatPrice(order.total)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {(order.items || []).map((item: any) => (
                    <div key={item.id}>{item.qty}x {item.name}</div>
                  ))}
                </div>
                {order.customers?.name && (
                  <p className="text-xs text-gray-600">👤 {order.customers.name}</p>
                )}
                {order.customers?.phone && (
                  <p className="text-xs text-gray-600">📞 {order.customers.phone}</p>
                )}
                {order.address && (
                  <p className="text-xs text-gray-400">📍 {order.address}</p>
                )}
                <div className="flex gap-2">
                  {(order.lat && order.lng) ? (
                    <a
                      href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 border border-blue-300 text-blue-700 py-2 rounded-lg text-sm font-medium text-center"
                    >
                      🗺️ แผนที่
                    </a>
                  ) : order.address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 border border-blue-300 text-blue-700 py-2 rounded-lg text-sm font-medium text-center"
                    >
                      🗺️ แผนที่
                    </a>
                  ) : null}
                  <button
                    onClick={() => acceptJob(order.id)}
                    disabled={!rider?.online}
                    className="flex-1 bg-[#E65100] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    รับงาน
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
