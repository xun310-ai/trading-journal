import { NextRequest, NextResponse } from 'next/server'
import { ensureInit } from '@/lib/db'

export async function GET() {
  const db = await ensureInit()
  const result = await db.execute(
    "SELECT id, name, CASE WHEN pin IS NOT NULL AND pin != '' THEN 1 ELSE 0 END as has_pin FROM users ORDER BY id"
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const db = await ensureInit()
  const { name } = await req.json()
  const result = await db.execute({ sql: 'INSERT INTO users (name) VALUES (?)', args: [name] })
  return NextResponse.json({ id: Number(result.lastInsertRowid) })
}

export async function PUT(req: NextRequest) {
  const db = await ensureInit()
  const { id, name, pin } = await req.json()
  if (pin !== undefined) {
    await db.execute({ sql: 'UPDATE users SET name=?, pin=? WHERE id=?', args: [name, pin || null, id] })
  } else {
    await db.execute({ sql: 'UPDATE users SET name=? WHERE id=?', args: [name, id] })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const db = await ensureInit()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  await db.execute({ sql: 'DELETE FROM users WHERE id=?', args: [id] })
  return NextResponse.json({ ok: true })
}
