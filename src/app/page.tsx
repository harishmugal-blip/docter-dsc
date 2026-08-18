'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/components/AuthContext'
import { Sidebar, ViewType } from '@/components/Sidebar'
import { Landing } from '@/components/Landing'
import { Login } from '@/components/Login'
import { Signup } from '@/components/Signup'
import { AdminDashboard } from '@/components/AdminDashboard'
import { AdminDoctors } from '@/components/AdminDoctors'
import { AdminSchedule } from '@/components/AdminSchedule'
import { AdminAppointments } from '@/components/AdminAppointments'
import { AdminPatients } from '@/components/AdminPatients'
import { AdminWhatsApp } from '@/components/AdminWhatsApp'
import { DoctorDashboard } from '@/components/DoctorDashboard'
import { DoctorSchedule } from '@/components/DoctorSchedule'
import { DoctorAppointments } from '@/components/DoctorAppointments'
import { DoctorPatients } from '@/components/DoctorPatients'
import { DoctorPrescriptions } from '@/components/DoctorPrescriptions'
import { DoctorSettings } from '@/components/DoctorSettings'
import { PatientDashboard } from '@/components/PatientDashboard'
import { PatientSchedule } from '@/components/PatientSchedule'
import { PatientAppointments } from '@/components/PatientAppointments'
import { PatientPrescriptions } from '@/components/PatientPrescriptions'
import { PatientQueue } from '@/components/PatientQueue'
import { PatientWhatsApp } from '@/components/PatientWhatsApp'
import { PatientSettings } from '@/components/PatientSettings'
import { SuperAdminDashboard } from '@/components/SuperAdminDashboard'
import { Loader2 } from 'lucide-react'

function getInitialView(): ViewType {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split('; ')
    const superCookie = cookies.find(c => c.startsWith('edoc_super='))
    if (superCookie?.split('=')[1] === '1') return 'super-admin-dashboard'
    const usertype = cookies.find(c => c.startsWith('edoc_usertype='))?.split('=')[1]
    if (usertype === 'ca') return 'admin-dashboard'
    if (usertype === 'd') return 'doctor-dashboard'
    if (usertype === 'p') return 'patient-dashboard'
  }
  return 'landing'
}

function getDashboardView(usertype: string): ViewType {
  if (usertype === 'super') return 'super-admin-dashboard'
  if (usertype === 'ca') return 'admin-dashboard'
  if (usertype === 'd') return 'doctor-dashboard'
  if (usertype === 'p') return 'patient-dashboard'
  return 'landing'
}

function AppContent() {
  const { user, loading } = useAuth()
  const [view, setView] = useState<ViewType>(getInitialView)

  // Sync view with auth state changes
  const effectiveView = (() => {
    // Force view update on first load based on clinic cookie
    if (typeof window !== 'undefined') {
      const clinicSlug = new URLSearchParams(window.location.search).get('clinic')
      const hasClinicCookie = document.cookie.includes('edoc_clinic_id')
      if (clinicSlug && !hasClinicCookie && !loading && !user) {
        // Auto-detect clinic and stay on landing until cookie is set
      }
    }
    if (!loading && user?.usertype) {
      // Super admin: always show super admin dashboard when on public views
      if (user.usertype === 'super') {
        const isPublic = view === 'landing' || view === 'login' || view === 'signup'
        if (isPublic) return 'super-admin-dashboard'
        const isSuperAdminView = view.startsWith('super-admin-')
        if (isSuperAdminView) return view
        return 'super-admin-dashboard'
      }

      const isPublic = view === 'landing' || view === 'login' || view === 'signup'
      if (isPublic) return getDashboardView(user.usertype)
      const isAdmin = user.usertype === 'ca' && view.startsWith('admin-')
      const isDoctor = user.usertype === 'd' && view.startsWith('doctor-')
      const isPatient = user.usertype === 'p' && view.startsWith('patient-')
      if (isAdmin || isDoctor || isPatient) return view
      return getDashboardView(user.usertype)
    }
    if (!loading && !user) {
      const isDashboard = view.includes('dashboard') || view.includes('doctors') || view.includes('schedule') || view.includes('appointments') || view.includes('patients') || view.includes('clinics')
      if (isDashboard) return 'landing'
    }
    return view
  })()

  const handleNavigate = (v: ViewType) => setView(v)
  const handleSignupSuccess = () => setView('login')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0A76D8]" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (effectiveView === 'landing') return <Landing onNavigate={handleNavigate} />
  if (effectiveView === 'login') return <Login onNavigate={handleNavigate} />
  if (effectiveView === 'signup') return <Signup onNavigate={handleNavigate} onSignupSuccess={handleSignupSuccess} />

  const dashboardViews: Partial<Record<ViewType, React.ReactNode>> = {
    'super-admin-dashboard': <SuperAdminDashboard />,
    'super-admin-clinics': <SuperAdminDashboard />,
    'admin-dashboard': <AdminDashboard />,
    'admin-doctors': <AdminDoctors />,
    'admin-schedule': <AdminSchedule />,
    'admin-appointments': <AdminAppointments />,
    'admin-patients': <AdminPatients />,
    'admin-whatsapp': <AdminWhatsApp />,
    'doctor-dashboard': <DoctorDashboard />,
    'doctor-schedule': <DoctorSchedule />,
    'doctor-appointments': <DoctorAppointments />,
    'doctor-patients': <DoctorPatients />,
    'doctor-prescriptions': <DoctorPrescriptions />,
    'doctor-settings': <DoctorSettings />,
    'patient-dashboard': <PatientDashboard onNavigate={handleNavigate} />,
    'patient-schedule': <PatientSchedule />,
    'patient-appointments': <PatientAppointments />,
    'patient-prescriptions': <PatientPrescriptions />,
    'patient-queue': <PatientQueue />,
    'patient-whatsapp': <PatientWhatsApp />,
    'patient-settings': <PatientSettings />,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentView={effectiveView} onNavigate={handleNavigate} />
      <main className="lg:pl-64">
        <div className="p-4 pt-20 lg:p-8 lg:pt-8">
          {dashboardViews[effectiveView] || <AdminDashboard />}
        </div>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}