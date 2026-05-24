'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MerchantRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp' | 'form'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSendOtp() {
    setError('')
    if (phone.length < 10) {
      setError('กรุณากรอกเบอร์โทร 10 หลัก')
      return
    }
    setSending(true)
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    setSending(false)
    if (res.ok) {
      setStep('otp')
    } else {
      const data = await res.json()
      setError(data.error || 'ส่ง OTP ไม่สำเร็จ')
    }
  }

  async function handleVerify() {
    setError('')
    if (otp.length < 6) {
      setError('กรุณากรอกรหัส OTP 6 หลัก')
      return
    }
    setError('')
    setStep('form')
  }

  async function handleSubmit() {
    setError('')
    if (!name.trim()) {
      setError('กรุณากรอกชื่อร้าน')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role: 'merchant', name: name.trim(), address: address.trim() }),
    })
    setSubmitting(false)
    const data = await res.json()
    if (res.ok) {
      router.push('/merchant')
    } else {
      setError(data.error || 'สมัครไม่สำเร็จ')
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#9C4A35] to-[#E65100] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="text-3xl font-bold text-white">สมัครร้านค้า</h1>
          <p className="text-white/80 text-sm mt-1">ลงทะเบียนเปิดร้านขายอาหาร</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step === 'phone' ? 'bg-[#E65100] text-white' : step === 'form' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step === 'form' ? '✓' : '1'}
            </div>
            <div className={`h-0.5 w-8 transition ${step !== 'phone' ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step === 'otp' ? 'bg-[#E65100] text-white' : step === 'form' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step === 'form' ? '✓' : '2'}
            </div>
            <div className={`h-0.5 w-8 transition ${step === 'form' ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step === 'form' ? 'bg-[#E65100] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 border border-red-100">
              {error}
            </p>
          )}

          {step === 'phone' && (
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
                  📱 ระบบจะส่งรหัส OTP 6 หลักไปทาง <strong>LINE</strong>
                </p>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
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
                ยืนยัน OTP
              </button>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-500 hover:text-[#E65100] transition text-center"
              >
                ← แก้ไขเบอร์โทร
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-2">
                กรอกข้อมูลร้านค้า
              </div>
              <input
                type="text"
                placeholder="ชื่อร้าน *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/10 transition"
                autoFocus
              />
              <input
                type="text"
                placeholder="ที่อยู่ (ไม่บังคับ)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-lg focus:outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/10 transition"
              />
              <button
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                className="w-full bg-gradient-to-r from-[#E65100] to-[#F57C00] text-white rounded-xl py-3.5 font-semibold text-lg disabled:opacity-50 transition hover:shadow-lg active:scale-[0.98]"
              >
                {submitting ? 'กำลังสมัคร...' : 'สมัครร้านค้า'}
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <Link href="/auth/register" className="text-white/70 text-sm hover:text-white transition">
            ← เลือกประเภทอื่น
          </Link>
        </div>
      </div>
    </div>
  )
}
