import { NextRequest, NextResponse } from 'next/server'
import { ensureInit } from '@/lib/db'

export async function POST(req: NextRequest) {
  const db = await ensureInit()
  const { id, pin } = await req.json()
  const result = await db.execute({ sql: 'SELECT pin FROM users WHERE id=?', args: [id] })
  const user = result.rows[0] as unknown as { pin: string | null } | undefined
  if (!user) return NextResponse.json({ ok: false })
  if (!user.pin) return NextResponse.json({ ok: true })
  return NextResponse.json({ ok: user.pin === String(pin) })
}
