import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET() {
  const db = getDb()
  const accounts = db.prepare('SELECT * FROM pf_accounts ORDER BY name').all()
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { name, daily_loss_limit, max_drawdown, account_size } = body
  const result = db.prepare(
    'INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES (?, ?, ?, ?)'
  ).run(name, daily_loss_limit || 0, max_drawdown || 0, account_size || 0)
  return NextResponse.json({ id: result.lastInsertRowid })
}

export async function PUT(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { id, name, daily_loss_limit, max_drawdown, account_size } = body
  db.prepare(
    'UPDATE pf_accounts SET name=?, daily_loss_limit=?, max_drawdown=?, account_size=? WHERE id=?'
  ).run(name, daily_loss_limit || 0, max_drawdown || 0, account_size || 0, id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  db.prepare('DELETE FROM pf_accounts WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
