import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

async function requireSuperAdmin() {
  const cookieStore = await cookies()
  const superFlag = cookieStore.get('edoc_super')?.value
  const superEmail = cookieStore.get('edoc_super_email')?.value
  if (!superFlag || !superEmail) return null
  return superEmail
}

// GET – List all clinics with stats (doctor count, patient count, appointment count)
export async function GET() {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinics = await db.clinic.findMany({
      include: {
        _count: {
          select: {
            doctors: true,
            patients: true,
            appointments: true,
          },
        },
      },
      orderBy: { clinicid: 'desc' },
    })

    return NextResponse.json({ clinics })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST – Create new clinic (with admin + default specialties)
export async function POST(req: NextRequest) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      slug,
      city,
      plan,
      phone,
      email,
      address,
      adminName,
      adminEmail,
      adminPassword,
    } = await req.json()

    if (!name || !slug || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Name, slug, admin name, admin email and admin password are required' },
        { status: 400 },
      )
    }

    // Check for duplicate slug
    const existingSlug = await db.clinic.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Clinic slug already exists' }, { status: 409 })
    }

    // Check for duplicate clinic name
    const existingName = await db.clinic.findUnique({ where: { name } })
    if (existingName) {
      return NextResponse.json({ error: 'Clinic name already exists' }, { status: 409 })
    }

    const now = new Date().toISOString()

    // Create clinic
    const clinic = await db.clinic.create({
      data: {
        name,
        slug,
        city: city || '',
        plan: plan || 'free',
        phone: phone || '',
        email: email || '',
        address: address || '',
        createdAt: now,
        admins: {
          create: {
            email: adminEmail,
            password: adminPassword,
            name: adminName,
          },
        },
        specialties: {
          create: [
            'General Medicine',
            'Dental',
            'Cardiology',
            'Orthopedic',
          ].map((s) => ({ name: s })),
        },
      },
      include: {
        _count: {
          select: {
            doctors: true,
            patients: true,
            appointments: true,
          },
        },
      },
    })

    return NextResponse.json({ clinic }, { status: 201 })
  } catch (error) {
    console.error('Create clinic error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH – Update clinic (status toggle, plan change)
export async function PATCH(req: NextRequest) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, plan, name, phone, email, address, city } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Clinic id is required' }, { status: 400 })
    }

    const updateData: Record<string, string> = {}
    if (status !== undefined) updateData.status = status
    if (plan !== undefined) updateData.plan = plan
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city

    const clinic = await db.clinic.update({
      where: { clinicid: parseInt(id) },
      data: updateData,
      include: {
        _count: {
          select: {
            doctors: true,
            patients: true,
            appointments: true,
          },
        },
      },
    })

    return NextResponse.json({ clinic })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE – Delete clinic by id
export async function DELETE(req: NextRequest) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Clinic id is required' }, { status: 400 })
    }

    const clinic = await db.clinic.findUnique({ where: { clinicid: parseInt(id) } })
    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    await db.clinic.delete({ where: { clinicid: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
