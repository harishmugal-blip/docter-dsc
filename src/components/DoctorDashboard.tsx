'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, CalendarClock, Users, Loader2 } from 'lucide-react'
import { StatsCard } from './StatsCard'

interface DoctorStats {
  appointments: number
  schedules: number
  patients: number
  upcomingSessions: any[]
  doctorName: string
}

export function DoctorDashboard() {
  const [stats, setStats] = useState<DoctorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/doctor')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!stats) return <div className="p-8 text-center text-gray-500">Failed to load</div>

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome, Dr. {stats.doctorName}!</h1>
        <p className="mt-1 text-white/80">Here is your practice overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Appointments" value={stats.appointments} icon={CalendarCheck} bgColor="bg-emerald-500" />
        <StatsCard title="Sessions" value={stats.schedules} icon={CalendarClock} />
        <StatsCard title="Patients" value={stats.patients} icon={Users} bgColor="bg-amber-500" />
      </div>

      {/* Upcoming Sessions */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Booked</th>
                <th className="pb-3 font-medium">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.upcomingSessions.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-gray-400">No upcoming sessions</td></tr>
              )}
              {stats.upcomingSessions.map((s) => (
                <tr key={s.scheduleid} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{s.title}</td>
                  <td className="py-3 text-gray-500">{s.scheduledate}</td>
                  <td className="py-3 text-gray-500">{s.scheduletime}</td>
                  <td className="py-3 text-gray-500">{s._count?.appointments || 0}</td>
                  <td className="py-3 text-gray-500">{s.nop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
    </div>
  )
}
