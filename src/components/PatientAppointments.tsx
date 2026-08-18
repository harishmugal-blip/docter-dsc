'use client'

import { useEffect, useState } from 'react'
import { XCircle, Loader2, CalendarCheck, Clock, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [patientId, setPatientId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const statsRes = await fetch('/api/stats/patient')
        const statsData = await statsRes.json()
        if (statsData.patientId) {
          setPatientId(statsData.patientId)
          const appts = await fetch(`/api/appointments?pid=${statsData.patientId}`).then(r => r.json())
          setAppointments(appts)
        }
      } catch {
        setAppointments([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    // Reload
    if (patientId) {
      const appts = await fetch(`/api/appointments?pid=${patientId}`).then(r => r.json())
      setAppointments(appts)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-sm text-gray-500">View and manage your bookings</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-400">You don&apos;t have any appointments yet.</p>
          <p className="mt-1 text-sm text-gray-400">Browse available sessions to book one!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((a) => (
            <div key={a.appoid} className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A76D8]/10 text-[#0A76D8] font-bold text-sm">
                  {a.schedule?.doctor?.docname?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">Dr. {a.schedule?.doctor?.docname}</h3>
                  <p className="text-xs text-gray-500">{a.schedule?.doctor?.specialty?.sname || ''}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" /> {a.appodate}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {a.schedule?.scheduletime}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Appointment #{a.apponum}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => {
                    const msg = `Hi! My appointment details:
Doctor: Dr. ${a.schedule?.doctor?.docname}
Date: ${a.appodate}
Time: ${a.schedule?.scheduletime}
Token: #${a.apponum}

Thank you!`
                    const phone = (a.patient as any)?.ptel || ''
                    if (phone) window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                  }}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="mr-2 h-4 w-4" /> Share via WhatsApp
                </Button>
                <Button
                  onClick={() => handleCancel(a.appoid)}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel Booking
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}