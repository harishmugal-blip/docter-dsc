import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/' as const,
}

// POST - Clinic Admin login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find clinic admin by email (email is unique across all admins since we check globally)
    // The unique constraint is [clinicid, email], so we need to findFirst by email
    const admin = await db.clinicAdmin.findFirst({ where: { email } })
    if (!admin || admin.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Fetch clinic info
    const clinic = await db.clinic.findUnique({ where: { clinicid: admin.clinicid } })
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 500 })
    }

    const res = NextResponse.json({
      success: true,
      name: admin.name,
      clinic: {
        clinicid: clinic.clinicid,
        name: clinic.name,
        slug: clinic.slug,
      },
    })

    res.cookies.set('edoc_clinic_admin', '1', COOKIE_OPTIONS)
    res.cookies.set('edoc_clinic_admin_email', admin.email, COOKIE_OPTIONS)
    res.cookies.set('edoc_clinic_id', String(admin.clinicid), COOKIE_OPTIONS)
    res.cookies.set('edoc_usertype', 'ca', COOKIE_OPTIONS)
    res.cookies.set('edoc_email', admin.email, COOKIE_OPTIONS)
    res.cookies.set('edoc_userid', String(admin.id), COOKIE_OPTIONS)

    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET - Check if clinic admin is logged in
export async function GET() {
  try {
    const cookieStore = await cookies()
    const clinicAdminFlag = cookieStore.get('edoc_clinic_admin')?.value
    const adminEmail = cookieStore.get('edoc_clinic_admin_email')?.value
    const usertype = cookieStore.get('edoc_usertype')?.value

    if (!clinicAdminFlag || !adminEmail || usertype !== 'ca') {
      return NextResponse.json({ error: 'Not authenticated as clinic admin' }, { status: 401 })
    }

    const admin = await db.clinicAdmin.findFirst({ where: { email: adminEmail } })
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 401 })
    }

    const clinic = await db.clinic.findUnique({ where: { clinicid: admin.clinicid } })
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 500 })
    }

    return NextResponse.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      clinic: {
        clinicid: clinic.clinicid,
        name: clinic.name,
        slug: clinic.slug,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE - Clinic Admin logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })

  const cookieNames = [
    'edoc_clinic_admin',
    'edoc_clinic_admin_email',
    'edoc_clinic_id',
    'edoc_usertype',
    'edoc_email',
    'edoc_userid',
    'edoc_super',
    'edoc_super_email',
  ]

  for (const name of cookieNames) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' })
  }

  return res
}
