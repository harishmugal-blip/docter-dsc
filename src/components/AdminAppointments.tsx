'use client'

import { useEffect, useState } from 'react'
import { Loader2, Filter, XCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function AdminAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<{ docid: number; docname: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDoc, setFilterDoc] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const loadAppointments = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterDoc) params.set('docid', filterDoc)
    if (filterDate) params.set('date', filterDate)
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((d) => { setAppointments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadAppointments() }, [filterDoc, filterDate])
  useEffect(() => { fetch('/api/doctors').then((r) => r.json()).then(setDoctors) }, [])

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    loadAppointments()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500">Manage all appointments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label>Doctor</Label>
          <select value={filterDoc} onChange={(e) => setFilterDoc(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All Doctors</option>
            {doctors.map((d) => <option key={d.docid} value={d.docid}>{d.docname}</option>)}
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
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && appointments.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No appointments found</td></tr>
              )}
              {appointments.map((a) => (
                <tr key={a.appoid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.patient?.pname}</td>
                  <td className="px-4 py-3 text-gray-500">{a.schedule?.doctor?.docname}</td>
                  <td className="px-4 py-3 text-gray-500">{a.schedule?.doctor?.specialty?.sname || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.appodate}</td>
                  <td className="px-4 py-3 text-gray-500">{a.schedule?.scheduletime}</td>
                  <td className="px-4 py-3 text-gray-500">{a.apponum}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => handleCancel(a.appoid)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Cancel">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}