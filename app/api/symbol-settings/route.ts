import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM symbol_settings ORDER BY symbol').all()
  return NextResponse.json(rows)
}

export async function PUT(req: NextRequest) {
  const db = getDb()
  const { symbol, point_value, commission } = await req.json()
  db.prepare('UPDATE symbol_settings SET point_value=?, commission=? WHERE symbol=?')
    .run(point_value, commission, symbol)
  return NextResponse.json({ ok: true })
}
