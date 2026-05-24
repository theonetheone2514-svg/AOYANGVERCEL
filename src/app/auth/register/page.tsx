import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#9C4A35] to-[#E65100] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🍜</div>
          <h1 className="text-3xl font-bold text-white">สมัครสมาชิก</h1>
          <p className="text-white/80 text-sm mt-1">เลือกประเภทที่ต้องการสมัคร</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/register/merchant"
            className="block bg-white/95 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition active:scale-[0.98]"
          >
            <div className="text-5xl mb-3">🏪</div>
            <h2 className="text-xl font-bold text-[#9C4A35]">สมัครเป็นร้านค้า</h2>
            <p className="text-sm text-gray-500 mt-1">ขายอาหารบนแพลตฟอร์ม รับออเดอร์จากลูกค้า</p>
          </Link>

          <Link
            href="/auth/register/rider"
            className="block bg-white/95 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition active:scale-[0.98]"
          >
            <div className="text-5xl mb-3">🏍️</div>
            <h2 className="text-xl font-bold text-[#9C4A35]">สมัครเป็นไรเดอร์</h2>
            <p className="text-sm text-gray-500 mt-1">รับจ็อบส่งอาหาร หารายได้เสริม</p>
          </Link>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-white/70 text-sm hover:text-white transition"
            >
              ← มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
