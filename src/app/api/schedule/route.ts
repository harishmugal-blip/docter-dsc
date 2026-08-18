import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  const docid = req.nextUrl.searchParams.get('docid')
  const date = req.nextUrl.searchParams.get('date')

  const where: Record<string, unknown> = { clinicid: parseInt(clinicId!) }
  if (docid) where.docid = parseInt(docid)
  if (date) where.scheduledate = date

  const schedules = await db.schedule.findMany({
    where,
    include: {
      doctor: { include: { specialty: true } },
      _count: { select: { appointments: true } },
    },
    orderBy: [{ scheduledate: 'asc' }, { scheduletime: 'asc' }],
  })

  return NextResponse.json(schedules)
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value
    const { title, docid, scheduledate, scheduletime, nop } = await req.json()

    if (!docid || !scheduledate || !scheduletime) {
      return NextResponse.json({ error: 'Doctor, date and time required' }, { status: 400 })
    }

    const schedule = await db.schedule.create({
      data: { title: title || '', docid: parseInt(docid), scheduledate, scheduletime, nop: parseInt(nop) || 1, clinicid: parseInt(clinicId!) },
      include: { doctor: true },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
