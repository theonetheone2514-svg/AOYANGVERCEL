'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getCsrfHeaders } from './csrf-client'

interface User {
  phone: string
  type: 'customer' | 'merchant' | 'rider' | 'admin'
  id: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (phone: string, otp: string) => Promise<boolean>
  sendOtp: (phone: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.authenticated) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  async function sendOtp(phone: string): Promise<boolean> {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ phone }),
    })
    return res.ok
  }

  async function login(phone: string, otp: string): Promise<boolean> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
      body: JSON.stringify({ phone, otp }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      return true
    }
    return false
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', headers: getCsrfHeaders() })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, sendOtp, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
