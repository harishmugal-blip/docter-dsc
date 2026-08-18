import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// POST – Login super admin
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const superAdmin = await db.superAdmin.findUnique({ where: { email } })
    if (!superAdmin || superAdmin.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true, name: superAdmin.name })

    res.cookies.set('edoc_super', '1', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    res.cookies.set('edoc_super_email', email, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// GET – Check if logged in, return super admin info
export async function GET() {
  try {
    const cookieStore = await cookies()
    const superFlag = cookieStore.get('edoc_super')?.value
    const superEmail = cookieStore.get('edoc_super_email')?.value

    if (!superFlag || !superEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const superAdmin = await db.superAdmin.findUnique({ where: { email: superEmail } })
    if (!superAdmin) {
      return NextResponse.json({ error: 'Super admin not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE – Logout (clear cookies)
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('edoc_super', '', { maxAge: 0, path: '/' })
  res.cookies.set('edoc_super_email', '', { maxAge: 0, path: '/' })
  return res
}
