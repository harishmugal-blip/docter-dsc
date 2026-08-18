import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value

  const clinicFilter = { clinicid: parseInt(clinicId!) }

  const [doctors, patients, appointments, schedules] = await Promise.all([
    db.doctor.count({ where: clinicFilter }),
    db.patient.count({ where: clinicFilter }),
    db.appointment.count({ where: clinicFilter }),
    db.schedule.count({ where: clinicFilter }),
  ])

  // Monthly appointments (last 6 months)
  const now = new Date()
  const monthlyData: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = d.toLocaleString('default', { month: 'short' })
    // For SQLite we do a simple count based on appodate
    const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
    const count = await db.appointment.count({
      where: {
        ...clinicFilter,
        appodate: { gte: startStr, lte: endStr },
      },
    })
    monthlyData.push({ month: monthStr, count })
  }

  // Specialty distribution
  const specialtyDist = await db.doctor.groupBy({
    by: ['specialties'],
    _count: { docid: true },
    where: { specialties: { not: null }, ...clinicFilter },
  })

  const specialtyNames = await Promise.all(
    specialtyDist.map(async (s) => {
      const spec = s.specialties ? await db.clinicSpecialty.findUnique({ where: { id: s.specialties! } }) : null
      return { name: spec?.name || 'Unknown', count: s._count.docid }
    })
  )

  // Upcoming appointments
  const today = now.toISOString().split('T')[0]
  const upcomingAppointments = await db.appointment.findMany({
    where: { ...clinicFilter, appodate: { gte: today } },
    take: 10,
    include: {
      patient: true,
      schedule: { include: { doctor: true } },
    },
    orderBy: { appodate: 'asc' },
  })

  // Recent doctors
  const recentDoctors = await db.doctor.findMany({
    where: clinicFilter,
    take: 5,
    include: { specialty: true },
    orderBy: { docid: 'desc' },
  })

  return NextResponse.json({
    doctors,
    patients,
    appointments,
    schedules,
    monthlyData,
    specialtyNames,
    upcomingAppointments,
    recentDoctors,
  })
}