import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value

  // Verify schedule belongs to this clinic
  const schedule = await db.schedule.findFirst({ where: { scheduleid: parseInt(id), clinicid: parseInt(clinicId!) } })
  if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const patients = await db.appointment.findMany({
    where: { scheduleid: parseInt(id) },
    include: { patient: true },
    orderBy: { apponum: 'asc' },
  })
  return NextResponse.json(patients)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    // Verify schedule belongs to this clinic
    const schedule = await db.schedule.findFirst({ where: { scheduleid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete appointments first
    await db.appointment.deleteMany({ where: { scheduleid: parseInt(id) } })
    await db.schedule.delete({ where: { scheduleid: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}