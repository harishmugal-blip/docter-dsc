import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

function makeWaLink(phone: string, text: string) {
  const p = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`
}

function nowISO() {
  return new Date().toISOString()
}

// POST /api/notifications/generate
// Body: { action: 'appointment_confirm' | 'medicine_reminders' | 'appointment_reminder' | 'prescription_share' | 'queue_update', ...ids }
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const clinicId = cookieStore.get('edoc_clinic_id')?.value
    const body = await req.json()
    const { action } = body

    if (action === 'appointment_confirm') {
      // Generate confirmation when appointment is booked
      const { appointmentId } = body
      const appt = await db.appointment.findUnique({
        where: { appoid: parseInt(appointmentId) },
        include: {
          patient: true,
          schedule: { include: { doctor: { include: { specialty: true } } } },
        },
      })
      if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

      const msg = `*Docter Esa - Appointment Confirmed!*\n\n` +
        `Hello ${appt.patient.pname}! Your appointment has been booked.\n\n` +
        `*Doctor:* Dr. ${appt.schedule.doctor.docname} (${appt.schedule.doctor.specialty?.name || 'General'})\n` +
        `*Date:* ${appt.appodate}\n` +
        `*Time:* ${appt.schedule.scheduletime}\n` +
        `*Token No:* #${appt.apponum}\n\n` +
        `Please arrive 10 minutes early.\nThank you!`

      const waLink = appt.patient.ptel ? makeWaLink(appt.patient.ptel, msg) : ''

      const notif = await db.notification.create({
        data: {
          type: 'appointment_confirm',
          title: 'Appointment Confirmed',
          message: msg,
          patientPhone: appt.patient.ptel || '',
          patientId: appt.patient.pid,
          appointmentId: appt.appoid,
          scheduleId: appt.schedule.scheduleid,
          scheduledAt: nowISO(),
          createdAt: nowISO(),
          waDeepLink: waLink,
          status: 'pending',
          clinicid: parseInt(clinicId!),
        },
      })
      return NextResponse.json(notif, { status: 201 })
    }

    if (action === 'medicine_reminders') {
      // Generate medicine reminders from a prescription
      const { prescriptionId } = body
      const rx = await db.prescription.findUnique({
        where: { prescriptionid: parseInt(prescriptionId) },
        include: { patient: true, doctor: true },
      })
      if (!rx) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })

      let medicines: any[] = []
      try { medicines = JSON.parse(rx.medicines) } catch { medicines = [] }

      const notifications: any[] = []
      const frequencies = ['morning', 'afternoon', 'evening', 'night']

      for (const med of medicines) {
        const freq = med.frequency || 'morning'
        const freqList = freq.split(',').map((f: string) => f.trim().toLowerCase())

        for (const f of freqList) {
          if (!frequencies.includes(f)) continue
          const timeLabel = f === 'morning' ? '8:00 AM' : f === 'afternoon' ? '1:00 PM' : f === 'evening' ? '6:00 PM' : '9:00 PM'

          const msg = `*Docter Esa - Medicine Reminder*\n\n` +
            `Hello ${rx.patient.pname}! It's time for your medicine.\n\n` +
            `*Medicine:* ${med.name}\n` +
            `*Dosage:* ${med.dosage}\n` +
            `*Time:* ${timeLabel} (${f})\n` +
            `*Prescribed by:* Dr. ${rx.doctor.docname}\n` +
            `*Diagnosis:* ${rx.diagnosis}\n\n` +
            `Please take your medicine on time.`

          const waLink = rx.patient.ptel ? makeWaLink(rx.patient.ptel, msg) : ''

          const notif = await db.notification.create({
            data: {
              type: 'medicine_reminder',
              title: `Medicine: ${med.name} (${f})`,
              message: msg,
              patientPhone: rx.patient.ptel || '',
              patientId: rx.patient.pid,
              prescriptionId: rx.prescriptionid,
              scheduledAt: nowISO(),
              createdAt: nowISO(),
              waDeepLink: waLink,
              status: 'pending',
              clinicid: parseInt(clinicId!),
            },
          })
          notifications.push(notif)
        }
      }

      return NextResponse.json({ created: notifications.length, notifications }, { status: 201 })
    }

    if (action === 'appointment_reminder') {
      // Reminder before appointment (1 hour before)
      const { appointmentId } = body
      const appt = await db.appointment.findUnique({
        where: { appoid: parseInt(appointmentId) },
        include: {
          patient: true,
          schedule: { include: { doctor: { include: { specialty: true } } } },
        },
      })
      if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

      const msg = `*Docter Esa - Appointment Reminder*\n\n` +
        `Hello ${appt.patient.pname}! Your appointment is coming up soon.\n\n` +
        `*Doctor:* Dr. ${appt.schedule.doctor.docname}\n` +
        `*Date:* ${appt.appodate}\n` +
        `*Time:* ${appt.schedule.scheduletime}\n` +
        `*Token No:* #${appt.apponum}\n\n` +
        `Please be ready!`

      const waLink = appt.patient.ptel ? makeWaLink(appt.patient.ptel, msg) : ''

      const notif = await db.notification.create({
        data: {
          type: 'appointment_reminder',
          title: 'Upcoming Appointment',
          message: msg,
          patientPhone: appt.patient.ptel || '',
          patientId: appt.patient.pid,
          appointmentId: appt.appoid,
          scheduleId: appt.schedule.scheduleid,
          scheduledAt: nowISO(),
          createdAt: nowISO(),
          waDeepLink: waLink,
          status: 'pending',
          clinicid: parseInt(clinicId!),
        },
      })
      return NextResponse.json(notif, { status: 201 })
    }

    if (action === 'prescription_share') {
      // Share prescription via WhatsApp
      const { prescriptionId } = body
      const rx = await db.prescription.findUnique({
        where: { prescriptionid: parseInt(prescriptionId) },
        include: { patient: true, doctor: true },
      })
      if (!rx) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })

      let medicines: any[] = []
      try { medicines = JSON.parse(rx.medicines) } catch { medicines = [] }

      let medList = medicines.map((m: any, i: number) =>
        `${i + 1}. ${m.name} - ${m.dosage} (${m.frequency}) - ${m.duration || ''}`
      ).join('\n')

      const msg = `*Docter Esa - Prescription*\n\n` +
        `*Patient:* ${rx.patient.pname}\n` +
        `*Doctor:* Dr. ${rx.doctor.docname}\n` +
        `*Date:* ${rx.createdDate}\n` +
        `*Diagnosis:* ${rx.diagnosis}\n\n` +
        `*Medicines:*\n${medList}\n\n` +
        `*Notes:* ${rx.notes || 'None'}\n` +
        (rx.followUpDate ? `*Follow-up:* ${rx.followUpDate}` : '')

      const waLink = rx.patient.ptel ? makeWaLink(rx.patient.ptel, msg) : ''

      const notif = await db.notification.create({
        data: {
          type: 'prescription_share',
          title: 'Prescription Shared',
          message: msg,
          patientPhone: rx.patient.ptel || '',
          patientId: rx.patient.pid,
          prescriptionId: rx.prescriptionid,
          scheduledAt: nowISO(),
          createdAt: nowISO(),
          waDeepLink: waLink,
          status: 'pending',
          clinicid: parseInt(clinicId!),
        },
      })
      return NextResponse.json(notif, { status: 201 })
    }

    if (action === 'queue_update') {
      // Queue turn notification
      const { appointmentId, position } = body
      const appt = await db.appointment.findUnique({
        where: { appoid: parseInt(appointmentId) },
        include: {
          patient: true,
          schedule: { include: { doctor: true } },
        },
      })
      if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

      const pos = position || appt.apponum
      const msg = `*Docter Esa - Queue Update*\n\n` +
        `Hello ${appt.patient.pname}!\n\n` +
        `Your queue position: *#${pos}*\n` +
        `Doctor: Dr. ${appt.schedule.doctor.docname}\n` +
        `Patients ahead: ${Math.max(0, pos - 1)}\n\n` +
        `Please be ready when your turn comes.`

      const waLink = appt.patient.ptel ? makeWaLink(appt.patient.ptel, msg) : ''

      const notif = await db.notification.create({
        data: {
          type: 'queue_update',
          title: `Queue Position: #${pos}`,
          message: msg,
          patientPhone: appt.patient.ptel || '',
          patientId: appt.patient.pid,
          appointmentId: appt.appoid,
          scheduleId: appt.schedule.scheduleid,
          scheduledAt: nowISO(),
          createdAt: nowISO(),
          waDeepLink: waLink,
          status: 'pending',
          clinicid: parseInt(clinicId!),
        },
      })
      return NextResponse.json(notif, { status: 201 })
    }

    // Auto-check & generate pending medicine reminders (cron-like)
    if (action === 'auto_check') {
      // Find prescriptions with pending reminders that need to be sent
      const allPending = await db.notification.findMany({
        where: { type: 'medicine_reminder', status: 'pending', clinicid: parseInt(clinicId!) },
        include: { patient: true },
      })
      return NextResponse.json({ pending: allPending.length, notifications: allPending })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 })
  }
}
