import { NextRequest, NextResponse } from 'next/server'
import { ensureInit } from '@/lib/db'

export async function GET() {
  const db = await ensureInit()
  const result = await db.execute('SELECT * FROM symbol_settings ORDER BY symbol')
  return NextResponse.json(result.rows)
}

export async function PUT(req: NextRequest) {
  const db = await ensureInit()
  const { symbol, point_value, commission } = await req.json()
  await db.execute({
    sql: 'UPDATE symbol_settings SET point_value=?, commission=? WHERE symbol=?',
    args: [point_value, commission, symbol]
  })
  return NextResponse.json({ ok: true })
}
