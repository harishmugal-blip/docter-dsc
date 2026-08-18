import { NextResponse } from 'next/server'

const AUTH_COOKIES = [
  'edoc_email',
  'edoc_usertype',
  'edoc_clinic_id',
  'edoc_userid',
  'edoc_super',
  'edoc_super_email',
  'edoc_clinic_admin',
  'edoc_clinic_admin_email',
]

export async function POST() {
  const res = NextResponse.json({ success: true })

  for (const name of AUTH_COOKIES) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' })
  }

  return res
}
