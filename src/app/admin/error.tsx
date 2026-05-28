'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-red-400">😵 เกิดข้อผิดพลาด</h1>
      <p className="text-gray-400 mt-2">กรุณาลองใหม่อีกครั้ง</p>
      <button
        onClick={reset}
        className="mt-6 bg-[#E65100] text-white rounded-lg px-6 py-2 font-semibold"
      >
        ลองใหม่
      </button>
    </div>
  )
}
