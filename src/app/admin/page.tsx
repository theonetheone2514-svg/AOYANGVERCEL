'use client'

import { useState } from 'react'
import AuthWrapper from '@/components/AuthWrapper'
import UserMenu from '@/components/UserMenu'
import DashboardTab from './DashboardTab'
import MembersTab from './MembersTab'
import StoresTab from './StoresTab'
import RidersTab from './RidersTab'
import AdminSettingsTab from './AdminSettingsTab'

type Tab = 'dashboard' | 'members' | 'stores' | 'riders' | 'settings'

export default function AdminPage() {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '📊 ภาพรวม' },
    { key: 'members', label: '👤 สมาชิก' },
    { key: 'stores', label: '🏪 ร้านค้า' },
    { key: 'riders', label: '🛵 ไรเดอร์' },
    { key: 'settings', label: '⚙️ ตั้งค่า' },
  ]

  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <AuthWrapper requiredRole={['admin']}>
      <div className="min-h-dvh bg-[#FFF8E7] flex flex-col">
        <header className="bg-gradient-to-r from-[#9C4A35] to-[#E65100] text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">จัดการระบบ</h1>
            <p className="text-sm opacity-90">สำหรับผู้ดูแลระบบ</p>
          </div>
          <UserMenu />
        </header>

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
          {tab === 'dashboard' && <DashboardTab />}
          {tab === 'members' && <MembersTab />}
          {tab === 'stores' && <StoresTab />}
          {tab === 'riders' && <RidersTab />}
          {tab === 'settings' && <AdminSettingsTab />}
        </main>
      </div>
    </AuthWrapper>
  )
}
