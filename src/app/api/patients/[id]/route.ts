import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET single patient
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value

  const patient = await db.patient.findFirst({
    where: { pid: parseInt(id), clinicid: parseInt(clinicId!) },
  })
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ patient })
}

// PUT - Update patient profile
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    // Verify patient belongs to this clinic
    const existingPatient = await db.patient.findFirst({ where: { pid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!existingPatient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { pname, pemail, pnic, paddress, ptel, ppassword, oldEmail } = body

    // Check if new email is already used by another patient
    if (pemail && oldEmail && pemail !== oldEmail) {
      const emailExists = await db.patient.findFirst({ where: { pemail } })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const updateData: Record<string, string> = {}
    if (pname !== undefined) updateData.pname = pname
    if (pemail !== undefined) updateData.pemail = pemail
    if (pnic !== undefined) updateData.pnic = pnic
    if (paddress !== undefined) updateData.paddress = paddress
    if (ptel !== undefined) updateData.ptel = ptel
    if (ppassword) updateData.ppassword = ppassword

    const patient = await db.patient.update({
      where: { pid: parseInt(id) },
      data: updateData,
    })

    if (pemail && oldEmail && pemail !== oldEmail) {
      const res = NextResponse.json({ patient })
      res.cookies.set('edoc_email', pemail, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return res
    }

    return NextResponse.json({ patient })
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE - Remove patient account
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    const patient = await db.patient.findFirst({ where: { pid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete appointments first
    await db.appointment.deleteMany({ where: { pid: parseInt(id) } })
    // Delete patient
    await db.patient.delete({ where: { pid: parseInt(id) } })

    // Clear auth cookies
    const res = NextResponse.json({ success: true })
    res.cookies.set('edoc_email', '', { maxAge: 0, path: '/' })
    res.cookies.set('edoc_usertype', '', { maxAge: 0, path: '/' })
    return res
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
