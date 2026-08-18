import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── 1. Super Admin ───
  console.log('── Creating Super Admin ──');
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: 'super@docteresa.com',
      password: 'super123',
      name: 'Super Admin',
    },
  });
  console.log(`  ✓ Super Admin: ${superAdmin.email}`);

  // ─── 2. Clinics ───
  const clinicsData = [
    { name: 'Falah Clinic', slug: 'falaha', city: 'Mumbai', plan: 'premium' },
    { name: 'Sharma Hospital', slug: 'sharma', city: 'Delhi', plan: 'standard' },
    { name: 'City Medical', slug: 'citymedical', city: 'Jaipur', plan: 'free' },
  ];

  const clinics: any[] = [];
  console.log('\n── Creating Clinics ──');
  for (const c of clinicsData) {
    const clinic = await prisma.clinic.create({
      data: {
        name: c.name,
        slug: c.slug,
        city: c.city,
        plan: c.plan,
        createdAt: new Date().toISOString(),
      },
    });
    clinics.push(clinic);
    console.log(`  ✓ Clinic: ${clinic.name} (${clinic.slug}) – plan: ${clinic.plan}`);
  }

  // ─── 3. Clinic Admins ───
  console.log('\n── Creating Clinic Admins ──');
  for (const clinic of clinics) {
    const admin = await prisma.clinicAdmin.create({
      data: {
        clinicid: clinic.clinicid,
        email: `${clinic.slug}-admin@test.com`,
        password: 'admin123',
        name: `Admin of ${clinic.name}`,
      },
    });
    console.log(`  ✓ ${admin.name}: ${admin.email}`);
  }

  // ─── 4. Specialties per clinic ───
  const specialtyNames = ['General Medicine', 'Dental', 'Cardiology', 'Orthopedic', 'Pediatric'];
  console.log('\n── Creating Clinic Specialties ──');
  for (const clinic of clinics) {
    for (const sName of specialtyNames) {
      const spec = await prisma.clinicSpecialty.create({
        data: {
          clinicid: clinic.clinicid,
          name: sName,
        },
      });
      console.log(`  ✓ [${clinic.slug}] ${spec.name}`);
    }
  }

  // ─── 5. Falah Clinic: Doctors, Patients, Schedule, Appointment ───
  const falahClinic = clinics[0];

  // Get Falah Clinic specialties
  const falahSpecialties = await prisma.clinicSpecialty.findMany({
    where: { clinicid: falahClinic.clinicid },
  });
  const genMedSpec = falahSpecialties.find((s: any) => s.name === 'General Medicine');
  const dentalSpec = falahSpecialties.find((s: any) => s.name === 'Dental');

  console.log('\n── Creating Demo Doctors (Falah Clinic) ──');
  const drAmit = await prisma.doctor.create({
    data: {
      clinicid: falahClinic.clinicid,
      docemail: 'dr.amit@falaha.com',
      docname: 'Dr. Amit Patel',
      docpassword: 'doc123',
      specialties: genMedSpec!.id,
    },
  });
  console.log(`  ✓ ${drAmit.docname} (${genMedSpec!.name})`);

  const drPriya = await prisma.doctor.create({
    data: {
      clinicid: falahClinic.clinicid,
      docemail: 'dr.priya@falaha.com',
      docname: 'Dr. Priya Sharma',
      docpassword: 'doc123',
      specialties: dentalSpec!.id,
    },
  });
  console.log(`  ✓ ${drPriya.docname} (${dentalSpec!.name})`);

  console.log('\n── Creating Demo Patients (Falah Clinic) ──');
  const patients = [
    { pname: 'Rajesh Kumar', pemail: 'rajesh@test.com', ptel: '919876543210' },
    { pname: 'Sunita Devi', pemail: 'sunita@test.com', ptel: '919876543211' },
    { pname: 'Amit Singh', pemail: 'amit@test.com', ptel: '919876543212' },
  ];

  const createdPatients: any[] = [];
  for (const p of patients) {
    const patient = await prisma.patient.create({
      data: {
        clinicid: falahClinic.clinicid,
        pemail: p.pemail,
        pname: p.pname,
        ppassword: 'pat123',
        ptel: p.ptel,
      },
    });
    createdPatients.push(patient);
    console.log(`  ✓ ${patient.pname} (${patient.pemail})`);
  }

  // ─── 6. Schedule for Dr. Amit (tomorrow) ───
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log('\n── Creating Demo Schedule (Falah Clinic) ──');
  const schedule = await prisma.schedule.create({
    data: {
      clinicid: falahClinic.clinicid,
      docid: drAmit.docid,
      title: 'Morning OPD',
      scheduledate: tomorrowStr,
      scheduletime: '10:00 AM',
      nop: 10,
    },
  });
  console.log(`  ✓ Schedule #${schedule.scheduleid}: Dr. Amit Patel – ${tomorrowStr} at ${schedule.scheduletime} (${schedule.nop} slots)`);

  // ─── 7. Appointment for Rajesh Kumar ───
  console.log('\n── Creating Demo Appointment (Falah Clinic) ──');
  const appointment = await prisma.appointment.create({
    data: {
      clinicid: falahClinic.clinicid,
      pid: createdPatients[0].pid,
      scheduleid: schedule.scheduleid,
      apponum: 1,
      appodate: tomorrowStr,
    },
  });
  console.log(`  ✓ Appointment #${appointment.appoid}: Rajesh Kumar → Dr. Amit Patel on ${tomorrowStr} (slot #${appointment.apponum})`);

  // ─── Summary ───
  console.log('\n═══════════════════════════════════════');
  console.log('  ✅ Seeding completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`  Super Admin:   1`);
  console.log(`  Clinics:       ${clinics.length}`);
  console.log(`  Clinic Admins: ${clinics.length}`);
  console.log(`  Specialties:   ${clinics.length * specialtyNames.length}`);
  console.log(`  Doctors:       2 (Falah Clinic only)`);
  console.log(`  Patients:      3 (Falah Clinic only)`);
  console.log(`  Schedules:     1 (Falah Clinic only)`);
  console.log(`  Appointments:  1 (Falah Clinic only)`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e: any) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
