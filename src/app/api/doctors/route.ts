import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const search = req.nextUrl.searchParams.get('search') || ''
  const email = req.nextUrl.searchParams.get('email') || ''

  if (email) {
    const doctors = await db.doctor.findMany({
      where: { docemail: email, clinicid: parseInt(clinicId!) },
      include: { specialty: true },
    })
    return NextResponse.json({ doctors })
  }

  const doctors = await db.doctor.findMany({
    where: search
      ? {
          clinicid: parseInt(clinicId!),
          OR: [
            { docname: { contains: search } },
            { docemail: { contains: search } },
          ],
        }
      : { clinicid: parseInt(clinicId!) },
    include: {
      specialty: true,
      _count: { select: { schedules: true } },
    },
    orderBy: { docid: 'desc' },
  })

  return NextResponse.json(doctors)
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value
    const { docname, docemail, docpassword, docnic, doctel, specialties } = await req.json()

    if (!docname || !docemail || !docpassword) {
      return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
    }

    // Check existing in same clinic
    const existing = await db.doctor.findUnique({
      where: { clinicid_docemail: { clinicid: parseInt(clinicId!), docemail } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered in this clinic' }, { status: 409 })
    }

    // Create doctor
    const doctor = await db.doctor.create({
      data: { docname, docemail, docpassword, docnic: docnic || '', doctel: doctel || '', specialties: specialties ? parseInt(specialties) : null, clinicid: parseInt(clinicId!) },
      include: { specialty: true },
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}