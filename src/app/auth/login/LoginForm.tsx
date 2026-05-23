'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
      <div className="min-h-dvh bg-[#FFF8E7] flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#FFF8E7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#9C4A35]">เอาหยังบ่</h1>
          <p className="text-sm text-gray-500 mt-1">เข้าสู่ระบบเพื่อสั่งอาหาร</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        {step === 'phone' ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="เบอร์โทรศัพท์"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={10}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg focus:outline-none focus:border-[#E65100]"
              autoFocus
            />
            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || sending}
              className="w-full bg-[#E65100] text-white rounded-lg py-3 font-semibold text-lg disabled:opacity-50 transition"
            >
              {sending ? 'กำลังส่ง...' : 'ขอรหัส OTP'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              ระบบจะส่งรหัส OTP ไปทาง LINE บัญชีของคุณ
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-center text-gray-600">
              ใส่รหัส 6 หลักที่ส่งไปทาง LINE
            </p>
            <p className="text-sm text-center text-[#9C4A35] font-medium">{phone}</p>
            <input
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#E65100]"
              maxLength={6}
              autoFocus
            />
            <button
              onClick={handleVerify}
              disabled={otp.length < 6}
              className="w-full bg-[#E65100] text-white rounded-lg py-3 font-semibold text-lg disabled:opacity-50 transition"
            >
              ยืนยัน
            </button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="w-full text-sm text-gray-500 underline"
            >
              แก้ไขเบอร์โทร
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">
            ยังไม่มีบัญชี? สมัครอัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก
          </p>
        </div>
      </div>
    </div>
  )
}
