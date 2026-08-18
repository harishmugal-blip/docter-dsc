import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    // Verify appointment belongs to this clinic
    const appointment = await db.appointment.findFirst({ where: { appoid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.appointment.delete({ where: { appoid: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
