'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'

export default function StoresTab() {
  const [stores, setStores] = useState<any[]>([])
  const [deactivatedMap, setDeactivatedMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{
    action: 'deactivate' | 'delete'
    store: any
  } | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const [{ data: storeData }, { data: settings }] = await Promise.all([
      supabase.from('stores').select('*').order('name'),
      supabase.from('settings').select('key, value').like('key', 'deactivated_store:%'),
    ])
    const map: Record<string, boolean> = {}
    if (settings) {
      for (const s of settings) {
        const storeId = s.key.replace('deactivated_store:', '')
        map[storeId] = s.value === 'true'
      }
    }
    setDeactivatedMap(map)

    if (storeData) {
      const withOrders = await Promise.all(
        storeData.map(async (s) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', s.id)
          return { ...s, order_count: count || 0 }
        })
      )
      setStores(withOrders)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDeactivate(store: any) {
    setError('')
    setSuccess('')
    const { error: err } = await supabase
      .from('settings')
      .upsert({ key: `deactivated_store:${store.id}`, value: 'true' })
    if (err) { setError(err.message); return }
    setSuccess('ปิดร้านค้าเรียบร้อย')
    setConfirm(null)
    setDeactivatedMap((prev) => ({ ...prev, [store.id]: true }))
  }

  async function handleReactivate(store: any) {
    setError('')
    setSuccess('')
    await supabase.from('settings').delete().eq('key', `deactivated_store:${store.id}`)
    setSuccess('เปิดร้านค้าเรียบร้อย')
    setDeactivatedMap((prev) => ({ ...prev, [store.id]: false }))
  }

  async function handleDelete(store: any) {
    setError('')
    setSuccess('')
    const res = await fetch(`/api/stores/${store.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setConfirm(null); return }
    setSuccess('ลบร้านค้าเรียบร้อย')
    setConfirm(null)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4">
      <h2 className="font-semibold text-[#3E2723] mb-3">ร้านค้าทั้งหมด ({stores.length})</h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 border border-red-100">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3 border border-green-100">{success}</p>
      )}

      {stores.length === 0 ? (
        <EmptyState icon="🏪" title="ยังไม่มีร้านค้า" />
      ) : (
        <div className="space-y-2">
          {stores.map((s) => {
            const isDeactivated = deactivatedMap[s.id]
            return (
              <div key={s.id} className={`bg-white rounded-lg border p-3 ${isDeactivated ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{s.name}</span>
                      {isDeactivated && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                          ถูกระงับ
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.status === 'open' ? 'เปิด' : 'ปิด'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.phone}</div>
                    <div className="text-xs text-gray-400">ID: {s.id} | ออเดอร์: {s.order_count}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 ml-2">
                    {!isDeactivated ? (
                      <button
                        onClick={() => setConfirm({ action: 'deactivate', store: s })}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-medium"
                      >
                        🚫 ปิด
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(s)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium"
                      >
                        ✅ เปิด
                      </button>
                    )}
                    <button
                      onClick={() => setConfirm({ action: 'delete', store: s })}
                      disabled={s.order_count > 0}
                      title={s.order_count > 0 ? `มี ${s.order_count} ออเดอร์ — ลบไม่ได้` : ''}
                      className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition ${
                        s.order_count > 0
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirm?.action === 'deactivate'}
        title="ปิดร้านค้า?"
        message={`แน่ใจว่าจะปิดร้าน "${confirm?.store?.name}"? ร้านจะไม่สามารถเข้าระบบได้อีก จนกว่าแอดมินจะเปิดให้`}
        confirmLabel="ปิดร้าน"
        onConfirm={() => confirm && handleDeactivate(confirm.store)}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.action === 'delete'}
        title="ลบร้านค้า?"
        danger
        message={`แน่ใจว่าจะลบร้าน "${confirm?.store?.name}"? เมนูทั้งหมดจะถูกลบ และไม่สามารถกู้คืนได้`}
        confirmLabel="ลบเลย"
        onConfirm={() => confirm && handleDelete(confirm.store)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
