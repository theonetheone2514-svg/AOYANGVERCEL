'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export default function LoginForm() {
  const { user, loading, sendOtp, login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  async function handleSendOtp() {
    setError('')
    setSending(true)
    const ok = await sendOtp(phone)
    setSending(false)
    if (ok) {
      setStep('otp')
    } else {
      setError('ส่ง OTP ไม่สำเร็จ ลองใหม่อีกครั้ง')
    }
  }

  async function handleVerify() {
    setError('')
    const ok = await login(phone, otp)
    if (ok) {
      router.push(redirectTo)
    } else {
      setError('รหัส OTP ไม่ถูกต้องหรือหมดอายุ')
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-[#9C4A35] to-[#E65100] flex items-center justify-center">
        <p className="text-white/70">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#9C4A35] to-[#E65100] flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🍜</div>
          <h1 className="text-3xl font-bold text-white">เอาหยังบ่</h1>
          <p className="text-white/80 text-sm mt-1">เข้าสู่ระบบเพื่อสั่งอาหาร</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step === 'phone' ? 'bg-[#E65100] text-white' : 'bg-green-500 text-white'
            }`}>
              {step === 'phone' ? '1' : '✓'}
            </div>
            <div className={`h-0.5 w-8 transition ${step === 'otp' ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step === 'otp' ? 'bg-[#E65100] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 border border-red-100">
              {error}
            </p>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                ใส่เบอร์โทรศัพท์ของคุณ
              </div>
              <input
                type="tel"
                placeholder="เบอร์โทรศัพท์ 10 หลัก"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center text-lg focus:outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/10 transition"
                autoFocus
              />
              <button
                onClick={handleSendOtp}
                disabled={phone.length < 10 || sending}
                className="w-full bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white rounded-xl py-3.5 font-semibold text-lg disabled:opacity-50 transition hover:shadow-lg active:scale-[0.98]"
              >
                {sending ? 'กำลังส่ง...' : 'ขอรหัส OTP'}
              </button>
              <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <p className="text-xs text-amber-800 leading-relaxed">
                  📱 ระบบจะส่งรหัส OTP 6 หลักไปทาง <strong>LINE</strong> บัญชีของคุณ 
                  (ต้อง Add Friend LINE Official Account ก่อน)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <p className="text-sm text-gray-600">ใส่รหัส 6 หลักที่ส่งไปทาง LINE</p>
                <p className="text-sm text-[#9C4A35] font-semibold mt-1">{phone}</p>
              </div>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/10 transition font-mono"
                maxLength={6}
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={otp.length < 6}
                className="w-full bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white rounded-xl py-3.5 font-semibold text-lg disabled:opacity-50 transition hover:shadow-lg active:scale-[0.98]"
              >
                ยืนยัน
              </button>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-[#E65100] transition text-center"
              >
                ← แก้ไขเบอร์โทร
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-white/60">
            ต้องการสมัครสมาชิก?
          </p>
          <div className="flex items-center justify-center gap-3 text-xs">
            <Link href="/auth/register" className="text-white/80 hover:text-white underline underline-offset-2 transition">
              สมัครร้านค้า
            </Link>
            <span className="text-white/30">|</span>
            <Link href="/auth/register" className="text-white/80 hover:text-white underline underline-offset-2 transition">
              สมัครไรเดอร์
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
