'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from './Modal'

interface Doctor {
  docid: number
  docemail: string
  docname: string
  docnic: string
  doctel: string
  specialties: number | null
  specialty?: { id: number; sname: string } | null
  _count?: { schedules: number }
}

interface Specialty {
  id: number
  sname: string
}

export function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null)
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [form, setForm] = useState({ docname: '', docemail: '', docpassword: '', docnic: '', doctel: '', specialties: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/doctors?search=${search}`)
      .then((r) => r.json())
      .then((d) => { setDoctors(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  useEffect(() => {
    fetch('/api/specialties').then((r) => r.json()).then(setSpecialties)
  }, [])

  const openAdd = () => {
    setForm({ docname: '', docemail: '', docpassword: '', docnic: '', doctel: '', specialties: '' })
    setModal('add')
  }

  const openEdit = (d: Doctor) => {
    setSelected(d)
    setForm({ docname: d.docname, docemail: d.docemail, docpassword: '', docnic: d.docnic, doctel: d.doctel, specialties: d.specialties?.toString() || '' })
    setModal('edit')
  }

  const openView = (d: Doctor) => {
    setSelected(d)
    setModal('view')
  }

  const handleSave = async () => {
    setSaving(true)
    if (modal === 'add') {
      await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else if (modal === 'edit' && selected) {
      await fetch(`/api/doctors/${selected.docid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setSaving(false)
    setModal(null)
    // Re-fetch
    setLoading(true)
    fetch(`/api/doctors?search=${search}`)
      .then((r) => r.json())
      .then((d) => { setDoctors(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this doctor?')) return
    await fetch(`/api/doctors/${id}`, { method: 'DELETE' })
    setLoading(true)
    fetch(`/api/doctors?search=${search}`)
      .then((r) => r.json())
      .then((d) => { setDoctors(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">Manage all registered doctors</p>
        </div>
        <Button onClick={openAdd} className="bg-[#0A76D8] hover:bg-[#0862b3]">
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search doctors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Tel</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && doctors.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No doctors found</td></tr>
              )}
              {doctors.map((d) => (
                <tr key={d.docid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{d.docname}</td>
                  <td className="px-4 py-3 text-gray-500">{d.docemail}</td>
                  <td className="px-4 py-3 text-gray-500">{d.specialty?.sname || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.doctel || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{d._count?.schedules || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openView(d)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(d)} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(d.docid)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Doctor" size="lg">
        <div className="space-y-4">
          <div><Label>Name *</Label><Input value={form.docname} onChange={(e) => setForm({ ...form, docname: e.target.value })} className="mt-1" /></div>
          <div><Label>Email *</Label><Input type="email" value={form.docemail} onChange={(e) => setForm({ ...form, docemail: e.target.value })} className="mt-1" /></div>
          <div><Label>Password *</Label><Input type="password" value={form.docpassword} onChange={(e) => setForm({ ...form, docpassword: e.target.value })} className="mt-1" /></div>
          <div><Label>NIC</Label><Input value={form.docnic} onChange={(e) => setForm({ ...form, docnic: e.target.value })} className="mt-1" /></div>
          <div><Label>Telephone</Label><Input value={form.doctel} onChange={(e) => setForm({ ...form, doctel: e.target.value })} className="mt-1" /></div>
          <div>
            <Label>Specialty</Label>
            <select
              value={form.specialties}
              onChange={(e) => setForm({ ...form, specialties: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">Select specialty</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.sname}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#0A76D8] hover:bg-[#0862b3]">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Doctor
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Doctor" size="lg">
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.docname} onChange={(e) => setForm({ ...form, docname: e.target.value })} className="mt-1" /></div>
          <div><Label>NIC</Label><Input value={form.docnic} onChange={(e) => setForm({ ...form, docnic: e.target.value })} className="mt-1" /></div>
          <div><Label>Telephone</Label><Input value={form.doctel} onChange={(e) => setForm({ ...form, doctel: e.target.value })} className="mt-1" /></div>
          <div>
            <Label>Specialty</Label>
            <select
              value={form.specialties}
              onChange={(e) => setForm({ ...form, specialties: e.target.value })}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">Select specialty</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.sname}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#0A76D8] hover:bg-[#0862b3]">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title="Doctor Details" size="md">
        {selected && (
          <div className="space-y-3">
            <DetailRow label="Name" value={selected.docname} />
            <DetailRow label="Email" value={selected.docemail} />
            <DetailRow label="NIC" value={selected.docnic || '-'} />
            <DetailRow label="Telephone" value={selected.doctel || '-'} />
            <DetailRow label="Specialty" value={selected.specialty?.sname || '-'} />
            <DetailRow label="Sessions" value={String(selected._count?.schedules || 0)} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}