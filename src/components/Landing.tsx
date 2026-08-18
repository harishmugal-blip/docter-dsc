'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Heart, Stethoscope, Calendar, Users, Shield, Clock,
  ArrowRight, ChevronRight, Star, CheckCircle2,
  Activity, UserCheck, TrendingUp, Phone, Mail, MapPin,
  Play, Sparkles, Zap, Award, ArrowUpRight, Search, Building2
} from 'lucide-react'

interface LandingProps {
  onNavigate: (view: 'login' | 'signup' | 'super-admin-dashboard' | 'admin-dashboard') => void
}

export function Landing({ onNavigate }: LandingProps) {
  const [visible, setVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [superEmail, setSuperEmail] = useState('')
  const [superPassword, setSuperPassword] = useState('')
  const [superLoading, setSuperLoading] = useState(false)
  const [superError, setSuperError] = useState('')
  const [clinics, setClinics] = useState<any[]>([])
  const [clinicsLoading, setClinicsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch public clinics list
  useEffect(() => {
    fetch('/api/clinics-public')
      .then(r => r.json())
      .then(d => { setClinics(d.clinics || []); setClinicsLoading(false) })
      .catch(() => setClinicsLoading(false))
  }, [])

  // Auto-detect clinic from ?clinic= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const clinicSlug = params.get('clinic')
    if (clinicSlug) {
      // Set clinic cookie for this session
      fetch(`/api/clinic?slug=${clinicSlug}`)
        .then(r => r.json())
        .then(d => {
          if (d.clinicid) {
            document.cookie = `edoc_clinic_id=${d.clinicid};path=/;max-age=${60*60*24*7}`
            document.cookie = `edoc_clinic_name=${encodeURIComponent(d.name)};path=/;max-age=${60*60*24*7}`
            document.cookie = `edoc_clinic_slug=${d.slug};path=/;max-age=${60*60*24*7}`
          }
        })
        .catch(() => {})
    }
  }, [])

  const handleSuperLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuperError('')
    setSuperLoading(true)
    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superEmail, password: superPassword }),
      })
      if (res.ok) {
        document.cookie = 'edoc_super=1;path=/;max-age=' + (60*60*24*7)
        document.cookie = 'edoc_super_email=' + superEmail + ';path=/;max-age=' + (60*60*24*7)
        onNavigate('super-admin-dashboard')
      } else {
        const d = await res.json()
        setSuperError(d.error || 'Login failed')
      }
    } catch {
      setSuperError('Network error')
    }
    setSuperLoading(false)
  }

  const handleSelectClinic = (clinic: any) => {
    // Set clinic cookies and go to login
    document.cookie = `edoc_clinic_id=${clinic.clinicid};path=/;max-age=${60*60*24*7}`
    document.cookie = `edoc_clinic_name=${encodeURIComponent(clinic.name)};path=/;max-age=${60*60*24*7}`
    document.cookie = `edoc_clinic_slug=${clinic.slug};path=/;max-age=${60*60*24*7}`
    onNavigate('login')
  }

  const filteredClinics = clinics.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const navOpacity = Math.min(scrollY / 100, 1)

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation Bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: `rgba(255,255,255,${0.95 + navOpacity * 0.05})`,
          boxShadow: navOpacity > 0.5 ? '0 1px 20px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Heart className="h-8 w-8 text-[#0A76D8]" fill="#0A76D8" />
                <Activity className="absolute -top-0.5 -right-0.5 h-3 w-3 text-emerald-500" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] bg-clip-text text-transparent">
                Docter Esa
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#0A76D8] transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-[#0A76D8] transition-colors">How It Works</a>
              <a href="#stats" className="text-sm font-medium text-gray-600 hover:text-[#0A76D8] transition-colors">About</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#0A76D8] hover:bg-[#0A76D8]/5 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="rounded-lg bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] px-5 py-2 text-sm font-semibold text-white hover:shadow-lg hover:shadow-[#0A76D8]/25 transition-all"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A76D8] via-[#0862B3] to-[#064E94]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        {/* Floating elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0EA5E9]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className={`transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-[#7DD3FC]" />
                <span className="text-sm font-medium text-white/90">Trusted by 1000+ patients</span>
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl tracking-tight">
                Your Health,{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-[#7DD3FC] to-[#BAE6FD] bg-clip-text text-transparent">Our Priority</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 6" stroke="#7DD3FC" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                  </svg>
                </span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-lg text-white/75 leading-relaxed">
                Book appointments with top doctors, track your queue in real-time, and access quality healthcare — all from one smart platform.
              </p>
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <button
                  onClick={() => onNavigate('signup')}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#0A76D8] shadow-2xl shadow-black/10 transition-all hover:scale-[1.02] hover:shadow-xl"
                >
                  <Calendar className="h-5 w-5" />
                  Make Appointment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:border-white/30"
                >
                  Sign In
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['bg-emerald-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400'].map((bg, i) => (
                      <div key={i} className={`h-8 w-8 rounded-full ${bg} border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white`}>
                        {['S', 'R', 'A', 'P'][i]}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/70">
                    <span className="font-semibold text-white">1000+</span> patients
                  </div>
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-400" fill="#FBBF24" />
                  ))}
                  <span className="ml-1 text-sm text-white/70"><span className="font-semibold text-white">4.9</span> rating</span>
                </div>
              </div>
            </div>

            {/* Right - Floating cards */}
            <div className={`hidden lg:block transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative h-[500px]">
                {/* Main card */}
                <div className="absolute top-8 right-0 w-72 bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 animate-float">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Dr. Sarah Johnson</p>
                      <p className="text-xs text-gray-500">Cardiologist</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Available</span>
                      <span className="text-emerald-500 font-semibold">Today</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Time</span>
                      <span className="text-gray-900 font-medium">10:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Queue</span>
                      <span className="text-[#0A76D8] font-bold">3/15</span>
                    </div>
                    <button className="w-full mt-2 rounded-xl bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] py-2.5 text-sm font-semibold text-white">
                      Book Now
                    </button>
                  </div>
                </div>

                {/* Queue card */}
                <div className="absolute top-40 left-0 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 p-4 animate-float-delayed">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Live Queue</span>
                  </div>
                  <div className="text-center mb-3">
                    <span className="text-4xl font-extrabold text-[#0A76D8]">07</span>
                    <p className="text-xs text-gray-500 mt-1">Your Token Number</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <span className="text-xs text-gray-500">3 patients being served</span>
                  </div>
                </div>

                {/* Notification card */}
                <div className="absolute bottom-10 right-10 w-60 bg-white rounded-2xl shadow-xl shadow-black/10 p-4 animate-float-slow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Appointment Confirmed</p>
                      <p className="text-xs text-gray-500">Token #05 - 2:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full text-white" preserveAspectRatio="none">
            <path d="M0,60L80,55C160,50,320,40,480,42C640,44,800,58,960,62C1120,66,1280,60,1360,57L1440,54L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z" fill="currentColor" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0A76D8]/5 border border-[#0A76D8]/10 px-4 py-1.5 mb-4">
              <Zap className="h-3.5 w-3.5 text-[#0A76D8]" />
              <span className="text-sm font-medium text-[#0A76D8]">Features</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-[#0A76D8] to-[#0EA5E9] bg-clip-text text-transparent">Smart Healthcare</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Simplify your healthcare journey with our comprehensive platform designed for patients and doctors.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <EnhancedFeatureCard
              icon={Calendar}
              title="Easy Booking"
              desc="Book appointments with just a few clicks. No more waiting in long queues at the hospital."
              gradient="from-blue-500 to-cyan-500"
            />
            <EnhancedFeatureCard
              icon={Activity}
              title="Live Queue Tracking"
              desc="See your token number in real-time. Know exactly how many patients are ahead of you."
              gradient="from-emerald-500 to-teal-500"
              highlight
            />
            <EnhancedFeatureCard
              icon={Stethoscope}
              title="Expert Doctors"
              desc="Access 56+ medical specialties and experienced healthcare professionals."
              gradient="from-violet-500 to-purple-500"
            />
            <EnhancedFeatureCard
              icon={Clock}
              title="Real-time Updates"
              desc="Get instant notifications about your appointments, queue position, and schedule changes."
              gradient="from-amber-500 to-orange-500"
            />
            <EnhancedFeatureCard
              icon={Users}
              title="Patient Management"
              desc="Comprehensive tools for doctors to manage patients, sessions, and appointments."
              gradient="from-rose-500 to-pink-500"
            />
            <EnhancedFeatureCard
              icon={Shield}
              title="Secure & Private"
              desc="Your health data is encrypted and protected. HIPAA-compliant security standards."
              gradient="from-slate-500 to-gray-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0A76D8]/5 border border-[#0A76D8]/10 px-4 py-1.5 mb-4">
              <Play className="h-3.5 w-3.5 text-[#0A76D8]" />
              <span className="text-sm font-medium text-[#0A76D8]">How It Works</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Get Started in <span className="text-[#0A76D8]">3 Simple Steps</span>
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Create Account',
                desc: 'Sign up as a patient in seconds. Just your name, email, and password.',
                icon: UserCheck,
              },
              {
                num: '02',
                title: 'Find & Book',
                desc: 'Search doctors by specialty, pick a session, and book your appointment.',
                icon: Calendar,
              },
              {
                num: '03',
                title: 'Track Queue Live',
                desc: 'See your token number and track your position in real-time.',
                icon: Activity,
              },
            ].map((step) => (
              <div key={step.num} className="relative group">
                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#0A76D8]/20">
                      <step.icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-5xl font-black text-gray-100">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-[#0A76D8] to-[#064E94] p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
            <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white sm:text-5xl">50+</div>
                <div className="mt-2 text-sm font-medium text-white/70">Expert Doctors</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white sm:text-5xl">1,000+</div>
                <div className="mt-2 text-sm font-medium text-white/70">Happy Patients</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white sm:text-5xl">5,000+</div>
                <div className="mt-2 text-sm font-medium text-white/70">Appointments</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-extrabold text-white sm:text-5xl">56</div>
                <div className="mt-2 text-sm font-medium text-white/70">Specialties</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our <span className="text-[#0A76D8]">Patients Say</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Rajesh Kumar', role: 'Patient', text: 'Docter Esa made it so easy to book appointments. The live queue feature saved me hours of waiting at the hospital!' },
              { name: 'Priya Sharma', role: 'Patient', text: 'I can see my token number and track exactly when my turn is coming. No more uncertainty!' },
              { name: 'Dr. Amit Patel', role: 'Doctor', text: 'Managing my schedule and patients has never been simpler. The queue system keeps everything organized.' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400" fill="#FBBF24" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-[#0A76D8] via-[#0862B3] to-[#064E94] p-12 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                <Award className="h-4 w-4 text-[#7DD3FC]" />
                <span className="text-sm font-medium text-white/90">Free to use</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to Take Control of Your Health?
              </h2>
              <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
                Join thousands of patients who are already managing their healthcare smarter with Docter Esa.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => onNavigate('signup')}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#0A76D8] shadow-2xl transition-all hover:scale-[1.02]"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/15"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Selector & Super Admin Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Super Admin Login */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/5 border border-violet-500/10 px-4 py-1.5 mb-4">
                <Shield className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-sm font-medium text-violet-600">Super Admin</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Platform Administration
              </h2>
            </div>
            <div className="mx-auto max-w-md">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <form onSubmit={handleSuperLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={superEmail}
                      onChange={e => setSuperEmail(e.target.value)}
                      placeholder="super@docteresa.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={superPassword}
                      onChange={e => setSuperPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      required
                    />
                  </div>
                  {superError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                      {superError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={superLoading}
                    className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                  >
                    {superLoading ? 'Signing in...' : 'Super Admin Login'}
                  </button>
                </form>
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">Demo: super@docteresa.com / super123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinics Directory */}
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0A76D8]/5 border border-[#0A76D8]/10 px-4 py-1.5 mb-4">
                <Building2 className="h-3.5 w-3.5 text-[#0A76D8]" />
                <span className="text-sm font-medium text-[#0A76D8]">Our Clinics</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Find Your <span className="text-[#0A76D8]">Clinic</span>
              </h2>
              <p className="mt-2 text-gray-500">Select a clinic to login or register</p>
            </div>

            {/* Search */}
            <div className="mx-auto max-w-lg mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clinics by name or city..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-12 pr-4 py-3 text-sm focus:border-[#0A76D8] focus:ring-2 focus:ring-[#0A76D8]/20 focus:outline-none bg-white"
                />
              </div>
            </div>

            {/* Clinics Grid */}
            {clinicsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0A76D8]" />
                <p className="mt-3 text-sm text-gray-500">Loading clinics...</p>
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No clinics found.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClinics.map((clinic) => (
                  <button
                    key={clinic.clinicid}
                    onClick={() => handleSelectClinic(clinic)}
                    className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-left transition-all hover:shadow-lg hover:-translate-y-1 hover:border-[#0A76D8]/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0A76D8] to-[#0EA5E9] flex items-center justify-center shrink-0">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-[#0A76D8] transition-colors truncate">{clinic.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-500">{clinic.city || 'India'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Stethoscope className="h-3 w-3" /> {clinic.doctorCount || 0} doctors
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            clinic.plan === 'premium' ? 'bg-amber-100 text-amber-700' :
                            clinic.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {clinic.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-[#0A76D8] font-medium">{clinic.slug}.docteresa.com</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#0A76D8] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Heart className="h-7 w-7 text-[#0A76D8]" fill="#0A76D8" />
                <span className="text-xl font-bold text-white">Docter Esa</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Smart healthcare platform for booking appointments and tracking your queue in real-time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2.5">
                <a href="#features" className="block text-sm text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" className="block text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
                <a href="#stats" className="block text-sm text-gray-400 hover:text-white transition-colors">About Us</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">For Patients</h4>
              <div className="space-y-2.5">
                <button onClick={() => onNavigate('signup')} className="block text-sm text-gray-400 hover:text-white transition-colors">Register</button>
                <button onClick={() => onNavigate('login')} className="block text-sm text-gray-400 hover:text-white transition-colors">Login</button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="h-4 w-4" /> +91 98765 43210
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="h-4 w-4" /> support@docteresa.com
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" /> India
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500">&copy; 2025 Docter Esa Doctor Appointment System. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">Built with</span>
              <Heart className="h-3 w-3 text-red-500" fill="#EF4444" />
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out 1s infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out 0.5s infinite; }
      `}</style>
    </div>
  )
}

function EnhancedFeatureCard({ icon: Icon, title, desc, gradient, highlight }: {
  icon: React.ElementType
  title: string
  desc: string
  gradient: string
  highlight?: boolean
}) {
  return (
    <div className={`group rounded-2xl border bg-white p-7 transition-all hover:shadow-xl hover:-translate-y-1.5 ${highlight ? 'border-[#0A76D8]/20 ring-1 ring-[#0A76D8]/10' : 'border-gray-100'}`}>
      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg transition-transform group-hover:scale-110`}>
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      {highlight && (
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A76D8] bg-[#0A76D8]/5 rounded-full px-3 py-1">
          <Sparkles className="h-3 w-3" /> New Feature
        </div>
      )}
    </div>
  )
}
