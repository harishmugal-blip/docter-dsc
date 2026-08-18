import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    // Verify doctor belongs to this clinic
    const existing = await db.doctor.findFirst({ where: { docid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { docname, docemail, docnic, doctel, specialties, docpassword, oldEmail } = body

    // Check if new email is already used by another doctor
    if (docemail && oldEmail && docemail !== oldEmail) {
      const emailExists = await db.doctor.findFirst({ where: { docemail } })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const updateData: Record<string, string | number | null> = {}
    if (docname !== undefined) updateData.docname = docname
    if (docemail !== undefined) updateData.docemail = docemail
    if (docnic !== undefined) updateData.docnic = docnic || ''
    if (doctel !== undefined) updateData.doctel = doctel || ''
    if (specialties !== undefined) updateData.specialties = specialties ? parseInt(specialties) : null
    if (docpassword) updateData.docpassword = docpassword

    const doctor = await db.doctor.update({
      where: { docid: parseInt(id) },
      data: updateData,
      include: { specialty: true },
    })

    if (docemail && oldEmail && docemail !== oldEmail) {
      const res = NextResponse.json({ doctor })
      res.cookies.set('edoc_email', docemail, {
        httpOnly: true, secure: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
      })
      return res
    }

    return NextResponse.json({ doctor })
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value

    const doctor = await db.doctor.findFirst({ where: { docid: parseInt(id), clinicid: parseInt(clinicId!) } })
    if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.doctor.delete({ where: { docid: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}