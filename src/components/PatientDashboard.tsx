'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, CalendarCheck, Stethoscope, Loader2, Clock, MapPin, Activity, ArrowRight, Ticket, Users, RefreshCw, AlertTriangle, CheckCircle2, Hourglass } from 'lucide-react'
import { StatsCard } from './StatsCard'
import { Input } from '@/components/ui/input'

interface PatientStats {
  totalAppointments: number
  upcomingBookings: any[]
  doctors: any[]
  patientName: string
  patientId: number
}

interface QueueItem {
  appoid: number
  myToken: number
  myPosition: number
  totalInQueue: number
  patientsBeforeMe: number
  maxPatients: number
  scheduleid: number
  title: string
  scheduledate: string
  scheduletime: string
  doctorName: string
  specialty: string
}

export function PatientDashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [stats, setStats] = useState<PatientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [queues, setQueues] = useState<QueueItem[]>([])
  const [refreshCount, setRefreshCount] = useState(0)
  const [countdown, setCountdown] = useState(30)

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/queue?patient=mine')
      if (res.ok) {
        const data = await res.json()
        setQueues(data.queues || [])
      }
    } catch {}
    setCountdown(30)
  }, [])

  useEffect(() => {
    fetch('/api/stats/patient')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
    loadQueue()
  }, [loadQueue])

  // Auto refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          loadQueue()
          setRefreshCount(r => r + 1)
          return 30
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loadQueue])

  if (loading) return <Loading />
  if (!stats) return <div className="p-8 text-center text-gray-500">Failed to load</div>

  const filteredDoctors = stats.doctors.filter((d: any) =>
    d.docname.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.sname?.toLowerCase().includes(search.toLowerCase())
  )

  // Pick the next/upcoming queue for the big countdown
  const nextQueue = queues.length > 0 ? queues[0] : null
  const hasQueue = queues.length > 0

  return (
    <div className="space-y-6">
      {/* ===== HERO: Token Countdown Widget ===== */}
      {hasQueue && nextQueue ? (
        <TokenCountdownHero
          queue={nextQueue}
          patientName={stats.patientName}
          countdown={countdown}
          totalQueues={queues.length}
          onRefresh={loadQueue}
          onViewAll={() => onNavigate?.('patient-queue')}
        />
      ) : (
        /* Normal Welcome Banner when no queue */
        <div className="rounded-xl bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome, {stats.patientName}!</h1>
          <p className="mt-1 text-white/80">Book appointments and manage your health journey</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="My Appointments" value={stats.totalAppointments} icon={CalendarCheck} bgColor="bg-emerald-500" />
        <StatsCard title="Available Doctors" value={stats.doctors.length} icon={Stethoscope} bgColor="bg-amber-500" />
        <StatsCard title="Active Queues" value={queues.length} icon={Activity} bgColor="bg-[#0A76D8]" />
      </div>

      {/* All Queue Slots Summary */}
      {hasQueue && queues.length > 1 && (
        <div className="rounded-xl border-2 border-[#0A76D8]/20 bg-gradient-to-r from-[#0A76D8]/5 to-transparent p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#0A76D8]" />
              All Your Slots
            </h3>
            {onNavigate && (
              <button onClick={() => onNavigate('patient-queue')} className="flex items-center gap-1 text-sm font-medium text-[#0A76D8] hover:underline">
                View Details <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queues.map((q) => (
              <div key={q.appoid} className={`rounded-xl bg-white border p-4 shadow-sm ${q.appoid === nextQueue?.appoid ? 'ring-2 ring-[#0A76D8]/30' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] text-white font-extrabold text-lg">
                    {String(q.myToken).padStart(2, '0')}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    q.myPosition === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {q.myPosition === 1 ? 'Your Turn!' : `Pos #${q.myPosition}`}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Dr. {q.doctorName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{q.scheduledate}</span>
                  <span>{q.scheduletime}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Slot: <span className="font-bold text-gray-700">{q.myPosition}/{q.totalInQueue}</span></span>
                  <span className="text-gray-500">Before you: <span className="font-bold text-[#0A76D8]">{q.patientsBeforeMe}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Doctors */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Find a Doctor</h3>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.slice(0, 6).map((d: any) => (
            <div key={d.docid} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0A76D8]/10 text-[#0A76D8] font-bold">
                {d.docname?.charAt(0)}
              </div>
              <p className="font-medium text-gray-900">{d.docname}</p>
              <p className="text-xs text-gray-500">{d.specialty?.sname || 'General Practice'}</p>
            </div>
          ))}
          {filteredDoctors.length === 0 && (
            <p className="col-span-full py-4 text-center text-gray-400">No doctors found</p>
          )}
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
        {stats.upcomingBookings.length === 0 ? (
          <p className="py-8 text-center text-gray-400">No upcoming bookings. Browse available sessions!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.upcomingBookings.map((a: any) => (
              <div key={a.appoid} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-[#0A76D8]" />
                  <span className="font-medium">Dr. {a.schedule?.doctor?.docname}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== Token Countdown Hero — the big widget on top ===== */
function TokenCountdownHero({ queue, patientName, countdown, totalQueues, onRefresh, onViewAll }: {
  queue: QueueItem
  patientName: string
  countdown: number
  totalQueues: number
  onRefresh: () => void
  onViewAll: () => void
}) {
  const isMyTurn = queue.myPosition === 1
  const estimatedMinutes = queue.patientsBeforeMe * 10 // ~10 min per patient
  const progressPercent = queue.totalInQueue > 0
    ? Math.min(((queue.totalInQueue - queue.patientsBeforeMe) / queue.totalInQueue) * 100, 100)
    : 0

  return (
    <div className={`rounded-2xl overflow-hidden relative ${isMyTurn ? 'ring-2 ring-emerald-400' : ''}`}>
      {/* Background */}
      <div className={`absolute inset-0 ${isMyTurn ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700' : 'bg-gradient-to-br from-[#0A76D8] via-[#0862B3] to-[#064E94]'}`} />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }} />

      <div className="relative p-6 sm:p-8">
        {/* Top row: welcome + refresh */}
        <div className="flex items-start justify-between mb-6">
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl font-bold">Welcome, {patientName}!</h1>
            <p className="mt-0.5 text-white/70 text-sm">
              {totalQueues > 1 ? `You have ${totalQueues} active slots` : 'Here is your current slot status'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${
              countdown > 10
                ? 'bg-white/15 text-white/90'
                : 'bg-amber-400/20 text-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${countdown > 10 ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              Refresh in {countdown}s
            </span>
            <button
              onClick={onRefresh}
              className="rounded-lg bg-white/15 backdrop-blur-sm p-2 text-white hover:bg-white/25 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main countdown content */}
        <div className="grid gap-6 sm:grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Token number */}
          <div className="text-center sm:text-left">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Your Token Number</p>
            <div className="flex items-baseline gap-3 justify-center sm:justify-start">
              <span className="text-6xl sm:text-7xl font-black text-white leading-none">
                {String(queue.myToken).padStart(2, '0')}
              </span>
              <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                isMyTurn ? 'bg-emerald-300/20 text-emerald-100' : 'bg-white/15 text-white/90'
              }`}>
                {isMyTurn ? 'Your Turn Now!' : 'Waiting'}
              </div>
            </div>
          </div>

          {/* Center: Countdown circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {/* Progress ring */}
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={isMyTurn ? '#A7F3D0' : '#7DD3FC'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{queue.myPosition}</span>
                <span className="text-[10px] text-white/60 font-medium">of {queue.totalInQueue}</span>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="text-center sm:text-right space-y-4">
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Doctor</p>
              <p className="text-white font-bold mt-0.5">Dr. {queue.doctorName}</p>
              <p className="text-white/60 text-xs">{queue.specialty}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Schedule</p>
              <p className="text-white font-medium mt-0.5">{queue.scheduledate}</p>
              <p className="text-white/60 text-xs">{queue.scheduletime}</p>
            </div>
          </div>
        </div>

        {/* Bottom: Stats row + progress bar */}
        <div className="mt-6">
          {/* Stats chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2.5">
              <Users className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-xs text-white/50">Before You</p>
                <p className="text-lg font-bold text-white leading-tight">{queue.patientsBeforeMe}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2.5">
              <Hourglass className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-xs text-white/50">Est. Wait</p>
                <p className="text-lg font-bold text-white leading-tight">{isMyTurn ? 'Now' : `~${estimatedMinutes} min`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2.5">
              <Ticket className="h-4 w-4 text-white/70" />
              <div>
                <p className="text-xs text-white/50">Slot</p>
                <p className="text-lg font-bold text-white leading-tight">{queue.myPosition}/{queue.maxPatients}</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Your position marker */}
            <div
              className="absolute top-0 h-full w-1 bg-white rounded-full shadow-sm transition-all duration-1000"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/40">
            <span>Queue started</span>
            <span className="text-white/70 font-medium">{Math.round(progressPercent)}% complete</span>
            <span>Your position</span>
          </div>

          {/* View all button */}
          {totalQueues > 1 && (
            <div className="mt-4 text-center">
              <button
                onClick={onViewAll}
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-5 py-2 text-sm font-medium text-white hover:bg-white/25 transition-colors"
              >
                View All {totalQueues} Slots
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
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
