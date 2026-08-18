'use client'

import { useEffect, useState } from 'react'
import { Eye, Trash2, Loader2 } from 'lucide-react'
import { Modal } from './Modal'

interface Schedule {
  scheduleid: number
  title: string
  scheduledate: string
  scheduletime: string
  nop: number
  _count?: { appointments: number }
}

export function DoctorSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showView, setShowView] = useState(false)
  const [viewPatients, setViewPatients] = useState<any[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [docId, setDocId] = useState<number | null>(null)

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/stats/doctor')
      const statsData = await statsRes.json()
      if (statsData.error) { setLoading(false); return }
      setDocId(statsData.docid)

      const schedRes = await fetch(`/api/schedule?docid=${statsData.docid}`)
      const schedData = await schedRes.json()
      setSchedules(schedData)
    } catch {
      setSchedules([])
    }
    setLoading(false)
  }

  useEffect(() => { loadSchedules() }, [])

  const handleViewPatients = async (s: Schedule) => {
    setSelectedSchedule(s)
    const data = await fetch(`/api/schedule/${s.scheduleid}/patients`).then((r) => r.json())
    setViewPatients(data)
    setShowView(true)
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this session and all its appointments?')) return
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    loadSchedules()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500">Manage your sessions and view patients</p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Booked / Capacity</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && schedules.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No sessions found</td></tr>
              )}
              {schedules.map((s) => (
                <tr key={s.scheduleid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.title}</td>
                  <td className="px-4 py-3 text-gray-500">{s.scheduledate}</td>
                  <td className="px-4 py-3 text-gray-500">{s.scheduletime}</td>
                  <td className="px-4 py-3 text-gray-500">{s._count?.appointments || 0} / {s.nop}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleViewPatients(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View Patients"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleCancel(s.scheduleid)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Cancel Session"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Patients Modal */}
      <Modal open={showView} onClose={() => setShowView(false)} title={`Patients - ${selectedSchedule?.title}`} size="lg">
        {viewPatients.length === 0 ? (
          <p className="py-8 text-center text-gray-400">No patients booked</p>
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