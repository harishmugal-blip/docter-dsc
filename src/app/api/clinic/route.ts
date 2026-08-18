import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/clinic?slug=falaha  — Get clinic info by slug (public)
// Used by the frontend to detect and set clinic context on subdomain
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const clinic = await db.clinic.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { doctors: true, patients: true },
        },
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    if (clinic.status === 'inactive') {
      return NextResponse.json({ error: 'This clinic is currently inactive' }, { status: 403 })
    }

    return NextResponse.json({
      clinicid: clinic.clinicid,
      name: clinic.name,
      slug: clinic.slug,
      city: clinic.city,
      plan: clinic.plan,
      logo: clinic.logo,
      primaryColor: clinic.primaryColor,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      doctorCount: clinic._count.doctors,
      patientCount: clinic._count.patients,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
