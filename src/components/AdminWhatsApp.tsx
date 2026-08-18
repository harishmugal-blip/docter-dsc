'use client'

import { useEffect, useState } from 'react'
import {
  MessageSquare, Bell, Send, Clock, CheckCircle, XCircle,
  Trash2, RefreshCw, Loader2, Filter, Zap, Pill, CalendarDays,
  Users, Activity, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type NotifType = 'all' | 'appointment_confirm' | 'medicine_reminder' | 'appointment_reminder' | 'queue_update' | 'prescription_share'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  patientPhone: string
  patientId: number | null
  prescriptionId: number | null
  appointmentId: number | null
  status: string
  scheduledAt: string
  sentAt: string
  createdAt: string
  waDeepLink: string
  patient: { pid: number; pname: string; ptel: string; pemail: string } | null
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  appointment_confirm: { label: 'Appointment Confirm', icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  medicine_reminder: { label: 'Medicine Reminder', icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  appointment_reminder: { label: 'Appointment Reminder', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  queue_update: { label: 'Queue Update', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  prescription_share: { label: 'Prescription Share', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
}

export function AdminWhatsApp() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NotifType>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('all', 'true')
      if (filter !== 'all') params.set('type', filter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/notifications?${params}`)
      const data = await res.json()
      setNotifications(data || [])
    } catch { setNotifications([]) }
    setLoading(false)
  }

  useEffect(() => { loadNotifications() }, [filter, statusFilter])

  const handleMarkSent = async (id: number) => {
    await fetch(`/api/notifications/mark-sent?id=${id}`, { method: 'PATCH' })
    loadNotifications()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notification?')) return
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    loadNotifications()
  }

  const handleSendWhatsApp = (notif: Notification) => {
    if (notif.waDeepLink) {
      window.open(notif.waDeepLink, '_blank')
      handleMarkSent(notif.id)
    }
  }

  const stats = {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    sent: notifications.filter(n => n.status === 'sent').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-green-600" />
            WhatsApp Notifications
          </h1>
          <p className="text-sm text-gray-500">Manage all WhatsApp messages for patients</p>
        </div>
        <Button onClick={loadNotifications} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              <p className="text-sm text-gray-500">Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Guide */}
      <div className="rounded-xl border bg-gradient-to-r from-green-50 to-blue-50 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-green-600" /> WhatsApp Features
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2 rounded-lg border bg-white/80 p-3">
              <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
              <span className="text-sm font-medium">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as NotifType)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#0A76D8] focus:outline-none"
          >
            <option value="all">All Types</option>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#0A76D8] focus:outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A76D8]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No notifications found</p>
          <p className="mt-1 text-sm text-gray-400">Notifications will appear when appointments are booked or prescriptions are created</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || { label: n.type, icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' }
            const IconComp = cfg.icon
            return (
              <div key={n.id} className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${cfg.bg}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 flex-1">
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
                      <p className="mt-1 text-sm text-gray-600 whitespace-pre-line line-clamp-3">{n.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {n.patient && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {n.patient.pname} ({n.patient.ptel || 'No phone'})
                          </span>
                        )}
                        {n.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(n.createdAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {n.status === 'pending' && n.waDeepLink && (
                      <Button
                        onClick={() => handleSendWhatsApp(n)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> Send WA
                      </Button>
                    )}
                    {n.status === 'pending' && (
                      <Button
                        onClick={() => handleMarkSent(n.id)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(n.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
