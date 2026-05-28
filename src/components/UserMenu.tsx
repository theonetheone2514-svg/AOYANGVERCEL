'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (!user) return null

  const typeLabel: Record<string, string> = {
    customer: 'ลูกค้า',
    merchant: 'ร้านค้า',
    rider: 'ไรเดอร์',
    admin: 'ผู้ดูแล',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-[#E65100] text-white text-sm font-bold flex items-center justify-center"
      >
        {user.phone.slice(-2)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-white rounded-lg shadow-lg border min-w-48 p-2">
            <div className="px-3 py-2 text-sm text-gray-600 border-b">
              <div className="font-medium text-[#3E2723]">{user.phone}</div>
              <div className="text-xs text-gray-400">{typeLabel[user.type] || user.type}</div>
            </div>
            <button
              onClick={() => { setOpen(false); router.push('/orders') }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded transition flex items-center gap-2"
            >
              📋 ประวัติออเดอร์
            </button>
            <button
              onClick={() => { setOpen(false); logout(); router.push('/') }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        </>
      )}
    </div>
  )
}
