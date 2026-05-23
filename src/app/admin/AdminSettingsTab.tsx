'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((s) => { map[s.key] = s.value })
        setSettings(map)
      }
    })
  }, [])

  async function save() {
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    setSaving(false)
  }

  const fields = [
    { key: 'delivery_fee', label: 'ค่าส่ง (บาท)', desc: 'ค่าส่งเริ่มต้นต่อออเดอร์' },
    { key: 'radius', label: 'รัศมี (กม.)', desc: 'รัศมีการจัดส่งเริ่มต้น' },
    { key: 'commission_rate', label: 'ค่าคอมมิชชั่น', desc: 'เช่น 0.15 = 15%' },
    { key: 'markup', label: 'ส่วนเพิ่ม (%)', desc: 'ส่วนเพิ่มราคาอาหาร' },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-[#3E2723]">ตั้งค่าระบบ</h3>

        {fields.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              type="text"
              value={settings[field.key] || ''}
              onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
            />
            <p className="text-xs text-gray-400 mt-0.5">{field.desc}</p>
          </div>
        ))}

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#E65100] text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'บันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

      {/* Store management link */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-sm text-[#3E2723] mb-2">จัดการร้านค้า</h3>
        <p className="text-xs text-gray-500 mb-2">แก้ไขข้อมูลร้านค้า รายการอาหาร ผ่านหน้า merchant</p>
        <a href="/merchant" className="text-sm text-[#E65100] underline">ไปหน้าร้านค้า →</a>
      </div>
    </div>
  )
}
