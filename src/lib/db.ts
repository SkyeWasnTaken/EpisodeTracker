import initSqlJs from "sql.js";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "dev.db");

let db: any = null;
let dbMtime = 0;

export async function getDb() {
  try {
    const fs = await import("node:fs");
    if (fs.existsSync(DB_PATH)) {
      const stat = fs.statSync(DB_PATH);
      const mtime = stat.mtimeMs;
      if (db && mtime <= dbMtime) return db;
      if (db) { db.close(); db = null; }
    }
  } catch {
    // missing or unreadable — fall through to load/create
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
  });
  let buf: Buffer | undefined;
  try {
    const fs = await import("node:fs");
    buf = fs.readFileSync(DB_PATH);
  } catch {
    // first run — new database
  }
  db = buf ? new SQL.Database(new Uint8Array(buf)) : new SQL.Database();
  migrate(db);
  try {
    const fs = await import("node:fs");
    if (fs.existsSync(DB_PATH)) dbMtime = fs.statSync(DB_PATH).mtimeMs;
  } catch { /* ignore */ }
  return db;
}

function migrate(db: any) {
  db.exec(`CREATE TABLE IF NOT EXISTS household (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_account (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    google_id TEXT,
    security_answer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS platform (
    id TEXT PRIMARY KEY,
    household_id TEXT NOT NULL REFERENCES household(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'GB'
  );
  CREATE TABLE IF NOT EXISTS show (
    id TEXT PRIMARY KEY,
    tvmaze_id INTEGER UNIQUE NOT NULL,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    network TEXT,
    type TEXT,
    status TEXT,
    genres TEXT NOT NULL DEFAULT '[]',
    poster_url TEXT
  );
  CREATE TABLE IF NOT EXISTS follow (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    show_id TEXT NOT NULL REFERENCES show(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    priority INTEGER NOT NULL DEFAULT 3,
    catchup_from TEXT,
    UNIQUE(user_id, show_id)
  );
  CREATE TABLE IF NOT EXISTS episode (
    id TEXT PRIMARY KEY,
    show_id TEXT NOT NULL REFERENCES show(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    number INTEGER NOT NULL,
    title TEXT,
    air_date TEXT,
    runtime INTEGER,
    UNIQUE(show_id, season, number)
  );
  CREATE TABLE IF NOT EXISTS preference (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    genres_weighted TEXT NOT NULL DEFAULT '{}',
    max_ep_per_day INTEGER NOT NULL DEFAULT 3,
    preferred_slots TEXT NOT NULL DEFAULT '[]',
    binge_weekend INTEGER NOT NULL DEFAULT 1
  );`);
}

export function exec(db: any, sql: string, params: unknown[] = []): boolean {
  if (params.length === 0) {
    db.exec(sql);
    return true;
  }
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  return true;
}

// Reads. Supports parameter binding (previously silently dropped rows whenever
// params were passed, which is why call sites had fallen back to unsafe string
// interpolation for anything with user input — fixed here instead).
export function query(db: any, sql: string, params: unknown[] = []) {
  if (params.length === 0) {
    return db.exec(sql);
  }

  const stmt = db.prepare(sql);
  try {
    stmt.bind(params as any[]);
    const columns = stmt.getColumnNames();
    const values: any[][] = [];
    while (stmt.step()) {
      values.push(stmt.get());
    }
    if (values.length === 0) return [];
    return [{ columns, values }];
  } finally {
    stmt.free();
  }
}

export function queryOne(db: any, sql: string, params: unknown[] = []) {
  const results = query(db, sql, params);
  return results && results.length > 0 ? results[0] : null;
}

export async function persist() {
  if (!db) return;
  const { writeFile } = await import("node:fs/promises");
  const data = db.export();
  const buf = Buffer.from(data.buffer as ArrayBuffer);
  await writeFile(DB_PATH, buf);
  try {
    const fs = await import("node:fs");
    if (fs.existsSync(DB_PATH)) dbMtime = fs.statSync(DB_PATH).mtimeMs;
  } catch { /* ignore */ }
}

export async function closeDb() {
  if (!db) return;
  await persist();
  db.close();
  db = null;
  dbMtime = 0;
}
