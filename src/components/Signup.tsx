'use client'

import { useState } from 'react'
import { useAuth, SignupData } from './AuthContext'
import { Heart, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignupProps {
  onNavigate: (view: 'login' | 'landing') => void
  onSignupSuccess: () => void
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookies = document.cookie.split('; ')
  return cookies.find(c => c.startsWith(`${name}=`))?.split('=')[1]
}

export function Signup({ onNavigate, onSignupSuccess }: SignupProps) {
  const { signup } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    pname: '',
    pnic: '',
    pdob: '',
    ptel: '',
    paddress: '',
    pemail: '',
    ppassword: '',
  })

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setError('')
    if (step === 1) {
      if (!form.pname) { setError('Name is required'); return }
      setStep(2)
      return
    }

    if (!form.pemail || !form.ppassword) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    const clinicid = getCookie('edoc_clinic_id')
    const signupData: SignupData = { ...form, clinicid }
    const result = await signup(signupData)
    setLoading(false)
    if (result.success) {
      onSignupSuccess()
    } else {
      setError(result.error || 'Signup failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <button onClick={() => onNavigate('landing')} className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0A76D8]" fill="#0A76D8" />
            <span className="text-2xl font-bold text-[#0A76D8]">Docter Esa</span>
          </button>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Steps indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-[#0A76D8]' : 'bg-gray-200'}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-[#0A76D8]' : 'bg-gray-200'}`} />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Personal Details' : 'Create Account'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <Label htmlFor="pname">Full Name *</Label>
                  <Input
                    id="pname"
                    placeholder="Enter your full name"
                    value={form.pname}
                    onChange={(e) => updateField('pname', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pnic">NIC Number</Label>
                  <Input
                    id="pnic"
                    placeholder="Enter NIC number"
                    value={form.pnic}
                    onChange={(e) => updateField('pnic', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="pdob">Date of Birth</Label>
                  <Input
                    id="pdob"
                    type="date"
                    value={form.pdob}
                    onChange={(e) => updateField('pdob', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ptel">Telephone</Label>
                  <Input
                    id="ptel"
                    placeholder="Enter phone number"
                    value={form.ptel}
                    onChange={(e) => updateField('ptel', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="paddress">Address</Label>
                  <Input
                    id="paddress"
                    placeholder="Enter your address"
                    value={form.paddress}
                    onChange={(e) => updateField('paddress', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="pemail">Email Address *</Label>
                  <Input
                    id="pemail"
                    type="email"
                    placeholder="Enter your email"
                    value={form.pemail}
                    onChange={(e) => updateField('pemail', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="ppassword">Password *</Label>
                  <Input
                    id="ppassword"
                    type="password"
                    placeholder="Create a password"
                    value={form.ppassword}
                    onChange={(e) => updateField('ppassword', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className={step === 1 ? 'w-full bg-[#0A76D8] hover:bg-[#0862b3]' : 'flex-1 bg-[#0A76D8] hover:bg-[#0862b3]'}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 1 ? (
                  <>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <button
              onClick={() => onNavigate('login')}
              className="font-medium text-[#0A76D8] hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}