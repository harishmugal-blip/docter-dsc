'use client'

import { useEffect, useState } from 'react'
import { Stethoscope, Users, CalendarCheck, CalendarClock, Loader2 } from 'lucide-react'
import { StatsCard } from './StatsCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#0A76D8', '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD', '#E0F2FE']

interface AdminStats {
  doctors: number
  patients: number
  appointments: number
  schedules: number
  monthlyData: { month: string; count: number }[]
  specialtyNames: { name: string; count: number }[]
  upcomingAppointments: any[]
  recentDoctors: any[]
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/admin')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!stats) return <div className="p-8 text-center text-gray-500">Failed to load stats</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your healthcare system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Doctors" value={stats.doctors} icon={Stethoscope} />
        <StatsCard title="Total Patients" value={stats.patients} icon={Users} bgColor="bg-emerald-500" />
        <StatsCard title="Appointments" value={stats.appointments} icon={CalendarCheck} bgColor="bg-amber-500" />
        <StatsCard title="Sessions" value={stats.schedules} icon={CalendarClock} bgColor="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Monthly Appointments</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0A76D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Specialty Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.specialtyNames}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.specialtyNames.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Patient</th>
                <th className="pb-3 font-medium">Doctor</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">#</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.upcomingAppointments.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-400">No upcoming appointments</td></tr>
              )}
              {stats.upcomingAppointments.map((a: any) => (
                <tr key={a.appoid} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{a.patient?.pname || 'Unknown'}</td>
                  <td className="py-3">{a.schedule?.doctor?.docname || 'Unknown'}</td>
                  <td className="py-3">{a.appodate}</td>
                  <td className="py-3">{a.apponum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Doctors */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Doctors</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.recentDoctors.map((d: any) => (
            <div key={d.docid} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A76D8]/10 text-[#0A76D8] font-bold text-sm">
                {d.docname?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{d.docname}</p>
                <p className="text-xs text-gray-500">{d.specialty?.sname || 'No specialty'}</p>
              </div>
            </div>
          ))}
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