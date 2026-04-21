import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const pf = searchParams.get('pf')
  const user = searchParams.get('user')

  let query = 'SELECT * FROM daily_plans WHERE 1=1'
  const params: (string | number)[] = []

  if (date) { query += ' AND date = ?'; params.push(date) }
  if (pf && pf !== 'all') { query += ' AND pf_account_id = ?'; params.push(parseInt(pf)) }
  if (user && user !== 'all') { query += ' AND user_id = ?'; params.push(parseInt(user)) }

  const plan = db.prepare(query).get(...params)
  return NextResponse.json(plan || null)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { user_id, date, pf_account_id, key_levels, plan, max_trades, day_summary } = body

  const existing = db.prepare(
    'SELECT id FROM daily_plans WHERE date=? AND pf_account_id=? AND (user_id=? OR user_id IS NULL)'
  ).get(date, pf_account_id, user_id || null)

  if (existing) {
    db.prepare(`
      UPDATE daily_plans SET key_levels=?, plan=?, max_trades=?, day_summary=?, user_id=?
      WHERE date=? AND pf_account_id=?
    `).run(key_levels, plan, max_trades, day_summary, user_id || null, date, pf_account_id)
    return NextResponse.json({ ok: true, updated: true })
  }

  db.prepare(`
    INSERT INTO daily_plans (user_id, date, pf_account_id, key_levels, plan, max_trades, day_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user_id || null, date, pf_account_id, key_levels, plan, max_trades, day_summary)

  return NextResponse.json({ ok: true })
}
