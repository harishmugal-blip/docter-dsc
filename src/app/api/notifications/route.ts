import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

function makeWaLink(phone: string, text: string) {
  const p = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}

// GET - fetch notifications (admin: all, patient: own)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const pid = req.nextUrl.searchParams.get('pid')
  const type = req.nextUrl.searchParams.get('type')
  const status = req.nextUrl.searchParams.get('status')
  const all = req.nextUrl.searchParams.get('all')

  const where: Record<string, unknown> = { clinicid: parseInt(clinicId!) }
  if (pid && all !== 'true') where.patientId = parseInt(pid)
  if (type) where.type = type
  if (status) where.status = status

  const notifications = await db.notification.findMany({
    where,
    include: {
      patient: { select: { pid: true, pname: true, ptel: true, pemail: true } },
      prescription: { select: { prescriptionid: true, diagnosis: true, medicines: true } },
      appointment: { select: { appoid: true, apponum: true, appodate: true } },
    },
    orderBy: { id: 'desc' },
    take: 100,
  })

  return NextResponse.json(notifications)
}

// POST - create notification manually
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value
    const body = await req.json()
    const { type, title, message, patientPhone, patientId, prescriptionId, appointmentId, scheduleId, scheduledAt } = body

    const waDeepLink = patientPhone ? makeWaLink(patientPhone, message || title) : ''

    const notification = await db.notification.create({
      data: {
        type: type || 'general',
        title: title || '',
        message: message || '',
        patientPhone: patientPhone || '',
        patientId: patientId || null,
        prescriptionId: prescriptionId || null,
        appointmentId: appointmentId || null,
        scheduleId: scheduleId || null,
        scheduledAt: scheduledAt || '',
        createdAt: new Date().toISOString(),
        waDeepLink,
        status: 'pending',
        clinicid: parseInt(clinicId!),
      },
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}

// DELETE - dismiss/delete notification
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Verify notification belongs to this clinic
  const notification = await db.notification.findFirst({ where: { id: parseInt(id), clinicid: parseInt(clinicId!) } })
  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.notification.delete({ where: { id: parseInt(id) } })
  return NextResponse.json({ success: true })
}
