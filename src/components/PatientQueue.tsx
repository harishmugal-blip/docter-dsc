'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Activity, Clock, Users, Ticket, AlertCircle,
  Loader2, RefreshCw, CalendarCheck, Stethoscope, MapPin,
  ChevronDown, ChevronUp, ArrowRight, CheckCircle2, HourglassIcon
} from 'lucide-react'

interface QueueItem {
  appoid: number
  myToken: number
  myPosition: number
  totalInQueue: number
  patientsBeforeMe: number
  patientsServed: number
  maxPatients: number
  scheduleid: number
  title: string
  scheduledate: string
  scheduletime: string
  doctorName: string
  specialty: string
  slotsAvailable: number
}

interface QueueData {
  patientName: string
  patientId: number
  queues: QueueItem[]
}

export function PatientQueue() {
  const [data, setData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(30)

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/queue?patient=mine')
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setError('')
          setLastRefresh(new Date())
          setCountdown(30)
        } else {
          setError('Failed to load queue data')
        }
      } catch {
        setError('Network error')
      }
      setLoading(false)
    }

    load()

    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const refreshNow = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/queue?patient=mine')
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setError('')
        setLastRefresh(new Date())
        setCountdown(30)
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }, [])

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#0A76D8]" />
            Live Queue Tracker
          </h1>
          <p className="text-sm text-gray-500">Track your token number and queue position in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${countdown > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${countdown > 10 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                Auto-refresh in {countdown}s
              </span>
            </div>
          )}
          <button
            onClick={refreshNow}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A76D8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0862b3] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!data || data.queues.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <HourglassIcon className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No active queues</p>
          <p className="mt-1 text-sm text-gray-400">Book an appointment to see your queue status here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.queues.map((q) => (
            <QueueCard
              key={q.appoid}
              queue={q}
              isExpanded={expandedId === q.appoid}
              onToggle={() => setExpandedId(expandedId === q.appoid ? null : q.appoid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function QueueCard({ queue, isExpanded, onToggle }: {
  queue: QueueItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const progressPercent = queue.totalInQueue > 0
    ? ((queue.patientsServed) / queue.totalInQueue) * 100
    : 0

  const isNext = queue.myPosition === 1
  const isServing = queue.myPosition === 1 && queue.patientsServed === 0

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all overflow-hidden ${isNext ? 'border-[#0A76D8]/30 ring-2 ring-[#0A76D8]/10' : 'border-gray-100 hover:shadow-md'}`}>
      {/* Main Card */}
      <div
        className="p-5 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Token Badge */}
            <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
              isNext
                ? 'bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] shadow-lg shadow-[#0A76D8]/25'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            }`}>
              <span className={`text-xl font-extrabold ${isNext ? 'text-white' : 'text-gray-700'}`}>
                {String(queue.myToken).padStart(2, '0')}
              </span>
              {isNext && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{queue.doctorName}</h3>
                {isNext && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0A76D8]/10 px-2 py-0.5 text-[10px] font-bold text-[#0A76D8] uppercase">
                    Your Turn!
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{queue.specialty}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3.5 w-3.5" /> {queue.scheduledate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {queue.scheduletime}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {queue.title}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-gray-400">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-[#0A76D8]">{queue.myPosition}</div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Your Position</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-gray-700">{queue.patientsBeforeMe}</div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Before You</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <div className="text-lg font-bold text-emerald-600">{queue.totalInQueue - queue.patientsBeforeMe - 1}</div>
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">After You</div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
          {/* Queue progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Queue Progress</span>
              <span className="text-sm text-gray-500">{queue.totalInQueue} patients total</span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Your position marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-[#0A76D8] transition-all duration-500"
                style={{ left: `${(queue.myPosition / queue.totalInQueue) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
              <span>Token #01</span>
              <span className="flex items-center gap-1 text-[#0A76D8] font-bold">
                <ArrowRight className="h-3 w-3" /> You #{String(queue.myToken).padStart(2, '0')}
              </span>
              <span>#{String(queue.totalInQueue).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Queue visualization */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Queue Order</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: queue.totalInQueue }, (_, i) => {
                const tokenNum = i + 1
                const isMe = tokenNum === queue.myToken
                const isServed = tokenNum <= queue.patientsServed
                const isCurrent = tokenNum === queue.patientsServed + 1

                return (
                  <div
                    key={tokenNum}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      isMe
                        ? 'bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] text-white shadow-lg shadow-[#0A76D8]/20 scale-110 ring-2 ring-[#0A76D8]/30'
                        : isServed
                          ? 'bg-emerald-100 text-emerald-700'
                          : isCurrent
                            ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                    title={`Token #${String(tokenNum).padStart(2, '0')}${isMe ? ' (You)' : isServed ? ' (Done)' : isCurrent ? ' (Serving)' : ''}`}
                  >
                    {isServed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      String(tokenNum).padStart(2, '0')
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-emerald-100 ring-1 ring-emerald-200" /> Done
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-amber-100 ring-1 ring-amber-200" /> Serving
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-[#0A76D8] ring-1 ring-[#0A76D8]/30" /> You
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-gray-100 ring-1 ring-gray-200" /> Waiting
              </span>
            </div>
          </div>

          {/* Session info */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Session Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Stethoscope className="h-4 w-4" />
                <span>Dr. {queue.doctorName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Ticket className="h-4 w-4" />
                <span>Token #{String(queue.myToken).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Users className="h-4 w-4" />
                <span>{queue.totalInQueue}/{queue.maxPatients} booked</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <CalendarCheck className="h-4 w-4" />
                <span>{queue.scheduledate} at {queue.scheduletime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
