'use client'

import { useState } from 'react'
import { useAuth } from './AuthContext'
import {
  LayoutDashboard,
  Stethoscope,
  CalendarClock,
  CalendarCheck,
  Users,
  LogOut,
  Menu,
  X,
  Heart,
  Settings,
  Activity,
  ClipboardList,
  FileText,
  MessageSquare,
  Building2,
} from 'lucide-react'

export type ViewType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'admin-dashboard'
  | 'admin-doctors'
  | 'admin-schedule'
  | 'admin-appointments'
  | 'admin-patients'
  | 'admin-whatsapp'
  | 'doctor-dashboard'
  | 'doctor-schedule'
  | 'doctor-appointments'
  | 'doctor-patients'
  | 'doctor-prescriptions'
  | 'doctor-settings'
  | 'patient-dashboard'
  | 'patient-schedule'
  | 'patient-appointments'
  | 'patient-prescriptions'
  | 'patient-queue'
  | 'patient-whatsapp'
  | 'patient-settings'
  | 'super-admin-dashboard'
  | 'super-admin-clinics'

interface NavItem {
  label: string
  icon: React.ElementType
  view: ViewType
}

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'super-admin-dashboard' },
  { label: 'Clinics', icon: Building2, view: 'super-admin-clinics' },
  { label: 'Settings', icon: Settings, view: 'super-admin-dashboard' },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'admin-dashboard' },
  { label: 'Doctors', icon: Stethoscope, view: 'admin-doctors' },
  { label: 'Schedule', icon: CalendarClock, view: 'admin-schedule' },
  { label: 'Appointments', icon: CalendarCheck, view: 'admin-appointments' },
  { label: 'Patients', icon: Users, view: 'admin-patients' },
  { label: 'WhatsApp', icon: MessageSquare, view: 'admin-whatsapp' },
]

const doctorNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'doctor-dashboard' },
  { label: 'Schedule', icon: CalendarClock, view: 'doctor-schedule' },
  { label: 'Appointments', icon: CalendarCheck, view: 'doctor-appointments' },
  { label: 'Patients', icon: Users, view: 'doctor-patients' },
  { label: 'Prescriptions', icon: FileText, view: 'doctor-prescriptions' },
  { label: 'Settings', icon: Settings, view: 'doctor-settings' },
]
const patientNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'patient-dashboard' },
  { label: 'Available Sessions', icon: CalendarClock, view: 'patient-schedule' },
  { label: 'My Appointments', icon: CalendarCheck, view: 'patient-appointments' },
  { label: 'My Prescriptions', icon: ClipboardList, view: 'patient-prescriptions' },
  { label: 'Live Queue', icon: Activity, view: 'patient-queue' },
  { label: 'WhatsApp', icon: MessageSquare, view: 'patient-whatsapp' },
  { label: 'Settings', icon: Settings, view: 'patient-settings' },
]

interface SidebarProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user?.usertype) return null

  const navItems =
    user.usertype === 'super' ? superAdminNav :
    user.usertype === 'ca' ? adminNav :
    user.usertype === 'd' ? doctorNav :
    patientNav

  const roleLabel =
    user.usertype === 'super' ? 'Super Admin' :
    user.usertype === 'ca' ? 'Clinic Admin' :
    user.usertype === 'd' ? 'Doctor' : 'Patient'

  const handleNav = (view: ViewType) => {
    onNavigate(view)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A76D8] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/20 px-6 py-5">
        <Heart className="h-8 w-8 text-white" fill="white" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Docter Esa</h1>
          {user.clinicName ? (
            <p className="text-xs text-white/70">{user.clinicName}</p>
          ) : (
            <p className="text-xs text-white/70">Appointment System</p>
          )}
        </div>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-4 pb-2">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          {roleLabel} Panel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-[#0A76D8]'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t border-white/20 px-4 py-4">
        <div className="mb-3 truncate text-sm text-white/80">{user.email}</div>
        <button
          onClick={() => {
            logout()
            onNavigate('landing')
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0A76D8] p-2 text-white shadow-lg lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}