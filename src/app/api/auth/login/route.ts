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

export async function POST(req: NextRequest) {
  try {
    const { email, password, clinicid: bodyClinicId } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Resolve clinicid from body or cookie
    const cookieStore = await cookies()
    const cookieClinicId = cookieStore.get('edoc_clinic_id')?.value
    const clinicid = bodyClinicId ? Number(bodyClinicId) : cookieClinicId ? Number(cookieClinicId) : null

    if (!clinicid) {
      return NextResponse.json({ error: 'Clinic ID is required' }, { status: 400 })
    }

    // 1. Check ClinicAdmin
    const admin = await db.clinicAdmin.findUnique({
      where: { clinicid_email: { clinicid, email } },
    })
    if (admin && admin.password === password) {
      const clinic = await db.clinic.findUnique({ where: { clinicid } })
      const res = NextResponse.json({
        success: true,
        usertype: 'ca',
        name: admin.name,
        email: admin.email,
        userid: admin.id,
        clinic: {
          clinicid: clinic?.clinicid,
          name: clinic?.name,
          slug: clinic?.slug,
        },
      })

      res.cookies.set('edoc_usertype', 'ca', COOKIE_OPTIONS)
      res.cookies.set('edoc_email', admin.email, COOKIE_OPTIONS)
      res.cookies.set('edoc_clinic_id', String(clinicid), COOKIE_OPTIONS)
      res.cookies.set('edoc_userid', String(admin.id), COOKIE_OPTIONS)
      res.cookies.set('edoc_clinic_admin', '1', COOKIE_OPTIONS)
      res.cookies.set('edoc_clinic_admin_email', admin.email, COOKIE_OPTIONS)
      return res
    }

    // 2. Check Doctor
    const doctor = await db.doctor.findUnique({
      where: { clinicid_docemail: { clinicid, docemail: email } },
    })
    if (doctor && doctor.docpassword === password) {
      const res = NextResponse.json({
        success: true,
        usertype: 'd',
        name: doctor.docname,
        email: doctor.docemail,
        userid: doctor.docid,
        clinicid: doctor.clinicid,
      })

      res.cookies.set('edoc_usertype', 'd', COOKIE_OPTIONS)
      res.cookies.set('edoc_email', doctor.docemail, COOKIE_OPTIONS)
      res.cookies.set('edoc_clinic_id', String(doctor.clinicid), COOKIE_OPTIONS)
      res.cookies.set('edoc_userid', String(doctor.docid), COOKIE_OPTIONS)
      return res
    }

    // 3. Check Patient
    const patient = await db.patient.findUnique({
      where: { clinicid_pemail: { clinicid, pemail: email } },
    })
    if (patient && patient.ppassword === password) {
      const res = NextResponse.json({
        success: true,
        usertype: 'p',
        name: patient.pname,
        email: patient.pemail,
        userid: patient.pid,
        clinicid: patient.clinicid,
      })

      res.cookies.set('edoc_usertype', 'p', COOKIE_OPTIONS)
      res.cookies.set('edoc_email', patient.pemail, COOKIE_OPTIONS)
      res.cookies.set('edoc_clinic_id', String(patient.clinicid), COOKIE_OPTIONS)
      res.cookies.set('edoc_userid', String(patient.pid), COOKIE_OPTIONS)
      return res
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
