import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto text-center space-y-6">
        <img src="/logo.png" alt="เอาหยังบ่" className="h-20 w-20" />
        <h1 className="text-3xl font-bold text-[#3E2723]">เอาหยังบ่</h1>
        <p className="text-gray-600 text-base leading-relaxed">
          แพลตฟอร์มสั่งอาหารบ้านสูงเนิน สกลนคร<br />
          ส่งถึงโต๊ะเด้อ สั่งโลด
        </p>

        <div className="w-full space-y-3 bg-white rounded-2xl border border-orange-100 p-5 text-left text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <span className="text-lg">🕐</span>
            <span>เปิด 08:00 - 22:00 น.<br className="sm:hidden" /><span className="text-gray-400 text-xs ml-1">(ดึกกว่านี้สิคุยกันก่อน)</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">📞</span>
            <span>092-989-2085</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">📍</span>
            <span>บ้านสูงเนิน สกลนคร</span>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition active:scale-95"
        >
          🍜 กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
