import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/notifications/mark-sent?id=X
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const updated = await db.notification.update({
    where: { id: parseInt(id) },
    data: { status: 'sent', sentAt: new Date().toISOString() },
  })
  return NextResponse.json(updated)
}
