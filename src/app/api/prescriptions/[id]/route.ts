import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET /api/prescriptions/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value

  const prescription = await db.prescription.findFirst({
    where: { prescriptionid: parseInt(id), clinicid: parseInt(clinicId!) },
    include: {
      patient: true,
      doctor: { include: { specialty: true } },
    },
  })

  if (!prescription) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(prescription)
}

// PUT /api/prescriptions/[id] — update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const usertype = cookieStore.get('edoc_usertype')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (usertype !== 'd') return NextResponse.json({ error: 'Only doctors can update prescriptions' }, { status: 403 })

  const { id } = await params
  try {
    // Verify prescription belongs to this clinic
    const existing = await db.prescription.findFirst({ where: { prescriptionid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { diagnosis, medicines, notes, followUpDate } = await req.json()

    const updated = await db.prescription.update({
      where: { prescriptionid: parseInt(id) },
      data: {
        ...(diagnosis !== undefined ? { diagnosis } : {}),
        ...(medicines !== undefined ? { medicines: typeof medicines === 'string' ? medicines : JSON.stringify(medicines) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(followUpDate !== undefined ? { followUpDate } : {}),
      },
      include: {
        patient: true,
        doctor: { include: { specialty: true } },
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/prescriptions/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const usertype = cookieStore.get('edoc_usertype')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (usertype !== 'd') return NextResponse.json({ error: 'Only doctors can delete prescriptions' }, { status: 403 })

  const { id } = await params
  try {
    // Verify prescription belongs to this clinic
    const existing = await db.prescription.findFirst({ where: { prescriptionid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.prescription.delete({ where: { prescriptionid: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
