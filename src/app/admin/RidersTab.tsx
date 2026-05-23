'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

export default function RidersTab() {
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('riders').select('*').order('name').then(({ data }) => {
      if (data) setRiders(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4">
      <h2 className="font-semibold text-[#3E2723] mb-3">ไรเดอร์ทั้งหมด ({riders.length})</h2>
      {riders.length === 0 ? (
        <EmptyState icon="🛵" title="ยังไม่มีไรเดอร์" />
      ) : (
        <div className="space-y-2">
          {riders.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{r.name || 'ไม่ระบุชื่อ'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.online ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">{formatPrice(r.earnings || 0)}</div>
                  <div className="text-xs text-gray-400">{r.jobs_count || 0} งาน</div>
                </div>
              </div>
              {r.zone_id && (
                <div className="text-xs text-gray-400 mt-1">โซน: {r.zone_id}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
