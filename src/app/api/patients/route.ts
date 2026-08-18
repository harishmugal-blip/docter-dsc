import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const search = req.nextUrl.searchParams.get('search') || ''
  const email = req.nextUrl.searchParams.get('email') || ''

  if (email) {
    const patients = await db.patient.findMany({
      where: { pemail: email, clinicid: parseInt(clinicId!) },
    })
    return NextResponse.json({ patients })
  }

  const patients = await db.patient.findMany({
    where: search
      ? {
          clinicid: parseInt(clinicId!),
          OR: [
            { pname: { contains: search } },
            { pemail: { contains: search } },
            { pnic: { contains: search } },
          ],
        }
      : { clinicid: parseInt(clinicId!) },
    include: { _count: { select: { appointments: true } } },
    orderBy: { pid: 'desc' },
  })

  return NextResponse.json({ patients })
}