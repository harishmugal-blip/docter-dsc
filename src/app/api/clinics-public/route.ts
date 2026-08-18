import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/clinics-public — List all active clinics (for main landing page)
export async function GET() {
  try {
    const clinics = await db.clinic.findMany({
      where: { status: 'active' },
      select: {
        clinicid: true,
        name: true,
        slug: true,
        city: true,
        plan: true,
        logo: true,
        primaryColor: true,
        phone: true,
        address: true,
        _count: {
          select: {
            doctors: true,
            patients: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ clinics })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
