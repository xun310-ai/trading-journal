import { NextRequest, NextResponse } from 'next/server'
import { ensureInit } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = await ensureInit()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const pf = searchParams.get('pf')
  const user = searchParams.get('user')

  let query = 'SELECT * FROM daily_plans WHERE 1=1'
  const args: (string | number | null)[] = []

  if (date) { query += ' AND date = ?'; args.push(date) }
  if (pf && pf !== 'all') { query += ' AND pf_account_id = ?'; args.push(parseInt(pf)) }
  if (user && user !== 'all') { query += ' AND user_id = ?'; args.push(parseInt(user)) }

  const result = await db.execute({ sql: query, args })
  return NextResponse.json(result.rows[0] ?? null)
}

export async function POST(req: NextRequest) {
  const db = await ensureInit()
  const body = await req.json()
  const { user_id, date, pf_account_id, key_levels, plan, max_trades, day_summary } = body

  const existing = await db.execute({
    sql: 'SELECT id FROM daily_plans WHERE date=? AND pf_account_id=? AND (user_id=? OR user_id IS NULL)',
    args: [date, pf_account_id, user_id || null]
  })

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE daily_plans SET key_levels=?, plan=?, max_trades=?, day_summary=?, user_id=?
            WHERE date=? AND pf_account_id=?`,
      args: [key_levels, plan, max_trades, day_summary, user_id || null, date, pf_account_id]
    })
    return NextResponse.json({ ok: true, updated: true })
  }

  await db.execute({
    sql: `INSERT INTO daily_plans (user_id, date, pf_account_id, key_levels, plan, max_trades, day_summary)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [user_id || null, date, pf_account_id, key_levels, plan, max_trades, day_summary]
  })

  return NextResponse.json({ ok: true })
}
