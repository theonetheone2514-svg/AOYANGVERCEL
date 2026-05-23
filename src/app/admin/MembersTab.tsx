'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'

export default function MembersTab() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setMembers(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4">
      <h2 className="font-semibold text-[#3E2723] mb-3">สมาชิกทั้งหมด ({members.length})</h2>
      {members.length === 0 ? (
        <EmptyState icon="👤" title="ยังไม่มีสมาชิก" />
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-lg border p-3 flex justify-between items-center">
              <div>
                <div className="font-medium text-sm">{m.name || 'ไม่ระบุชื่อ'}</div>
                <div className="text-xs text-gray-500">{m.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[#E65100]">{m.points || 0} pts</div>
                <div className="text-xs text-gray-400">
                  {new Date(m.created_at).toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
