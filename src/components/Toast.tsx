'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ToastData {
  id: string
  title: string
  message: string
  total?: number
}

type GenericToastType = 'success' | 'error' | 'info'

interface GenericToast {
  id: string
  message: string
  type: GenericToastType
}

let toastListeners: ((data: ToastData) => void)[] = []
let genericToastListeners: ((data: GenericToast) => void)[] = []

export function showOrderToast(data: ToastData) {
  toastListeners.forEach((fn) => fn(data))
}

export function showToast(message: string, type: GenericToastType = 'info') {
  const data: GenericToast = { id: crypto.randomUUID(), message, type }
  genericToastListeners.forEach((fn) => fn(data))
}

const typeConfig: Record<GenericToastType, { icon: typeof Bell; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  error: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
}

export default function ToastContainer() {
  const [orderToasts, setOrderToasts] = useState<(ToastData & { showing: boolean })[]>([])
  const [genericToasts, setGenericToasts] = useState<(GenericToast & { showing: boolean })[]>([])

  useEffect(() => {
    const handler = (data: ToastData) => {
      setOrderToasts((prev) => [...prev, { ...data, showing: true }])
      setTimeout(() => {
        setOrderToasts((prev) => prev.filter((t) => t.id !== data.id))
      }, 5000)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler) }
  }, [])

  useEffect(() => {
    const handler = (data: GenericToast) => {
      setGenericToasts((prev) => [...prev, { ...data, showing: true }])
      setTimeout(() => {
        setGenericToasts((prev) => prev.filter((t) => t.id !== data.id))
      }, 3000)
    }
    genericToastListeners.push(handler)
    return () => { genericToastListeners = genericToastListeners.filter((fn) => fn !== handler) }
  }, [])

  if (orderToasts.length === 0 && genericToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {genericToasts.map((toast) => {
        const cfg = typeConfig[toast.type]
        const Icon = cfg.icon
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} rounded-xl shadow-xl border ${cfg.border} p-4 animate-slide-in flex items-start gap-3`}
          >
            <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${cfg.text}`} />
            </div>
            <p className={`text-sm ${cfg.text} flex-1`}>{toast.message}</p>
          </div>
        )
      })}
      {orderToasts.map((toast) => (
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
