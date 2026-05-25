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
  const [confirmOrder, setConfirmOrder] = useState<any>(null)
  const [confirming, setConfirming] = useState(false)
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

  async function confirmDelivered() {
    if (!confirmOrder) return
    setConfirming(true)

    const orderId = confirmOrder.id
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
    setConfirmOrder(null)
    setConfirming(false)
    loadJobs()
  }

  if (loading) return <LoadingSpinner />

  return (
    <><div className="p-4 space-y-6">
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
                <div className="flex items-center gap-1 text-xs">
                  {order.payment_method === 'transfer'
                    ? <span className="text-purple-600">💳 โอน</span>
                    : <span className="text-green-700">💵 เงินสด</span>
                  }
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
                    onClick={() => setConfirmOrder(order)}
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

      {/* Payment confirmation modal */}
      {confirmOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !confirming && setConfirmOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#3E2723] text-center">
              {confirmOrder.payment_method === 'transfer' ? '💳 ยืนยันการโอน' : '💵 ยืนยันรับเงินสด'}
            </h3>

            {confirmOrder.payment_method === 'transfer' ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-gray-600">ให้ลูกค้าสแกน QR เพื่อชำระ</p>
                <img
                  src={`https://promptpay.io/0929892085/${confirmOrder.total}.png`}
                  alt="PromptPay QR"
                  className="w-48 h-48 mx-auto rounded-lg border"
                />
                <p className="text-xs text-gray-400">พร้อมเพย์: 0929892085</p>
                <p className="text-sm font-semibold text-[#E65100]">ยอด {formatPrice(confirmOrder.total)}</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">ได้รับเงินสดจากลูกค้าแล้วหรือยัง?</p>
                <p className="text-lg font-bold text-green-700">{formatPrice(confirmOrder.total)}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOrder(null)}
                disabled={confirming}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={confirmDelivered}
                disabled={confirming}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {confirming ? 'กำลังยืนยัน...' : confirmOrder.payment_method === 'transfer' ? '✅ ลูกค้าโอนแล้ว' : '✅ รับเงินแล้ว'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
