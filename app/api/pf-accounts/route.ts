import { NextRequest, NextResponse } from 'next/server'
import { ensureInit } from '@/lib/db'

export async function GET() {
  const db = await ensureInit()
  const result = await db.execute('SELECT * FROM pf_accounts ORDER BY name')
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const db = await ensureInit()
  const { name, daily_loss_limit, max_drawdown, account_size } = await req.json()
  const result = await db.execute({
    sql: 'INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES (?, ?, ?, ?)',
    args: [name, daily_loss_limit || 0, max_drawdown || 0, account_size || 0]
  })
  return NextResponse.json({ id: Number(result.lastInsertRowid) })
}

export async function PUT(req: NextRequest) {
  const db = await ensureInit()
  const { id, name, daily_loss_limit, max_drawdown, account_size } = await req.json()
  await db.execute({
    sql: 'UPDATE pf_accounts SET name=?, daily_loss_limit=?, max_drawdown=?, account_size=? WHERE id=?',
    args: [name, daily_loss_limit || 0, max_drawdown || 0, account_size || 0, id]
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const db = await ensureInit()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  await db.execute({ sql: 'DELETE FROM pf_accounts WHERE id=?', args: [id] })
  return NextResponse.json({ ok: true })
}
