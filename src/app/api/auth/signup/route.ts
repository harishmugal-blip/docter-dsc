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
    const { name, email, password, phone, address, nic, dob, role } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 })
    }

    if (role !== 'doctor' && role !== 'patient') {
      return NextResponse.json({ error: 'Role must be doctor or patient' }, { status: 400 })
    }

    // Get clinicid from cookie (required for multi-tenant)
    const cookieStore = await cookies()
    const clinicIdRaw = cookieStore.get('edoc_clinic_id')?.value
    if (!clinicIdRaw) {
      return NextResponse.json({ error: 'Clinic context is required. Please access from a clinic subdomain.' }, { status: 400 })
    }
    const clinicid = Number(clinicIdRaw)

    // Verify clinic exists
    const clinic = await db.clinic.findUnique({ where: { clinicid } })
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 400 })
    }

    if (role === 'doctor') {
      // Check if doctor email already exists in this clinic
      const existing = await db.doctor.findUnique({
        where: { clinicid_docemail: { clinicid, docemail: email } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered in this clinic' }, { status: 409 })
      }

      const doctor = await db.doctor.create({
        data: {
          clinicid,
          docemail: email,
          docname: name,
          docpassword: password,
          docnic: nic || '',
          doctel: phone || '',
        },
      })

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

    if (role === 'patient') {
      // Check if patient email already exists in this clinic
      const existing = await db.patient.findUnique({
        where: { clinicid_pemail: { clinicid, pemail: email } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered in this clinic' }, { status: 409 })
      }

      const patient = await db.patient.create({
        data: {
          clinicid,
          pemail: email,
          pname: name,
          ppassword: password,
          paddress: address || '',
          pnic: nic || '',
          pdob: dob || '',
          ptel: phone || '',
        },
      })

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

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
