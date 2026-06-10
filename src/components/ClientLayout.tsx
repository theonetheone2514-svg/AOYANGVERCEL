'use client'

import { useEffect } from 'react'
import { AuthProvider } from '@/lib/AuthContext'
import BottomNav from './BottomNav'
import ToastContainer from './Toast'
import { usePathname } from 'next/navigation'
import { ensureCsrfToken } from '@/lib/csrf-client'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !pathname.startsWith('/auth/')

  useEffect(() => { ensureCsrfToken() }, [])

  return (
    <AuthProvider>
      {children}
      {showNav && <BottomNav />}
      <ToastContainer />
    </AuthProvider>
  )
}
