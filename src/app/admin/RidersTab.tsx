'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function RidersTab() {
  const [riders, setRiders] = useState<any[]>([])
  const [deactivatedMap, setDeactivatedMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{
    action: 'deactivate' | 'delete'
    rider: any
  } | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const [{ data: riderData }, { data: settings }] = await Promise.all([
      supabase.from('riders').select('*').order('name'),
      supabase.from('settings').select('key, value').like('key', 'deactivated_rider:%'),
    ])
    const map: Record<string, boolean> = {}
    if (settings) {
      for (const s of settings) {
        const riderId = s.key.replace('deactivated_rider:', '')
        map[riderId] = s.value === 'true'
      }
    }
    setDeactivatedMap(map)

    if (riderData) {
      const withOrders = await Promise.all(
        riderData.map(async (r) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('rider_id', r.id)
          return { ...r, order_count: count || 0 }
        })
      )
      setRiders(withOrders)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDeactivate(rider: any) {
    setError('')
    setSuccess('')
    const { error: err } = await supabase
      .from('settings')
      .upsert({ key: `deactivated_rider:${rider.id}`, value: 'true' })
    if (err) { setError(err.message); return }
    setSuccess('ปิดใช้งานไรเดอร์เรียบร้อย')
    setConfirm(null)
    setDeactivatedMap((prev) => ({ ...prev, [rider.id]: true }))
  }

  async function handleReactivate(rider: any) {
    setSuccess('')
    setError('')
    await supabase.from('settings').delete().eq('key', `deactivated_rider:${rider.id}`)
    setSuccess('เปิดใช้งานไรเดอร์เรียบร้อย')
    setDeactivatedMap((prev) => ({ ...prev, [rider.id]: false }))
  }

  async function handleDelete(rider: any) {
    setError('')
    setSuccess('')
    const res = await fetch(`/api/riders/${rider.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setConfirm(null); return }
    setSuccess('ลบไรเดอร์เรียบร้อย')
    setConfirm(null)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4">
      <h2 className="font-semibold text-[#3E2723] mb-3">ไรเดอร์ทั้งหมด ({riders.length})</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 border border-red-100">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3 border border-green-100">{success}</p>
      )}

      {riders.length === 0 ? (
        <EmptyState icon="🛵" title="ยังไม่มีไรเดอร์" />
      ) : (
        <div className="space-y-2">
          {riders.map((r) => {
            const isDeactivated = deactivatedMap[r.id]
            return (
              <div key={r.id} className={`bg-white rounded-lg border p-3 ${isDeactivated ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{r.name || 'ไม่ระบุชื่อ'}</span>
                      {isDeactivated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                          ถูกระงับ
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        r.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {r.online ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.phone}</div>
                    <div className="text-xs text-gray-400">
                      {r.jobs_count || 0} งาน | {r.zone_id ? `โซน ${r.zone_id}` : 'ไม่มีโซน'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-sm font-semibold text-green-600">{formatPrice(r.earnings || 0)}</div>
                    <div className="flex gap-1.5 mt-1 justify-end">
                      {!isDeactivated ? (
                        <button
                          onClick={() => setConfirm({ action: 'deactivate', rider: r })}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-medium"
                        >
                          🚫 ปิด
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(r)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium"
                        >
                          ✅ เปิด
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ action: 'delete', rider: r })}
                        disabled={r.order_count > 0}
                        title={r.order_count > 0 ? `มี ${r.order_count} งาน — ลบไม่ได้` : ''}
                        className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition ${
                          r.order_count > 0
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirm?.action === 'deactivate'}
        title="ปิดใช้งานไรเดอร์?"
        message={`แน่ใจว่าจะปิด "${confirm?.rider?.name}"? ไรเดอร์จะไม่สามารถเข้าระบบได้อีก จนกว่าแอดมินจะเปิดให้`}
        confirmLabel="ปิดใช้งาน"
        onConfirm={() => confirm && handleDeactivate(confirm.rider)}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.action === 'delete'}
        title="ลบไรเดอร์?"
        danger
        message={`แน่ใจว่าจะลบ "${confirm?.rider?.name}"? การกระทำนี้ไม่สามารถกู้คืนได้`}
        confirmLabel="ลบเลย"
        onConfirm={() => confirm && handleDelete(confirm.rider)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
