'use client'

import { useEffect, useState } from 'react'
import { Loader2, UserCog, Eye, Trash2, Settings } from 'lucide-react'
import { useAuth } from './AuthContext'

interface DoctorProfile {
  docid: number
  docemail: string
  docname: string
  docnic: string
  doctel: string
  specialties: number | null
  specialtyName?: string
}

export function DoctorSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'home' | 'edit' | 'view' | 'delete'>('home')
  const [editForm, setEditForm] = useState({ name: '', email: '', nic: '', tel: '', password: '', cpassword: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(async (me) => {
        if (!me.email) return
        const res = await fetch(`/api/doctors?email=${me.email}`)
        const data = await res.json()
        if (data.doctors?.[0]) {
          setProfile(data.doctors[0])
          setEditForm({
            name: data.doctors[0].docname,
            email: data.doctors[0].docemail,
            nic: data.doctors[0].docnic || '',
            tel: data.doctors[0].doctel || '',
            password: '',
            cpassword: '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleEdit = async () => {
    if (editForm.password && editForm.password !== editForm.cpassword) {
      setMsg('Passwords do not match')
      return
    }
    setMsg('')
    const res = await fetch(`/api/doctors/${profile?.docid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        docname: editForm.name,
        docemail: editForm.email,
        docnic: editForm.nic,
        doctel: editForm.tel,
        docpassword: editForm.password || undefined,
        oldEmail: profile?.docemail,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg('Updated successfully!')
      setProfile(data.doctor)
      setTimeout(() => setMode('home'), 1000)
    } else {
      setMsg(data.error || 'Update failed')
    }
  }

  const handleDelete = async () => {
    if (!profile) return
    const res = await fetch(`/api/doctors/${profile.docid}`, { method: 'DELETE' })
    if (res.ok) {
      const { logout } = useAuth as unknown as never
      window.location.href = '/'
    }
  }

  if (loading) return <LoadingSpinner />
  if (!profile) return <div className="p-8 text-center text-gray-500">Failed to load profile</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {mode === 'home' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <button onClick={() => setMode('edit')} className="flex items-center gap-4 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A76D8]"><UserCog className="h-6 w-6 text-white" /></div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Account Settings</p>
              <p className="text-sm text-gray-500">Edit details & change password</p>
            </div>
          </button>
          <button onClick={() => setMode('view')} className="flex items-center gap-4 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500"><Eye className="h-6 w-6 text-white" /></div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Account</p>
              <p className="text-sm text-gray-500">View personal information</p>
            </div>
          </button>
          <button onClick={() => setMode('delete')} className="flex items-center gap-4 rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500"><Trash2 className="h-6 w-6 text-white" /></div>
            <div className="text-left">
              <p className="font-semibold text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently remove account</p>
            </div>
          </button>
        </div>
      )}

      {mode === 'view' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="h-6 w-6 text-[#0A76D8]" />
            <h3 className="text-lg font-semibold">Account Details</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Doctor ID" value={`D-${String(profile.docid).padStart(4, '0')}`} />
            <InfoRow label="Name" value={profile.docname} />
            <InfoRow label="Email" value={profile.docemail} />
            <InfoRow label="NIC" value={profile.docnic || 'N/A'} />
            <InfoRow label="Telephone" value={profile.doctel || 'N/A'} />
            <InfoRow label="Specialty" value={profile.specialtyName || 'N/A'} />
          </div>
          <button onClick={() => setMode('home')} className="mt-6 rounded-lg bg-[#0A76D8] px-6 py-2 text-sm font-medium text-white hover:bg-[#006dd3]">Back</button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Edit Account</h3>
          {msg && <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
            <InputField label="Email" value={editForm.email} onChange={v => setEditForm({ ...editForm, email: v })} type="email" />
            <InputField label="NIC" value={editForm.nic} onChange={v => setEditForm({ ...editForm, nic: v })} />
            <InputField label="Telephone" value={editForm.tel} onChange={v => setEditForm({ ...editForm, tel: v })} />
            <InputField label="New Password (leave blank to keep)" value={editForm.password} onChange={v => setEditForm({ ...editForm, password: v })} type="password" />
            <InputField label="Confirm Password" value={editForm.cpassword} onChange={v => setEditForm({ ...editForm, cpassword: v })} type="password" />
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleEdit} className="rounded-lg bg-[#0A76D8] px-6 py-2 text-sm font-medium text-white hover:bg-[#006dd3]">Save Changes</button>
            <button onClick={() => setMode('home')} className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'delete' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-red-700">Delete Account</h3>
          <p className="mb-4 text-sm text-red-600">Are you sure you want to permanently delete your account ({profile.docname})? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">Yes, Delete</button>
            <button onClick={() => setMode('home')} className="rounded-lg border px-6 py-2 text-sm font-medium text-gray-600 hover:bg-white">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]" />
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
    </div>
  )
}
