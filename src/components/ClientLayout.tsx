'use client'

import { AuthProvider } from '@/lib/AuthContext'
import BottomNav from './BottomNav'
import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !pathname.startsWith('/auth/')

  return (
    <AuthProvider>
      {children}
      {showNav && <BottomNav />}
    </AuthProvider>
  )
}
