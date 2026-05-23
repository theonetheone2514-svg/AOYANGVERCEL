'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Zone } from '@/lib/types'

interface Props {
  rider: any
  onUpdate: (rider: any) => void
}

export default function RiderSettingsTab({ rider, onUpdate }: Props) {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState(rider?.zone_id || '')

  useEffect(() => {
    supabase.from('zones').select('*').then(({ data }) => {
      if (data) setZones(data)
    })
  }, [])

  async function toggleOnline() {
    const newOnline = !rider.online
    await supabase.from('riders').update({ online: newOnline }).eq('id', rider.id)
    onUpdate({ ...rider, online: newOnline })
  }

  async function saveZone() {
    await supabase.from('riders').update({ zone_id: selectedZone || null }).eq('id', rider.id)
    onUpdate({ ...rider, zone_id: selectedZone })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Rider info */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-[#3E2723] mb-1">ข้อมูลไรเดอร์</h3>
        <p className="text-sm text-gray-600">ชื่อ: {rider.name || 'ไม่ระบุ'}</p>
        <p className="text-sm text-gray-400">เบอร์: {rider.phone}</p>
        <p className="text-sm text-gray-400">งานที่ทำ: {rider.jobs_count || 0} ครั้ง</p>
        <p className="text-sm text-gray-400">รายได้รวม: {Number(rider.earnings || 0).toFixed(2)} บาท</p>
      </div>

      {/* Online/Offline toggle */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-[#3E2723]">สถานะ</div>
          <div className="text-sm text-gray-500">
            {rider.online ? '🟢 กำลังรับงาน' : '🔴 ไม่รับงาน'}
          </div>
        </div>
        <button
          onClick={toggleOnline}
          className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition ${
            rider.online ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {rider.online ? 'หยุดรับงาน' : 'เริ่มรับงาน'}
        </button>
      </div>

      {/* Zone selection */}
      <div className="bg-white rounded-lg border p-4 space-y-2">
        <div className="font-medium text-[#3E2723]">โซนที่ให้บริการ</div>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">ทั้งหมด</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
        <button
          onClick={saveZone}
          className="w-full bg-[#E65100] text-white rounded-lg py-2 text-sm font-medium"
        >
          บันทึก
        </button>
      </div>
    </div>
  )
}
