'use client'

import { useEffect, useState } from 'react'
import { Loader2, CalendarCheck, Clock, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from './AuthContext'

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

export function PatientSchedule() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [patientId, setPatientId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const [bookSaving, setBookSaving] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/stats/patient')
      const statsData = await statsRes.json()
      setPatientId(statsData.patientId)

      const schedRes = await fetch('/api/schedule')
      const schedData = await schedRes.json()
      setSchedules(schedData)
    } catch {
      setSchedules([])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const today = new Date().toISOString().split('T')[0]
  const futureSchedules = schedules.filter(s => s.scheduledate >= today)

  const filtered = futureSchedules.filter(s => {
    const matchSearch = !search ||
      s.doctor?.docname.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  const handleBook = async (scheduleId: number, scheduleDate: string) => {
    if (!patientId) return
    setBookSaving(true)
    setBookingId(scheduleId)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: patientId, scheduleid: scheduleId, appodate: scheduleDate }),
      })
      if (res.ok) {
        alert('Appointment booked successfully!')
        loadData()
      } else {
        const data = await res.json()
        alert(data.error || 'Booking failed')
      }
    } catch {
      alert('Network error')
    }
    setBookSaving(false)
    setBookingId(null)
  }

  const isFull = (s: Schedule) => (s._count?.appointments || 0) >= s.nop

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available Sessions</h1>
        <p className="text-sm text-gray-500">Browse and book doctor sessions</p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-400">No available sessions found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const full = isFull(s)
            const booked = s._count?.appointments || 0
            return (
              <div key={s.scheduleid} className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A76D8]/10 text-[#0A76D8] font-bold text-sm">
                    {s.doctor?.docname?.charAt(0)}
                  </div>
                  {full && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Full</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-[#0A76D8]">Dr. {s.doctor?.docname}</p>
                <p className="text-xs text-gray-500">{s.doctor?.specialty?.sname || ''}</p>
                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" /> {s.scheduledate}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {s.scheduletime}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> {booked} / {s.nop} booked
                  </div>
                </div>
                <Button
                  onClick={() => handleBook(s.scheduleid, s.scheduledate)}
                  disabled={full || bookSaving}
                  className="mt-4 w-full bg-[#0A76D8] hover:bg-[#0862b3] disabled:bg-gray-300"
                  size="sm"
                >
                  {bookSaving && bookingId === s.scheduleid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : full ? (
                    'Session Full'
                  ) : (
                    'Book Now'
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}