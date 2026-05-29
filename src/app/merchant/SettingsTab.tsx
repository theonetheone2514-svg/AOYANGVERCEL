'use client'

import { useState } from 'react'
import { getCsrfHeaders } from '@/lib/csrf-client'

interface Props {
  store: any
  onUpdate: (store: any) => void
}

export default function SettingsTab({ store, onUpdate }: Props) {
  const [waitTime, setWaitTime] = useState(store?.wait_time || 20)
  const [saving, setSaving] = useState(false)

  async function toggleStatus() {
    const newStatus = store.status === 'open' ? 'closed' : 'open'
    await fetch(`/api/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ status: newStatus }),
    })
    onUpdate({ ...store, status: newStatus })
  }

  async function saveWaitTime() {
    setSaving(true)
    await fetch(`/api/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ wait_time: waitTime }),
    })
    onUpdate({ ...store, wait_time: waitTime })
    setSaving(false)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Store info */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-[#3E2723] mb-1">ข้อมูลร้าน</h3>
        <p className="text-sm text-gray-600">{store.name}</p>
        <p className="text-sm text-gray-400">เบอร์: {store.phone}</p>
      </div>

      {/* Open/Close toggle */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-[#3E2723]">สถานะร้าน</div>
          <div className="text-sm text-gray-500">
            {store.status === 'open' ? '🟢 เปิดอยู่' : '🔴 ปิดอยู่'}
          </div>
        </div>
        <button
          onClick={toggleStatus}
          className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition ${
            store.status === 'open' ? 'bg-red-500' : 'bg-green-600'
          }`}
        >
          {store.status === 'open' ? 'ปิดร้าน' : 'เปิดร้าน'}
        </button>
      </div>

      {/* Wait time */}
      <div className="bg-white rounded-lg border p-4 space-y-2">
        <div className="font-medium text-[#3E2723]">เวลาในการเตรียมอาหาร</div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={waitTime}
            onChange={(e) => setWaitTime(Number(e.target.value))}
            className="border rounded px-3 py-2 w-20 text-center"
            min={5}
            max={60}
          />
          <span className="text-sm text-gray-500">นาที</span>
          <button
            onClick={saveWaitTime}
            disabled={saving}
            className="ml-auto bg-[#E65100] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'บันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
