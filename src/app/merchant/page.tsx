'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import AuthWrapper from '@/components/AuthWrapper'
import UserMenu from '@/components/UserMenu'
import { StatsCardSkeleton } from '@/components/Skeleton'
import OrdersTab from './OrdersTab'
import MenuTab from './MenuTab'
import StatementTab from './StatementTab'
import SettingsTab from './SettingsTab'

type Tab = 'orders' | 'menu' | 'statement' | 'settings'

export default function MerchantPage() {
  const { user } = useAuth()
  const [store, setStore] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('orders')

  useEffect(() => {
    if (user?.id) {
      supabase.from('stores').select('*').eq('id', user.id).single().then(({ data }) => {
        setStore(data)
        setLoading(false)
      })
    }
  }, [user])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: '📋 ออเดอร์' },
    { key: 'menu', label: '🍳 เมนู' },
    { key: 'statement', label: '💰 รายได้' },
    { key: 'settings', label: '⚙️ ตั้งค่า' },
  ]

  return (
    <AuthWrapper requiredRole={['merchant']}>
      <div className="min-h-dvh bg-[#FFF8E7] flex flex-col">
        <header className="bg-gradient-to-r from-[#9C4A35] to-[#E65100] text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{store?.name || 'ร้านค้า'}</h1>
            <p className="text-sm opacity-90">จัดการออเดอร์และเมนู</p>
          </div>
          <UserMenu />
        </header>

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
            {/* Tab bar */}
            <div className="bg-white border-b flex overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                    tab === t.key
                      ? 'text-[#E65100] border-b-2 border-[#E65100]'
                      : 'text-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <main className="flex-1 overflow-y-auto">
              {tab === 'orders' && <OrdersTab storeId={store?.id} />}
              {tab === 'menu' && <MenuTab storeId={store?.id} />}
              {tab === 'statement' && <StatementTab storeId={store?.id} />}
              {tab === 'settings' && <SettingsTab store={store} onUpdate={setStore} />}
            </main>
          </>
        )}
      </div>
    </AuthWrapper>
  )
}
