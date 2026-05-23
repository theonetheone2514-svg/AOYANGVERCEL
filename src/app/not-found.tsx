import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-[#9C4A35]">404</h1>
      <p className="text-lg text-gray-600 mt-2">หาหน้าไม่เจอ</p>
      <Link
        href="/"
        className="mt-6 bg-[#E65100] text-white rounded-lg px-6 py-2 font-semibold"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  )
}
