import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const email = cookieStore.get('edoc_email')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const patient = await db.patient.findFirst({ where: { pemail: email, clinicid: parseInt(clinicId!) } })
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const totalAppointments = await db.appointment.count({
    where: { pid: patient.pid, clinicid: patient.clinicid },
  })

  const today = new Date().toISOString().split('T')[0]
  const upcomingBookings = await db.appointment.findMany({
    where: { pid: patient.pid, appodate: { gte: today }, clinicid: patient.clinicid },
    take: 10,
    include: {
      schedule: { include: { doctor: { include: { specialty: true } } } },
    },
    orderBy: { appodate: 'asc' },
  })

  // Available doctors for search (clinic-filtered)
  const doctors = await db.doctor.findMany({
    where: { clinicid: patient.clinicid },
    include: { specialty: true },
  })

  return NextResponse.json({
    totalAppointments,
    upcomingBookings,
    doctors,
    patientName: patient.pname,
    patientId: patient.pid,
    clinicId: patient.clinicid,
  })
}