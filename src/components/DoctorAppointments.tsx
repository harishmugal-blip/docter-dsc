'use client'

import { useEffect, useState } from 'react'
import { XCircle, Loader2 } from 'lucide-react'

export function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/stats/doctor')
      const statsData = await statsRes.json()
      if (statsData.error) { setLoading(false); return }

      const appts = await fetch(`/api/appointments?docid=${statsData.docid}`).then(r => r.json())
      setAppointments(appts)
    } catch {
      const appts = await fetch('/api/appointments').then(r => r.json())
      setAppointments(appts)
    }
    setLoading(false)
  }

  useEffect(() => { loadAppointments() }, [])

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    loadAppointments()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-sm text-gray-500">View and manage your patient appointments</p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0A76D8]" /></td></tr>
              )}
              {!loading && appointments.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No appointments found</td></tr>
              )}
              {appointments.map((a) => (
                <tr key={a.appoid} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.patient?.pname}</td>
                  <td className="px-4 py-3 text-gray-500">{a.patient?.pemail}</td>
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
