'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface AuthWrapperProps {
  children: React.ReactNode
  requiredRole?: ('customer' | 'merchant' | 'rider' | 'admin')[]
}

export default function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  if (loading) return <LoadingSpinner text="กำลังตรวจสอบ..." />

  if (!user) return null

  if (requiredRole && !requiredRole.includes(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#FFF8E7] p-4">
        <div className="text-center">
          <p className="text-lg text-red-600">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-sm text-[#E65100] underline"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
