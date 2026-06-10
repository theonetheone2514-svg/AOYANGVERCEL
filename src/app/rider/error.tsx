'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function RiderError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-[#9C4A35]">😵 เกิดข้อผิดพลาด</h1>
      <p className="text-gray-600 mt-2">กรุณาลองใหม่อีกครั้ง</p>
      <button
        onClick={reset}
        className="mt-6 bg-[#E65100] text-white rounded-lg px-6 py-2 font-semibold"
      >
        ลองใหม่
      </button>
    </div>
  )
}
