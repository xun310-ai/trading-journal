import { NextRequest, NextResponse } from 'next/server'
import getDb from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const pf = searchParams.get('pf')
  const user = searchParams.get('user')

  let query = `
    SELECT t.*, p.name as pf_name, p.daily_loss_limit, p.max_drawdown
    FROM trades t
    LEFT JOIN pf_accounts p ON t.pf_account_id = p.id
    WHERE 1=1
  `
  const params: (string | number)[] = []

  if (date) {
    query += ' AND t.date = ?'
    params.push(date)
  } else if (from && to) {
    query += ' AND t.date >= ? AND t.date <= ?'
    params.push(from, to)
  }

  if (pf && pf !== 'all') {
    query += ' AND t.pf_account_id = ?'
    params.push(parseInt(pf))
  }

  if (user && user !== 'all') {
    query += ' AND t.user_id = ?'
    params.push(parseInt(user))
  }

  query += ' ORDER BY t.date DESC, t.time DESC'

  const trades = db.prepare(query).all(...params)
  return NextResponse.json(trades)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const {
    user_id, date, time, pf_account_id, symbol, direction,
    entry_price, exit_price, contracts,
    stop_loss_points, profit_points, pnl,
    setup_tag, session, entry_reason, exit_reason,
    mental_state, broke_rules, screenshots
  } = body

  const result = db.prepare(`
    INSERT INTO trades (
      user_id, date, time, pf_account_id, symbol, direction,
      entry_price, exit_price, contracts,
      stop_loss_points, profit_points, pnl,
      setup_tag, session, entry_reason, exit_reason,
      mental_state, broke_rules, screenshots
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user_id || null, date, time, pf_account_id, symbol, direction,
    entry_price, exit_price, contracts || 1,
    stop_loss_points, profit_points, pnl || 0,
    setup_tag, session, entry_reason, exit_reason,
    mental_state || 'clear', broke_rules ? 1 : 0,
    JSON.stringify(screenshots || [])
  )

  return NextResponse.json({ id: result.lastInsertRowid })
}

export async function DELETE(req: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  db.prepare('DELETE FROM trades WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
