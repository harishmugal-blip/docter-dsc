'use client'

import { useEffect, useState } from 'react'
import { Plus, Eye, Trash2, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from './Modal'

interface Schedule {
  scheduleid: number
  title: string
  docid: number
  scheduledate: string
  scheduletime: string
  nop: number
  doctor: { docname: string; specialty?: { sname: string } | null }
  _count?: { appointments: number }
}

interface Doctor {
  docid: number
  docname: string
}

export function AdminSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDoc, setFilterDoc] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showView, setShowView] = useState(false)
  const [viewPatients, setViewPatients] = useState<any[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [form, setForm] = useState({ title: '', docid: '', scheduledate: '', scheduletime: '', nop: '20' })
  const [saving, setSaving] = useState(false)

  const loadSchedules = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDoc) params.set('docid', filterDoc)
    if (filterDate) params.set('date', filterDate)
    fetch(`/api/schedule?${params}`)
      .then((r) => r.json())
      .then((d) => { setSchedules(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadSchedules() }, [filterDoc, filterDate])
  useEffect(() => { fetch('/api/doctors').then((r) => r.json()).then(setDoctors) }, [])

  const handleAdd = async () => {
    setSaving(true)
    await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    setShowAdd(false)
    setForm({ title: '', docid: '', scheduledate: '', scheduletime: '', nop: '20' })
    loadSchedules()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this session and all its appointments?')) return
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    loadSchedules()
  }

  const handleViewPatients = async (s: Schedule) => {
    setSelectedSchedule(s)
    const data = await fetch(`/api/schedule/${s.scheduleid}/patients`).then((r) => r.json())
    setViewPatients(data)
    setShowView(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-sm text-gray-500">Manage doctor sessions</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-[#0A76D8] hover:bg-[#0862b3]">
          <Plus className="mr-2 h-4 w-4" /> Add Session
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label>Doctor</Label>
          <select
            value={filterDoc}
            onChange={(e) => setFilterDoc(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.docid} value={d.docid}>{d.docname}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label>Date</Label>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="mt-1" />
        </div>
        {(filterDoc || filterDate) && (
          <Button variant="outline" onClick={() => { setFilterDoc(''); setFilterDate('') }}>
            <Filter className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Booked</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && schedules.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No schedules found</td></tr>
              )}
              {schedules.map((s) => (
                <tr key={s.scheduleid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-gray-500">{s.doctor?.docname}</td>
                  <td className="px-4 py-3 text-gray-500">{s.scheduledate}</td>
                  <td className="px-4 py-3 text-gray-500">{s.scheduletime}</td>
                  <td className="px-4 py-3 text-gray-500">{s._count?.appointments || 0} / {s.nop}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleViewPatients(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View Patients"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(s.scheduleid)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Session" size="md">
        <div className="space-y-4">
          <div><Label>Doctor *</Label>
            <select value={form.docid} onChange={(e) => setForm({ ...form, docid: e.target.value })} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.docid} value={d.docid}>{d.docname}</option>)}
            </select>
          </div>
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
          <div><Label>Date *</Label><Input type="date" value={form.scheduledate} onChange={(e) => setForm({ ...form, scheduledate: e.target.value })} className="mt-1" /></div>
          <div><Label>Time *</Label><Input type="time" value={form.scheduletime} onChange={(e) => setForm({ ...form, scheduletime: e.target.value })} className="mt-1" /></div>
          <div><Label>Max Patients</Label><Input type="number" value={form.nop} onChange={(e) => setForm({ ...form, nop: e.target.value })} className="mt-1" /></div>
          <Button onClick={handleAdd} disabled={saving} className="w-full bg-[#0A76D8] hover:bg-[#0862b3]">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Session
          </Button>
        </div>
      </Modal>

      {/* View Patients Modal */}
      <Modal open={showView} onClose={() => setShowView(false)} title={`Patients - ${selectedSchedule?.title}`} size="lg">
        {viewPatients.length === 0 ? (
          <p className="py-8 text-center text-gray-400">No patients booked for this session</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Patient</th>
                <th className="pb-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viewPatients.map((a) => (
                <tr key={a.appoid}>
                  <td className="py-2">{a.apponum}</td>
                  <td className="py-2 font-medium">{a.patient?.pname}</td>
                  <td className="py-2 text-gray-500">{a.patient?.pemail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  )
}