'use client'

import { useEffect, useState } from 'react'
import {
  FileText, Loader2, Pill, Calendar, Clock,
  AlertCircle, ChevronDown, ChevronUp, Stethoscope,
  ClipboardList, CheckCircle2, Activity, Send
} from 'lucide-react'

interface Prescription {
  prescriptionid: number
  pid: number
  docid: number
  diagnosis: string
  medicines: string // JSON
  notes: string
  followUpDate: string
  createdDate: string
  doctor: { docname: string; docemail: string; specialty?: { sname: string } | null }
}

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/prescriptions')
      .then(r => r.json())
      .then(data => { setPrescriptions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeCount = prescriptions.length
  const latestRx = prescriptions.length > 0 ? prescriptions[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-[#0A76D8]" />
          My Prescriptions
        </h1>
        <p className="text-sm text-gray-500">View your treatment history, medicines, and doctor&apos;s advice</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No prescriptions yet</p>
          <p className="mt-1 text-sm text-gray-400">Your doctor will create prescriptions after your appointment.</p>
        </div>
      ) : (
        <>
          {/* Quick summary banner */}
          <div className="rounded-xl bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] p-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Total Prescriptions</p>
                <p className="text-3xl font-extrabold mt-0.5">{activeCount}</p>
              </div>
              <div className="flex items-center gap-3">
                {latestRx && (
                  <div className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2">
                    <p className="text-white/70 text-[10px] uppercase font-medium">Latest</p>
                    <p className="text-sm font-bold">{latestRx.diagnosis || 'General Checkup'}</p>
                    <p className="text-white/60 text-xs">by Dr. {latestRx.doctor?.docname} &middot; {latestRx.createdDate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prescription cards */}
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <PrescriptionCard
                key={rx.prescriptionid}
                rx={rx}
                isExpanded={expandedId === rx.prescriptionid}
                onToggle={() => setExpandedId(expandedId === rx.prescriptionid ? null : rx.prescriptionid)}
                isFirst={rx.prescriptionid === latestRx?.prescriptionid}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PrescriptionCard({ rx, isExpanded, onToggle, isFirst }: {
  rx: Prescription
  isExpanded: boolean
  onToggle: () => void
  isFirst: boolean
}) {
  let meds: Medicine[] = []
  try { meds = JSON.parse(rx.medicines) } catch {}

  const isFollowUpSoon = rx.followUpDate && (() => {
    const followUp = new Date(rx.followUpDate)
    const today = new Date()
    const diff = (followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 3 // within 3 days
  })()

  return (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all overflow-hidden ${isFirst ? 'border-[#0A76D8]/20 ring-1 ring-[#0A76D8]/10' : 'border-gray-100 hover:shadow-md'}`}>
      {/* Main card */}
      <div className="p-5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isFirst
              ? 'bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9]'
              : 'bg-gray-100'
          }`}>
            <FileText className={`h-6 w-6 ${isFirst ? 'text-white' : 'text-gray-500'}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Diagnosis + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900">
                {rx.diagnosis || 'General Consultation'}
              </h3>
              {isFirst && (
                <span className="rounded-full bg-[#0A76D8]/10 px-2 py-0.5 text-[10px] font-bold text-[#0A76D8] uppercase">
                  Latest
                </span>
              )}
              {isFollowUpSoon && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                  Follow-up Soon
                </span>
              )}
            </div>

            {/* Doctor info */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Dr. {rx.doctor?.docname}</span>
              <span className="text-gray-300">&middot;</span>
              <span>{rx.doctor?.specialty?.sname || ''}</span>
            </div>

            {/* Date + Medicines count */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {rx.createdDate}
              </span>
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" /> {meds.length} medicine{meds.length !== 1 ? 's' : ''}
              </span>
              {rx.followUpDate && (
                <span className={`flex items-center gap-1 ${isFollowUpSoon ? 'text-amber-600 font-medium' : ''}`}>
                  <Activity className="h-3 w-3" /> Follow-up: {rx.followUpDate}
                </span>
              )}
            </div>

            {/* Quick medicine chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meds.slice(0, 3).map((m, i) => (
                <span key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {m.name}
                </span>
              ))}
              {meds.length > 3 && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                  +{meds.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <div className="shrink-0 text-gray-400 mt-1">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5">
          {/* Diagnosis detail */}
          {rx.diagnosis && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Diagnosis
              </p>
              <p className="text-gray-900 font-medium">{rx.diagnosis}</p>
            </div>
          )}

          {/* Full medicines list */}
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Pill className="h-4 w-4 text-[#0A76D8]" /> Prescribed Medicines
            </p>
            <div className="space-y-2">
              {meds.map((m, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A76D8]/10 text-[#0A76D8] text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{m.dosage}</span>
                      <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{m.frequency}</span>
                      <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{m.duration}</span>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Doctor notes */}
          {rx.notes && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor&apos;s Advice</p>
              <p className="text-gray-700 text-sm leading-relaxed">{rx.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          {rx.followUpDate && (
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${
              isFollowUpSoon
                ? 'border-amber-200 bg-amber-50'
                : 'border-blue-200 bg-blue-50'
            }`}>
              <Calendar className={`h-5 w-5 ${isFollowUpSoon ? 'text-amber-600' : 'text-blue-600'}`} />
              <div>
                <p className={`text-xs font-bold ${isFollowUpSoon ? 'text-amber-600' : 'text-blue-600'}`}>
                  Follow-up Date
                </p>
                <p className={`font-medium ${isFollowUpSoon ? 'text-amber-900' : 'text-blue-900'}`}>{rx.followUpDate}</p>
                {isFollowUpSoon && (
                  <p className="text-xs text-amber-600">Your follow-up is coming up soon!</p>
                )}
              </div>
            </div>
          )}

          {/* WhatsApp Share button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              let medList = meds.map((m, i) =>
                `${i + 1}. ${m.name} - ${m.dosage} (${m.frequency}) - ${m.duration || ''}`
              ).join('\n')
              const msg = `*Docter Esa - Prescription*

*Diagnosis:* ${rx.diagnosis}
*Doctor:* Dr. ${rx.doctor?.docname}
*Date:* ${rx.createdDate}

*Medicines:*
${medList}

*Notes:* ${rx.notes || 'None'}${rx.followUpDate ? '\n*Follow-up:* ' + rx.followUpDate : ''}`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
            }}
            className={`mt-3 flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white transition ${isExpanded ? '' : ''}`}
          >
            <Send className="h-4 w-4" /> Share Prescription via WhatsApp
          </button>

          {/* Prescription footer */}
          <div className="mt-4 rounded-lg bg-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
            <span>Prescription #{rx.prescriptionid}</span>
            <span>Dr. {rx.doctor?.docname} &middot; {rx.createdDate}</span>
          </div>
        </div>
      )}
    </div>
  )
}
