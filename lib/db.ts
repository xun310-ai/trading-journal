import { createClient, Client } from '@libsql/client'

let client: Client | null = null

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? 'file:trading.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return client
}

export async function initDb(): Promise<void> {
  const db = getDb()
  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS pf_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      daily_loss_limit REAL DEFAULT 0,
      max_drawdown REAL DEFAULT 0,
      account_size REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT NOT NULL,
      time TEXT,
      pf_account_id INTEGER,
      symbol TEXT NOT NULL,
      direction TEXT NOT NULL,
      entry_price REAL,
      exit_price REAL,
      contracts INTEGER DEFAULT 1,
      stop_loss_points REAL,
      profit_points REAL,
      pnl REAL DEFAULT 0,
      setup_tag TEXT,
      session TEXT,
      entry_reason TEXT,
      exit_reason TEXT,
      mental_state TEXT DEFAULT 'clear',
      broke_rules INTEGER DEFAULT 0,
      screenshots TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pf_account_id) REFERENCES pf_accounts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS daily_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT NOT NULL,
      pf_account_id INTEGER,
      key_levels TEXT,
      plan TEXT,
      max_trades INTEGER,
      day_summary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (pf_account_id) REFERENCES pf_accounts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS symbol_settings (
      symbol TEXT PRIMARY KEY,
      point_value REAL NOT NULL,
      commission REAL NOT NULL DEFAULT 0
    )`,
  ], 'write')

  const symCount = (await db.execute('SELECT COUNT(*) as c FROM symbol_settings')).rows[0]
  if (Number(symCount.c) === 0) {
    await db.batch([
      `INSERT INTO symbol_settings (symbol, point_value, commission) VALUES ('NQ',  20,   4.50)`,
      `INSERT INTO symbol_settings (symbol, point_value, commission) VALUES ('MNQ',  2,   2.50)`,
      `INSERT INTO symbol_settings (symbol, point_value, commission) VALUES ('GC',  100,  4.50)`,
      `INSERT INTO symbol_settings (symbol, point_value, commission) VALUES ('MGC',  10,  2.50)`,
    ], 'write')
  }

  const userCount = (await db.execute('SELECT COUNT(*) as c FROM users')).rows[0]
  if (Number(userCount.c) === 0) {
    await db.execute({ sql: `INSERT INTO users (name) VALUES (?)`, args: ['我'] })
  }

  const pfCount = (await db.execute('SELECT COUNT(*) as c FROM pf_accounts')).rows[0]
  if (Number(pfCount.c) === 0) {
    await db.batch([
      `INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES ('Tradeify', 500, 2000, 50000)`,
      `INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES ('TakeProfitTrader', 500, 2000, 50000)`,
      `INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES ('Lucid', 500, 2000, 50000)`,
      `INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES ('TopStep', 500, 2000, 50000)`,
    ], 'write')
  }
}

let initPromise: Promise<void> | null = null

export async function ensureInit(): Promise<Client> {
  if (!initPromise) initPromise = initDb()
  await initPromise
  return getDb()
}
