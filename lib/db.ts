import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'trading.db')

let db: Database.Database

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pf_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      daily_loss_limit REAL DEFAULT 0,
      max_drawdown REAL DEFAULT 0,
      account_size REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trades (
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
    );

    CREATE TABLE IF NOT EXISTS daily_plans (
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
    );
  `)

  // 新資料庫才 seed，舊資料庫用 ALTER TABLE 補欄位
  try { db.exec('ALTER TABLE trades ADD COLUMN user_id INTEGER') } catch {}
  try { db.exec('ALTER TABLE daily_plans ADD COLUMN user_id INTEGER') } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN pin TEXT') } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS symbol_settings (
      symbol TEXT PRIMARY KEY,
      point_value REAL NOT NULL,
      commission REAL NOT NULL DEFAULT 0
    );
  `)

  const symCount = db.prepare('SELECT COUNT(*) as c FROM symbol_settings').get() as { c: number }
  if (symCount.c === 0) {
    const ins = db.prepare('INSERT INTO symbol_settings (symbol, point_value, commission) VALUES (?, ?, ?)')
    ins.run('NQ',  20,   4.50)
    ins.run('MNQ',  2,   2.50)
    ins.run('GC',  100,  4.50)
    ins.run('MGC',  10,  2.50)
  }

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c === 0) {
    db.prepare('INSERT INTO users (name) VALUES (?)').run('我')
  }

  const pfCount = db.prepare('SELECT COUNT(*) as c FROM pf_accounts').get() as { c: number }
  if (pfCount.c === 0) {
    const insert = db.prepare('INSERT INTO pf_accounts (name, daily_loss_limit, max_drawdown, account_size) VALUES (?, ?, ?, ?)')
    insert.run('Tradeify', 500, 2000, 50000)
    insert.run('TakeProfitTrader', 500, 2000, 50000)
    insert.run('Lucid', 500, 2000, 50000)
    insert.run('TopStep', 500, 2000, 50000)
  }
}

export default getDb
