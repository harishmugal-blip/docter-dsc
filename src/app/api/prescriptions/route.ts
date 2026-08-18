import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// GET /api/prescriptions?pid=1  (patient's prescriptions)
// GET /api/prescriptions?docid=1  (doctor's prescriptions)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('edoc_email')?.value
  const usertype = cookieStore.get('edoc_usertype')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (!email || !usertype) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pid = req.nextUrl.searchParams.get('pid')
  const docid = req.nextUrl.searchParams.get('docid')

  const where: Record<string, unknown> = { clinicid: parseInt(clinicId!) }
  if (pid) where.pid = parseInt(pid)
  if (docid) where.docid = parseInt(docid)

  // Patient can only see own prescriptions
  if (usertype === 'p' && !pid) {
    const patient = await db.patient.findFirst({ where: { pemail: email, clinicid: parseInt(clinicId!) } })
    if (patient) where.pid = patient.pid
  }
  // Doctor can only see own prescriptions
  if (usertype === 'd' && !docid) {
    const doctor = await db.doctor.findFirst({ where: { docemail: email, clinicid: parseInt(clinicId!) } })
    if (doctor) where.docid = doctor.docid
  }

  const prescriptions = await db.prescription.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { specialty: true } },
    },
    orderBy: { prescriptionid: 'desc' },
  })

  return NextResponse.json(prescriptions)
}

// POST /api/prescriptions — create prescription
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('edoc_email')?.value
  const usertype = cookieStore.get('edoc_usertype')?.value
  const clinicId = cookieStore.get('edoc_clinic_id')?.value
  if (!email || usertype !== 'd') return NextResponse.json({ error: 'Only doctors can create prescriptions' }, { status: 403 })

  try {
    const { pid, diagnosis, medicines, notes, followUpDate } = await req.json()

    if (!pid || !medicines) {
      return NextResponse.json({ error: 'Patient and medicines required' }, { status: 400 })
    }

    const doctor = await db.doctor.findFirst({ where: { docemail: email, clinicid: parseInt(clinicId!) } })
    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

    const patient = await db.patient.findFirst({ where: { pid: parseInt(pid), clinicid: parseInt(clinicId!) } })
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    const today = new Date().toISOString().split('T')[0]

    const prescription = await db.prescription.create({
      data: {
        pid: parseInt(pid),
        docid: doctor.docid,
        diagnosis: diagnosis || '',
        medicines: typeof medicines === 'string' ? medicines : JSON.stringify(medicines),
        notes: notes || '',
        followUpDate: followUpDate || '',
        createdDate: today,
        clinicid: parseInt(clinicId!),
      },
      include: {
        patient: true,
        doctor: { include: { specialty: true } },
      },
    })

    // Auto-generate WhatsApp notifications for prescription
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      // Medicine reminders
      await fetch(`${baseUrl}/api/notifications/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'medicine_reminders', prescriptionId: prescription.prescriptionid }),
      })
      // Prescription share
      await fetch(`${baseUrl}/api/notifications/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prescription_share', prescriptionId: prescription.prescriptionid }),
      })
    } catch { /* notification generation is best-effort */ }

    return NextResponse.json(prescription, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
