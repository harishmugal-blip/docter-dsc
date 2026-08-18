import { useState, useEffect } from 'react'
import {
  Building2, Stethoscope, Users, CalendarCheck, Plus, Trash2, Edit,
  RefreshCw, Loader2, Search, Eye, ToggleLeft, ToggleRight, Globe,
  DollarSign, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Types ──────────────────────────────────────────────────────────────────

interface Clinic {
  id: string
  name: string
  slug: string
  city: string
  plan: 'free' | 'standard' | 'premium' | 'enterprise'
  status: 'active' | 'inactive'
  doctors: number
  patients: number
  phone?: string
  email?: string
  address?: string
}

interface Stats {
  totalClinics: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  activeClinics: number
  inactiveClinics: number
  revenueByPlan: { plan: string; revenue: number }[]
}

interface NewClinicForm {
  name: string
  slug: string
  city: string
  plan: Clinic['plan']
  phone: string
  email: string
  address: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

const EMPTY_FORM: NewClinicForm = {
  name: '',
  slug: '',
  city: '',
  plan: 'free',
  phone: '',
  email: '',
  address: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const PLAN_STYLES: Record<Clinic['plan'], string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-200',
  standard: 'bg-blue-50 text-blue-700 border-blue-200',
  premium: 'bg-purple-50 text-purple-700 border-purple-200',
  enterprise: 'bg-amber-50 text-amber-700 border-amber-200',
}

const PLAN_DOT: Record<Clinic['plan'], string> = {
  free: 'bg-gray-400',
  standard: 'bg-blue-500',
  premium: 'bg-purple-500',
  enterprise: 'bg-amber-500',
}

// ── Component ──────────────────────────────────────────────────────────────

export function SuperAdminDashboard() {
  // Data state
  const [stats, setStats] = useState<Stats | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<NewClinicForm>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewClinicForm, string>>>({})

  // ── Data fetching ──────────────────────────────────────────────────────

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [statsRes, clinicsRes] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/clinics'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (clinicsRes.ok) {
        const clinicsData = await clinicsRes.json()
        setClinics(Array.isArray(clinicsData) ? clinicsData : clinicsData.clinics ?? [])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleRefresh = () => fetchData(true)

  const handleToggleStatus = async (clinic: Clinic) => {
    const newStatus = clinic.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch('/api/super-admin/clinics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clinic.id, status: newStatus }),
      })
      if (res.ok) {
        setClinics(prev =>
          prev.map(c => (c.id === clinic.id ? { ...c, status: newStatus } : c))
        )
      }
    } catch (err) {
      console.error('Failed to toggle clinic status:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this clinic? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/super-admin/clinics?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setClinics(prev => prev.filter(c => c.id !== id))
        fetchData(true)
      }
    } catch (err) {
      console.error('Failed to delete clinic:', err)
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof NewClinicForm, string>> = {}
    if (!form.name.trim()) errors.name = 'Clinic name is required'
    if (!form.slug.trim()) errors.slug = 'Slug is required'
    if (!form.city.trim()) errors.city = 'City is required'
    if (!form.adminName.trim()) errors.adminName = 'Admin name is required'
    if (!form.adminEmail.trim()) errors.adminEmail = 'Admin email is required'
    else if (!/\S+@\S+\.\S+/.test(form.adminEmail)) errors.adminEmail = 'Invalid email address'
    if (!form.adminPassword.trim()) errors.adminPassword = 'Admin password is required'
    else if (form.adminPassword.length < 6) errors.adminPassword = 'Password must be at least 6 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/super-admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        setForm(EMPTY_FORM)
        setFormErrors({})
        fetchData(true)
      } else {
        const data = await res.json().catch(() => null)
        alert(data?.error || 'Failed to create clinic. Please try again.')
      }
    } catch (err) {
      console.error('Failed to create clinic:', err)
      alert('Failed to create clinic. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: slugify(name) }))
    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }))
  }

  // ── Filtered clinics ───────────────────────────────────────────────────

  const filteredClinics = clinics.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.plan.toLowerCase().includes(q)
    )
  })

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#0A76D8]" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Super Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage all clinics on the Docter Esa platform</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="gap-2 bg-[#0A76D8] text-white hover:bg-[#0868BF]"
              >
                <Plus className="h-4 w-4" />
                Add Clinic
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Stats Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Total Clinics */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Clinics</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalClinics ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0A76D8]/10">
                <Building2 className="h-5 w-5 text-[#0A76D8]" />
              </div>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Doctors</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalDoctors ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Total Patients */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Patients</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalPatients ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>

          {/* Total Appointments */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Appointments</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalAppointments ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50">
                <CalendarCheck className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Active Clinics */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Active</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{stats?.activeClinics ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
                <ToggleRight className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Inactive Clinics */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Inactive</p>
                <p className="mt-2 text-2xl font-bold text-red-500">{stats?.inactiveClinics ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
                <ToggleLeft className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Plan */}
        {stats?.revenueByPlan && stats.revenueByPlan.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#0A76D8]" />
              <h3 className="text-sm font-semibold text-gray-900">Revenue by Plan</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.revenueByPlan.map(item => {
                const key = item.plan.toLowerCase() as Clinic['plan']
                return (
                  <div
                    key={item.plan}
                    className="rounded-lg border border-gray-100 p-4 text-center"
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${PLAN_DOT[key] ?? 'bg-gray-400'}`} />
                    <p className="mt-1.5 text-xs font-medium capitalize text-gray-600">{item.plan}</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      ${typeof item.revenue === 'number' ? item.revenue.toLocaleString() : item.revenue}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Clinics Table ────────────────────────────────────────────── */}
        <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Table Header */}
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">All Clinics</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {filteredClinics.length} of {clinics.length} clinics
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Slug</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">City</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Doctors</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Patients</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Building2 className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-sm font-medium text-gray-500">No clinics found</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {search ? 'Try a different search term' : 'Get started by adding your first clinic'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map(clinic => (
                    <tr
                      key={clinic.id}
                      className="group transition-colors hover:bg-gray-50/80"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{clinic.name}</p>
                        {clinic.email && (
                          <p className="mt-0.5 text-xs text-gray-400">{clinic.email}</p>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-4">
                        <a
                          href={`https://${clinic.slug}.docteresa.com`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#0A76D8] hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {clinic.slug}
                          <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      </td>

                      {/* City */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">{clinic.city}</span>
                      </td>

                      {/* Plan */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${PLAN_STYLES[clinic.plan]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${PLAN_DOT[clinic.plan]}`} />
                          {clinic.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(clinic)}
                          className="group/status inline-flex items-center gap-2"
                          title={`Click to ${clinic.status === 'active' ? 'deactivate' : 'activate'}`}
                        >
                          {clinic.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Doctors */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">{clinic.doctors}</span>
                      </td>

                      {/* Patients */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-gray-700">{clinic.patients}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#0A76D8]"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#0A76D8]"
                            title="Edit Clinic"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(clinic.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete Clinic"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add Clinic Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A76D8]/10">
                  <Plus className="h-4 w-4 text-[#0A76D8]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Add New Clinic</h2>
                  <p className="text-xs text-gray-500">Create a new clinic on the platform</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {/* Clinic Details Section */}
                <div className="mb-6">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Clinic Details</h3>
                  <div className="space-y-4">
                    {/* Name & Slug */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => handleNameChange(e.target.value)}
                          placeholder="e.g. Sunrise Medical"
                          className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                        />
                        {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug (subdomain) *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={form.slug}
                            onChange={e => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                            placeholder="sunrise-medical"
                            className={`h-10 w-full rounded-lg border px-3 pr-20 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.slug ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                            .docteresa.com
                          </span>
                        </div>
                        {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
                      </div>
                    </div>

                    {/* City & Plan */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">City *</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => {
                            setForm(prev => ({ ...prev, city: e.target.value }))
                            if (formErrors.city) setFormErrors(prev => ({ ...prev, city: undefined }))
                          }}
                          placeholder="e.g. Lahore"
                          className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.city ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                        />
                        {formErrors.city && <p className="mt-1 text-xs text-red-500">{formErrors.city}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan</label>
                        <select
                          value={form.plan}
                          onChange={e => setForm(prev => ({ ...prev, plan: e.target.value as Clinic['plan'] }))}
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]/20"
                        >
                          <option value="free">Free</option>
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+92 300 1234567"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="clinic@example.com"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]/20"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Full clinic address"
                        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A76D8] focus:outline-none focus:ring-1 focus:ring-[#0A76D8]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Details Section */}
                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Name *</label>
                      <input
                        type="text"
                        value={form.adminName}
                        onChange={e => {
                          setForm(prev => ({ ...prev, adminName: e.target.value }))
                          if (formErrors.adminName) setFormErrors(prev => ({ ...prev, adminName: undefined }))
                        }}
                        placeholder="John Doe"
                        className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.adminName ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                      />
                      {formErrors.adminName && <p className="mt-1 text-xs text-red-500">{formErrors.adminName}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Email *</label>
                        <input
                          type="email"
                          value={form.adminEmail}
                          onChange={e => {
                            setForm(prev => ({ ...prev, adminEmail: e.target.value }))
                            if (formErrors.adminEmail) setFormErrors(prev => ({ ...prev, adminEmail: undefined }))
                          }}
                          placeholder="admin@clinic.com"
                          className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.adminEmail ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                        />
                        {formErrors.adminEmail && <p className="mt-1 text-xs text-red-500">{formErrors.adminEmail}</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Admin Password *</label>
                        <input
                          type="password"
                          value={form.adminPassword}
                          onChange={e => {
                            setForm(prev => ({ ...prev, adminPassword: e.target.value }))
                            if (formErrors.adminPassword) setFormErrors(prev => ({ ...prev, adminPassword: undefined }))
                          }}
                          placeholder="Min 6 characters"
                          className={`h-10 w-full rounded-lg border px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ${formErrors.adminPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-[#0A76D8] focus:ring-[#0A76D8]/20'}`}
                        />
                        {formErrors.adminPassword && <p className="mt-1 text-xs text-red-500">{formErrors.adminPassword}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(EMPTY_FORM)
                    setFormErrors({})
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 bg-[#0A76D8] text-white hover:bg-[#0868BF] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Clinic
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminDashboard
