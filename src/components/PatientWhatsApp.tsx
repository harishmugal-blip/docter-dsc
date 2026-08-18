'use client'

import { useEffect, useState } from 'react'
import {
  MessageSquare, Bell, Send, Clock, CheckCircle, Loader2,
  Pill, CalendarDays, Activity, FileText, Phone, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  patientPhone: string
  status: string
  scheduledAt: string
  createdAt: string
  waDeepLink: string
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  appointment_confirm: { label: 'Appointment Confirmed', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  medicine_reminder: { label: 'Medicine Reminder', icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  appointment_reminder: { label: 'Appointment Reminder', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  queue_update: { label: 'Queue Update', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  prescription_share: { label: 'Prescription', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
}

export function PatientWhatsApp() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const statsRes = await fetch('/api/stats/patient')
        const statsData = await statsRes.json()
        if (statsData.patientId) {
          const res = await fetch(`/api/notifications?pid=${statsData.patientId}`)
          const data = await res.json()
          setNotifications(data || [])
        }
      } catch { setNotifications([]) }
      setLoading(false)
    }
    load()
  }, [])

  const handleSendWhatsApp = async (notif: Notification) => {
    if (notif.waDeepLink) {
      window.open(notif.waDeepLink, '_blank')
      // Mark as sent
      await fetch(`/api/notifications/mark-sent?id=${notif.id}`, { method: 'PATCH' })
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'sent' } : n))
    }
  }

  const pending = notifications.filter(n => n.status === 'pending')
  const sent = notifications.filter(n => n.status === 'sent')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-green-600" />
          My WhatsApp Messages
        </h1>
        <p className="text-sm text-gray-500">View your appointment confirmations, medicine reminders & more</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-xl font-bold text-yellow-700">{pending.length}</p>
              <p className="text-sm text-yellow-600">Pending Messages</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xl font-bold text-green-700">{sent.length}</p>
              <p className="text-sm text-green-600">Sent Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-gradient-to-r from-green-50 to-blue-50 p-5">
        <h3 className="font-semibold text-gray-900 mb-2">How WhatsApp Messages Work</h3>
        <p className="text-sm text-gray-600">
          Click <strong>"Send via WhatsApp"</strong> to open WhatsApp with a pre-filled message.
          You just need to press <strong>Send</strong> in WhatsApp. No extra app needed!
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No messages yet</p>
          <p className="mt-1 text-sm text-gray-400">Messages will appear when you book appointments or get prescriptions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || { label: n.type, icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
            const IconComp = cfg.icon
            const isExpanded = expandedId === n.id

            return (
              <div key={n.id} className={`rounded-xl border p-5 shadow-sm transition ${cfg.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ${cfg.color}`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{n.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {n.status}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 border">
                        {cfg.label}
                      </span>
                    </div>

                    <div
                      className={`mt-2 text-sm text-gray-600 whitespace-pre-line ${!isExpanded ? 'line-clamp-2' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : n.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {n.message}
                    </div>

                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(n.createdAt).toLocaleString()}
                      </span>

                      {n.status === 'pending' && n.waDeepLink && (
                        <Button
                          onClick={() => handleSendWhatsApp(n)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Send via WhatsApp
                        </Button>
                      )}

                      {n.status === 'sent' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="h-3.5 w-3.5" /> Sent
                        </span>
                      )}

                      {n.patientPhone && (
                        <a
                          href={`tel:${n.patientPhone}`}
                          className="flex items-center gap-1 text-xs text-[#0A76D8] hover:underline"
                        >
                          <Phone className="h-3 w-3" /> {n.patientPhone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
