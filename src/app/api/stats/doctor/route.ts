import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('edoc_email')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doctor = await db.doctor.findFirst({ where: { docemail: email, clinicid: parseInt(clinicId!) } })
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const clinicFilter = { clinicid: doctor.clinicid }

  const [appointments, schedules, patients] = await Promise.all([
    db.appointment.count({
      where: { schedule: { docid: doctor.docid }, ...clinicFilter },
    }),
    db.schedule.count({
      where: { docid: doctor.docid, ...clinicFilter },
    }),
    // Unique patients for this doctor
    db.appointment.groupBy({
      by: ['pid'],
      where: { schedule: { docid: doctor.docid }, ...clinicFilter },
    }).then((r) => r.length),
  ])

  const today = new Date().toISOString().split('T')[0]
  const upcomingSessions = await db.schedule.findMany({
    where: { docid: doctor.docid, scheduledate: { gte: today }, ...clinicFilter },
    take: 10,
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: [{ scheduledate: 'asc' }, { scheduletime: 'asc' }],
  })

  return NextResponse.json({
    email,
    appointments,
    schedules,
    patients,
    upcomingSessions,
    doctorName: doctor.docname,
    docid: doctor.docid,
  })
}
