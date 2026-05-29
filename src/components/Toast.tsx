'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

interface ToastData {
  id: string
  title: string
  message: string
  total?: number
}

let toastListeners: ((data: ToastData) => void)[] = []

export function showOrderToast(data: ToastData) {
  toastListeners.forEach((fn) => fn(data))
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastData & { showing: boolean })[]>([])

  useEffect(() => {
    const handler = (data: ToastData) => {
      setToasts((prev) => [...prev, { ...data, showing: true }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== data.id))
      }, 5000)
    }
    toastListeners.push(handler)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-xl shadow-xl border border-orange-100 p-4 animate-slide-in flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#E65100]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#3E2723] text-sm">{toast.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{toast.message}</p>
            {toast.total !== undefined && (
              <p className="text-sm font-semibold text-[#E65100] mt-1">
                {toast.total.toLocaleString()} บาท
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
