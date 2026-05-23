'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardTab() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [])

  async function loadSummary() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const [ordersToday, customers, riders, stores, allOrders] = await Promise.all([
      supabase.from('orders').select('*').gte('created_at', todayStr),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('riders').select('id', { count: 'exact', head: true }),
      supabase.from('stores').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total, status, created_at').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ])

    const todayOrders = ordersToday.data || []
    const revenue = todayOrders.reduce((s, o) => s + Number(o.total || 0), 0)
    const pending = todayOrders.filter((o) => ['รอดำเนินการ', 'กำลังเตรียมอาหาร'].includes(o.status)).length

    const statusCounts: Record<string, number> = {}
    ;(allOrders.data || []).forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

    setSummary({
      total_orders_today: todayOrders.length,
      total_revenue_today: revenue,
      total_customers: customers.count || 0,
      total_riders: riders.count || 0,
      total_stores: stores.count || 0,
      pending_orders: pending,
      orders_by_status: statusCounts,
    })
    setLoading(false)
  }

  if (loading) return <LoadingSpinner />

  if (!summary) return null

  const cards = [
    { label: 'ออเดอร์วันนี้', value: summary.total_orders_today, color: 'text-[#E65100]' },
    { label: 'รายได้วันนี้', value: formatPrice(summary.total_revenue_today), color: 'text-green-600' },
    { label: 'รอรับ/ทำ', value: summary.pending_orders, color: 'text-yellow-600' },
    { label: 'ร้านค้า', value: summary.total_stores, color: 'text-blue-600' },
    { label: 'สมาชิก', value: summary.total_customers, color: 'text-purple-600' },
    { label: 'ไรเดอร์', value: summary.total_riders, color: 'text-[#9C4A35]' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg border p-4 text-center">
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Orders by status */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-[#3E2723] mb-3">ออเดอร์แยกตามสถานะ (7 วัน)</h3>
        <div className="space-y-2">
          {Object.entries(summary.orders_by_status).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <span className="text-sm w-32 text-gray-600">{status}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4">
                <div
                  className="bg-[#E65100] h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((count as number) / Math.max(...Object.values(summary.orders_by_status) as number[])) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium w-8 text-right">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-[#3E2723] mb-2">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <a href="/merchant" className="bg-orange-50 text-[#E65100] rounded-lg p-3 text-sm font-medium text-center">
            🏪 ดูร้านค้า
          </a>
          <a href="/rider" className="bg-blue-50 text-blue-600 rounded-lg p-3 text-sm font-medium text-center">
            🛵 ดูไรเดอร์
          </a>
        </div>
      </div>
    </div>
  )
}
