'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">😴</div>
      <h1 className="text-2xl font-bold text-[#9C4A35] mb-2">ไม่มีเน็ต</h1>
      <p className="text-gray-600 mb-6">ขอโทษเด้อ ตอนนี้เน็ตขาด ลองใหม่ได้เด้อ</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-gradient-to-r from-[#9C4A35] to-[#E65100] text-white px-8 py-3 rounded-full font-medium"
      >
        ลองใหม่
      </button>
    </div>
  )
}
