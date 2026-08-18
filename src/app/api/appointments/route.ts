import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const docid = req.nextUrl.searchParams.get('docid')
  const pid = req.nextUrl.searchParams.get('pid')
  const date = req.nextUrl.searchParams.get('date')

  const where: Record<string, unknown> = { clinicid: parseInt(clinicId!) }
  if (pid) where.pid = parseInt(pid)
  if (docid) {
    where.schedule = { docid: parseInt(docid) }
  }
  if (date) {
    where.schedule = { ...((where.schedule as Record<string, unknown>) || {}), scheduledate: date }
  }

  const appointments = await db.appointment.findMany({
    where,
    include: {
      patient: true,
      schedule: { include: { doctor: { include: { specialty: true } } } },
    },
    orderBy: { appoid: 'desc' },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value
    const { pid, scheduleid, appodate } = await req.json()

    if (!pid || !scheduleid) {
      return NextResponse.json({ error: 'Patient and schedule required' }, { status: 400 })
    }

    // Get count of existing appointments for this schedule
    const count = await db.appointment.count({ where: { scheduleid: parseInt(scheduleid) } })

    // Check capacity
    const schedule = await db.schedule.findUnique({ where: { scheduleid: parseInt(scheduleid) } })
    if (schedule && count >= schedule.nop) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Check duplicate
    const existing = await db.appointment.findFirst({
      where: { pid: parseInt(pid), scheduleid: parseInt(scheduleid) },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already booked this session' }, { status: 409 })
    }

    const appointment = await db.appointment.create({
      data: {
        pid: parseInt(pid),
        scheduleid: parseInt(scheduleid),
        apponum: count + 1,
        appodate: appodate || schedule?.scheduledate || '',
        clinicid: parseInt(clinicId!),
      },
      include: {
        patient: true,
        schedule: { include: { doctor: true } },
      },
    })

    // Auto-generate WhatsApp notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'appointment_confirm', appointmentId: appointment.appoid }),
      })
    } catch { /* notification generation is best-effort */ }

    return NextResponse.json(appointment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}