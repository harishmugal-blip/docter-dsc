import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET /api/queue?scheduleid=1  — returns full queue for a schedule
// GET /api/queue?patient=mine   — returns all my upcoming queues
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('edoc_email')?.value
  const usertype = cookieStore.get('edoc_usertype')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (!email || !usertype) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scheduleid = req.nextUrl.searchParams.get('scheduleid')
  const patient = req.nextUrl.searchParams.get('patient')

  if (scheduleid) {
    // Get full queue for a specific schedule
    const schedule = await db.schedule.findFirst({
      where: { scheduleid: parseInt(scheduleid), clinicid: parseInt(clinicId!) },
      include: {
        doctor: { include: { specialty: true } },
        appointments: {
          include: { patient: true },
          orderBy: { apponum: 'asc' },
        },
      },
    })

    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    const queue = schedule.appointments.map((a, index) => ({
      appoid: a.appoid,
      tokenNumber: a.apponum,
      position: index + 1,
      totalInQueue: schedule.appointments.length,
      patientName: a.patient.pname,
      patientId: a.patient.pid,
      status: index === 0 ? 'serving' : 'waiting',
    }))

    return NextResponse.json({
      scheduleid: schedule.scheduleid,
      title: schedule.title,
      scheduledate: schedule.scheduledate,
      scheduletime: schedule.scheduletime,
      doctor: schedule.doctor.docname,
      specialty: schedule.doctor.specialty?.name || '',
      maxPatients: schedule.nop,
      totalBooked: schedule.appointments.length,
      slotsAvailable: Math.max(0, schedule.nop - schedule.appointments.length),
      queue,
    })
  }

  if (patient === 'mine') {
    // Get all upcoming queues for this patient
    let patientRecord: any = null
    if (usertype === 'p') {
      patientRecord = await db.patient.findFirst({ where: { pemail: email, clinicid: parseInt(clinicId!) } })
    }
    if (!patientRecord) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]

    const myAppointments = await db.appointment.findMany({
      where: {
        pid: patientRecord.pid,
        appodate: { gte: today },
      },
      include: {
        schedule: {
          include: {
            doctor: { include: { specialty: true } },
            appointments: {
              include: { patient: true },
              orderBy: { apponum: 'asc' },
            },
          },
        },
      },
      orderBy: { appodate: 'asc' },
    })

    const queueData = myAppointments.map((a) => {
      const allAppointments = a.schedule.appointments
      const myIndex = allAppointments.findIndex((ap: any) => ap.appoid === a.appoid)

      // Count how many appointments before this patient (served = those with earlier token numbers)
      const beforeMe = myIndex // number of patients before this one
      const currentlyServing = 0 // the first person in queue
      const patientsServed = currentlyServing

      return {
        appoid: a.appoid,
        myToken: a.apponum,
        myPosition: myIndex + 1,
        totalInQueue: allAppointments.length,
        patientsBeforeMe: beforeMe,
        patientsServed: patientsServed,
        maxPatients: a.schedule.nop,
        scheduleid: a.schedule.scheduleid,
        title: a.schedule.title,
        scheduledate: a.schedule.scheduledate,
        scheduletime: a.schedule.scheduletime,
        doctorName: a.schedule.doctor.docname,
        specialty: a.schedule.doctor.specialty?.name || '',
        slotsAvailable: Math.max(0, a.schedule.nop - allAppointments.length),
      }
    })

    return NextResponse.json({
      patientName: patientRecord.pname,
      patientId: patientRecord.pid,
      queues: queueData,
    })
  }

  return NextResponse.json({ error: 'Missing scheduleid or patient=mine parameter' }, { status: 400 })
}