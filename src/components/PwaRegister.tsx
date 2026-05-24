'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    )
      return

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.installing) console.log('[PWA] SW installing')
      else if (reg.waiting) console.log('[PWA] SW waiting')
      else if (reg.active) console.log('[PWA] SW active')
    }).catch((err) => {
      console.error('[PWA] SW registration failed:', err)
    })
  }, [])

  return null
}
