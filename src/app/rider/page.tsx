'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AuthWrapper from '@/components/AuthWrapper'
import UserMenu from '@/components/UserMenu'
import { StatsCardSkeleton } from '@/components/Skeleton'
import ToastContainer from '@/components/Toast'
import JobsTab from './JobsTab'
import HistoryTab from './HistoryTab'
import RiderSettingsTab from './RiderSettingsTab'

type Tab = 'jobs' | 'history' | 'settings'

export default function RiderPage() {
  const { user } = useAuth()
  const [rider, setRider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('jobs')

  useEffect(() => {
    if (user?.phone) {
      supabase.from('riders').select('*').eq('phone', user.phone).single().then(({ data }) => {
        setRider(data)
        setLoading(false)
      })
    }
  }, [user])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'jobs', label: '📋 งาน' },
    { key: 'history', label: '📜 ประวัติ' },
    { key: 'settings', label: '⚙️ ตั้งค่า' },
  ]

  return (
    <AuthWrapper requiredRole={['rider']}>
      <div className="min-h-dvh bg-[#FFF8E7] flex flex-col">
        <header className="bg-gradient-to-r from-[#9C4A35] to-[#E65100] text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">ไรเดอร์</h1>
            <p className="text-sm opacity-90">รับงานส่งอาหาร</p>
          </div>
          <UserMenu />
        </header>

        <ToastContainer />
        {loading ? (
          <div className="flex-1 p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b flex">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    tab === t.key
                      ? 'text-[#E65100] border-b-2 border-[#E65100]'
                      : 'text-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <main className="flex-1 overflow-y-auto">
              {tab === 'jobs' && <JobsTab rider={rider} onUpdate={setRider} />}
              {tab === 'history' && <HistoryTab riderId={rider?.id} />}
              {tab === 'settings' && <RiderSettingsTab rider={rider} onUpdate={setRider} />}
            </main>
          </>
        )}
      </div>
    </AuthWrapper>
  )
}
