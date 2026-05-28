'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/auth/login?redirect=/dashboard'); return }
    if (user.type === 'admin') router.replace('/admin')
    else if (user.type === 'merchant') router.replace('/merchant')
    else if (user.type === 'rider') router.replace('/rider')
    else router.replace('/') // customer
  }, [user, loading, router])

  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex items-center justify-center">
      <p className="text-gray-400">กำลังเปลี่ยนหน้า...</p>
    </div>
  )
}
