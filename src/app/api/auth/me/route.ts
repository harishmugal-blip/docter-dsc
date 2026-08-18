import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const usertype = cookieStore.get('edoc_usertype')?.value
    const clinicIdRaw = cookieStore.get('edoc_clinic_id')?.value
    const useridRaw = cookieStore.get('edoc_userid')?.value

    if (!usertype || !clinicIdRaw) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clinicid = Number(clinicIdRaw)

    // Clinic Admin
    if (usertype === 'ca') {
      const admin = await db.clinicAdmin.findFirst({ where: { email: cookieStore.get('edoc_email')?.value || '' } })
      if (!admin) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }
      const clinic = await db.clinic.findUnique({ where: { clinicid } })
      return NextResponse.json({
        usertype: 'ca',
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        clinic: {
          clinicid: clinic?.clinicid,
          name: clinic?.name,
          slug: clinic?.slug,
        },
      })
    }

    // Doctor
    if (usertype === 'd' && useridRaw) {
      const docid = Number(useridRaw)
      const doctor = await db.doctor.findUnique({ where: { docid } })
      if (!doctor) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }
      return NextResponse.json({
        usertype: 'd',
        id: doctor.docid,
        name: doctor.docname,
        email: doctor.docemail,
        phone: doctor.doctel,
        nic: doctor.docnic,
        specialties: doctor.specialties,
        clinicid: doctor.clinicid,
      })
    }

    // Patient
    if (usertype === 'p' && useridRaw) {
      const pid = Number(useridRaw)
      const patient = await db.patient.findUnique({ where: { pid } })
      if (!patient) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }
      return NextResponse.json({
        usertype: 'p',
        id: patient.pid,
        name: patient.pname,
        email: patient.pemail,
        phone: patient.ptel,
        address: patient.paddress,
        nic: patient.pnic,
        dob: patient.pdob,
        clinicid: patient.clinicid,
      })
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
