'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type UserType = 'super' | 'ca' | 'd' | 'p' | null

interface UserData {
  email: string
  usertype: UserType
  name: string
  clinicid: string
  clinicName?: string
  clinicSlug?: string
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  login: (email: string, password: string, clinicid?: string) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
}

export interface SignupData {
  pname: string
  pemail: string
  ppassword: string
  paddress: string
  pnic: string
  pdob: string
  ptel: string
  clinicid?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split('; ')
  return cookies.find(c => c.startsWith(`${name}=`))?.split('=')[1]
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      // Check for super admin first
      const isSuper = getCookie('edoc_super') === '1'
      if (isSuper) {
        const res = await fetch('/api/super-admin/auth')
        if (res.ok) {
          const data = await res.json()
          setUser({
            usertype: 'super',
            email: data.email || getCookie('edoc_super_email') || '',
            name: data.name || 'Super Admin',
            clinicid: '',
          })
        } else {
          setUser(null)
        }
      } else {
        // Regular user auth via cookies
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser({
            usertype: data.usertype,
            email: data.email,
            name: data.name || '',
            clinicid: data.clinicid || getCookie('edoc_clinic_id') || '',
            clinicName: data.clinicName,
            clinicSlug: data.clinicSlug,
          })
        } else {
          setUser(null)
        }
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string, clinicid?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, clinicid }),
      })
      const data = await res.json()
      if (res.ok) {
        // Wait for cookies to be stored before setting user state
        // This prevents race condition where dashboard fetches stats before cookies are ready
        await checkAuth()
        return { success: true }
      }
      return { success: false, error: data.error || 'Login failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const signup = async (formData: SignupData) => {
    try {
      const { clinicid, ...rest } = formData
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, clinicid }),
      })
      const data = await res.json()
      if (res.ok) {
        return { success: true }
      }
      return { success: false, error: data.error || 'Signup failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
