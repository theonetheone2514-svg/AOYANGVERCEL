import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-utils'

export const GET = withAuth(async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const [ordersToday, totalCustomers, totalRiders, totalStores, ordersByStatus, revenueByDay] =
    await Promise.all([
      supabase.from('orders').select('*').gte('created_at', todayStr),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('riders').select('id', { count: 'exact', head: true }),
      supabase.from('stores').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('status'),
      supabase.from('orders').select('total, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

  const pendingOrders = (ordersToday.data || []).filter(
    (o) => o.status === 'รอดำเนินการ' || o.status === 'กำลังเตรียมอาหาร'
  ).length

  const totalRevenueToday = (ordersToday.data || []).reduce(
    (sum, o) => sum + Number(o.total || 0), 0
  )

  const statusCounts: Record<string, number> = {}
  ;(ordersByStatus.data || []).forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })

  const revenueByDayMap: Record<string, number> = {}
  ;(revenueByDay.data || []).forEach((o) => {
    const day = o.created_at?.slice(0, 10)
    if (day) revenueByDayMap[day] = (revenueByDayMap[day] || 0) + Number(o.total || 0)
  })

  return NextResponse.json({
    total_orders_today: ordersToday.data?.length || 0,
    total_revenue_today: totalRevenueToday,
    total_customers: totalCustomers.count || 0,
    total_riders: totalRiders.count || 0,
    total_stores: totalStores.count || 0,
    pending_orders: pendingOrders,
    orders_by_status: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    revenue_by_day: Object.entries(revenueByDayMap).map(([date, revenue]) => ({ date, revenue })),
  })
}, ['admin'])
