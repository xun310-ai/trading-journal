import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET() {
  const db = getDb()
  // 回傳時不附上 PIN，只回傳是否有設定
  const users = db.prepare("SELECT id, name, CASE WHEN pin IS NOT NULL AND pin != '' THEN 1 ELSE 0 END as has_pin FROM users ORDER BY id").all()
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const { name } = await req.json()
  const result = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
  return NextResponse.json({ id: result.lastInsertRowid })
}

export async function PUT(req: NextRequest) {
  const db = getDb()
  const { id, name, pin } = await req.json()
  if (pin !== undefined) {
    db.prepare('UPDATE users SET name=?, pin=? WHERE id=?').run(name, pin || null, id)
  } else {
    db.prepare('UPDATE users SET name=? WHERE id=?').run(name, id)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  db.prepare('DELETE FROM users WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
