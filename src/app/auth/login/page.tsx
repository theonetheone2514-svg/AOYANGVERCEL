'use client'

import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-[#FFF8E7] flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
