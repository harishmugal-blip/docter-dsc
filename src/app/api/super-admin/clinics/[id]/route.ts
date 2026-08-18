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

// GET – Single clinic details with full stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const clinic = await db.clinic.findUnique({
      where: { clinicid: parseInt(id) },
      include: {
        admins: true,
        specialties: true,
        _count: {
          select: {
            doctors: true,
            patients: true,
            appointments: true,
            schedules: true,
            prescriptions: true,
          },
        },
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    return NextResponse.json({ clinic })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH – Update clinic details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const updateData: Record<string, string | number> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.city !== undefined) updateData.city = body.city
    if (body.plan !== undefined) updateData.plan = body.plan
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.status !== undefined) updateData.status = body.status
    if (body.maxDoctors !== undefined) updateData.maxDoctors = body.maxDoctors
    if (body.maxPatients !== undefined) updateData.maxPatients = body.maxPatients
    if (body.logo !== undefined) updateData.logo = body.logo
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor

    const clinic = await db.clinic.update({
      where: { clinicid: parseInt(id) },
      data: updateData,
      include: {
        admins: true,
        specialties: true,
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

// DELETE – Delete clinic
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authed = await requireSuperAdmin()
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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
