import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value

  const specialties = await db.clinicSpecialty.findMany({
    where: { clinicid: parseInt(clinicId!) },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(specialties)
}
