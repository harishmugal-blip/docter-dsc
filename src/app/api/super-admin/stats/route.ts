import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET – Return total stats across all clinics
export async function GET() {
  try {
    const cookieStore = await cookies()
    const superFlag = cookieStore.get('edoc_super')?.value
    const superEmail = cookieStore.get('edoc_super_email')?.value

    if (!superFlag || !superEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalClinics,
      totalDoctors,
      totalPatients,
      totalAppointments,
    ] = await Promise.all([
      db.clinic.count(),
      db.doctor.count(),
      db.patient.count(),
      db.appointment.count(),
    ])

    const activeClinics = await db.clinic.count({ where: { status: 'active' } })
    const inactiveClinics = await db.clinic.count({ where: { status: 'inactive' } })

    // Revenue by plan count
    const clinicsByPlan = await db.clinic.groupBy({
      by: ['plan'],
      _count: true,
    })

    const revenueByPlan = clinicsByPlan.map((item) => ({
      plan: item.plan,
      count: item._count,
    }))

    return NextResponse.json({
      totalClinics,
      totalDoctors,
      totalPatients,
      totalAppointments,
      activeClinics,
      inactiveClinics,
      revenueByPlan,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
