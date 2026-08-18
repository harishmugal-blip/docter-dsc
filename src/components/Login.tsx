'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginProps {
  onNavigate: (view: 'landing' | 'signup') => void
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split('; ')
  return cookies.find(c => c.startsWith(`${name}=`))?.split('=')[1]
}

export function Login({ onNavigate }: LoginProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clinicName, setClinicName] = useState<string | null>(null)

  useEffect(() => {
    // Read clinic info from cookies
    const name = getCookie('edoc_clinic_name')
    if (name) setClinicName(decodeURIComponent(name))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const clinicid = getCookie('edoc_clinic_id')
    const result = await login(email, password, clinicid)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <button onClick={() => onNavigate('landing')} className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0A76D8]" fill="#0A76D8" />
            <span className="text-2xl font-bold text-[#0A76D8]">Docter Esa</span>
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-1 text-sm text-gray-500">
              {clinicName ? `Sign in to ${clinicName}` : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A76D8] hover:bg-[#0862b3]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don&apos;t have an account? </span>
            <button
              onClick={() => onNavigate('signup')}
              className="font-medium text-[#0A76D8] hover:underline"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-gray-500">Demo Accounts (use ?clinic=falaha in URL):</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Clinic Admin:</span> falaha-admin@test.com / admin123</p>
            <p><span className="font-medium">Doctor:</span> dr.amit@falaha.com / doc123</p>
            <p><span className="font-medium">Patient:</span> rajesh@test.com / pat123</p>
            <p><span className="font-medium">Super Admin:</span> super@docteresa.com / super123</p>
          </div>
          <p className="mt-2 text-xs text-gray-400">Or select clinic from <a href="/" className="text-[#0A76D8] underline">main page</a></p>
        </div>
      </div>
    </div>
  )
}
