import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function POST(req: NextRequest) {
  const db = getDb()
  const { id, pin } = await req.json()
  const user = db.prepare('SELECT pin FROM users WHERE id=?').get(id) as { pin: string | null } | undefined
  if (!user) return NextResponse.json({ ok: false })
  if (!user.pin) return NextResponse.json({ ok: true }) // 沒設 PIN 直接通過
  return NextResponse.json({ ok: user.pin === String(pin) })
}
