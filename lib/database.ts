/**
 * Database layer for yiming-web — PostgreSQL edition (Supabase/Neon compatible)
 *
 * All functions are async. Uses `pg` connection pool.
 * Connection string comes from env DATABASE_URL. If missing, falls back to
 * in-memory Map storage (dev only) so build + local dev still work.
 *
 * Tables:
 *   users       (id uuid pk, username, email, password_hash, created_at, updated_at)
 *   ask_history (id uuid pk, user_id fk, question, answer, rules jsonb, knowledge_base, timestamp)
 */

import { randomUUID } from "crypto";
import { Pool } from "pg";

let USE_FALLBACK = !process.env.DATABASE_URL;

const memoryStore = {
  users: new Map<string, any>(),
  history: new Map<string, any>(),
  growth: new Map<string, any>(),
};

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  if (USE_FALLBACK) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on("error", (err) => console.error("[yiming-db pg pool error]", err));
  }
  return pool;
}

async function initSchema(): Promise<void> {
  const p = getPool();
  if (!p) return;
  const client = await p.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        username      TEXT UNIQUE NOT NULL,
        email         TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ask_history (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question       TEXT NOT NULL,
        answer         TEXT NOT NULL,
        rules          TEXT,
        knowledge_base TEXT DEFAULT 'yiming',
        timestamp      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_history_user ON ask_history(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_history_time ON ask_history(timestamp DESC);
      CREATE TABLE IF NOT EXISTS growth_records (
        id             TEXT PRIMARY KEY,
        user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date           DATE NOT NULL,
        mood           SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 5),
        content        TEXT DEFAULT '',
        tags           TEXT DEFAULT '[]',
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
      CREATE INDEX IF NOT EXISTS idx_growth_user_date ON growth_records(user_id, date DESC);
    `);
    // model_config table (name overridable via MODEL_CONFIG_TABLE for dev isolation)
    const modelConfigTable = process.env.MODEL_CONFIG_TABLE || "model_config";
    if (!/^[a-zA-Z0-9_]+$/.test(modelConfigTable)) {
      throw new Error(`Invalid MODEL_CONFIG_TABLE: ${modelConfigTable}`);
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${modelConfigTable} (
        id            INT PRIMARY KEY DEFAULT 1,
        provider      TEXT NOT NULL,
        model_name    TEXT NOT NULL,
        temperature   NUMERIC DEFAULT 0.5,
        max_tokens    INT DEFAULT 1500,
        system_prompt TEXT,
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_by    TEXT,
        CONSTRAINT ${modelConfigTable}_singleton CHECK (id = 1)
      );
    `);
    console.log("[yiming-db] Postgres schema ready");
  } finally {
    client.release();
  }
}

async function ensureReady(): Promise<void> {
  if (USE_FALLBACK) return;
  if (!initPromise) {
    initPromise = initSchema().catch((err) => {
      console.error("[yiming-db] init failed:", err);
      initPromise = null; // allow retry
      throw err;
    });
  }
  return initPromise;
}

if (USE_FALLBACK) {
  console.warn("[yiming-db] DATABASE_URL not set — using in-memory fallback (data will NOT persist)");
}

// ============ Types ============
export interface CreateUserResult {
  id: string;
  username: string;
  email: string | null;
  password_hash: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistoryRecord {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  rules: string | null;
  knowledge_base?: string;
  timestamp: string;
}

// ============ User functions ============

export async function createUser(username: string, email: string | null, passwordHash: string): Promise<CreateUserResult> {
  const id = randomUUID();
  const nowIso = new Date().toISOString();
  if (USE_FALLBACK) {
    const rec = { id, username, email, password_hash: passwordHash, created_at: nowIso, updated_at: nowIso };
    memoryStore.users.set(id, rec);
    return rec;
  }
  await ensureReady();
  const p = getPool()!;
  await p.query(
    "INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)",
    [id, username, email, passwordHash]
  );
  return { id, username, email, password_hash: passwordHash, created_at: nowIso, updated_at: nowIso };
}

export async function getUserByUsername(username: string): Promise<CreateUserResult | undefined> {
  if (USE_FALLBACK) {
    for (const u of memoryStore.users.values()) if (u.username === username) return u;
    return undefined;
  }
  await ensureReady();
  const r = await getPool()!.query("SELECT * FROM users WHERE username = $1", [username]);
  return r.rows[0];
}

export async function getUserByEmail(email: string): Promise<CreateUserResult | undefined> {
  if (USE_FALLBACK) {
    for (const u of memoryStore.users.values()) if (u.email === email) return u;
    return undefined;
  }
  await ensureReady();
  const r = await getPool()!.query("SELECT * FROM users WHERE email = $1", [email]);
  return r.rows[0];
}

export async function getUserById(id: string): Promise<CreateUserResult | undefined> {
  if (USE_FALLBACK) return memoryStore.users.get(id);
  await ensureReady();
  const r = await getPool()!.query("SELECT * FROM users WHERE id = $1", [id]);
  return r.rows[0];
}

// ============ History functions ============

export async function saveHistory(
  userId: string,
  question: string,
  answer: string,
  rules: any[],
  knowledgeBase: string = "yiming"
): Promise<string> {
  const id = randomUUID();
  const rulesJson = JSON.stringify(rules || []);
  if (USE_FALLBACK) {
    memoryStore.history.set(id, {
      id, user_id: userId, question, answer, rules: rulesJson, knowledge_base: knowledgeBase,
      timestamp: new Date().toISOString(),
    });
    return id;
  }
  await ensureReady();
  await getPool()!.query(
    "INSERT INTO ask_history (id, user_id, question, answer, rules, knowledge_base) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, userId, question, answer, rulesJson, knowledgeBase]
  );
  return id;
}

export async function getHistory(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  if (USE_FALLBACK) {
    const all = Array.from(memoryStore.history.values()).filter((h: any) => h.user_id === userId);
    all.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return { records: all.slice(offset, offset + limit), total: all.length, page, limit };
  }
  await ensureReady();
  const p = getPool()!;
  const total = (await p.query("SELECT COUNT(*)::int AS c FROM ask_history WHERE user_id = $1", [userId])).rows[0].c;
  const records = (await p.query(
    "SELECT id, user_id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3",
    [userId, limit, offset]
  )).rows;
  return { records, total, page, limit };
}

export async function getHistoryItem(historyId: string, userId: string): Promise<HistoryRecord | undefined> {
  if (USE_FALLBACK) {
    const item: any = memoryStore.history.get(historyId);
    if (!item || item.user_id !== userId) return undefined;
    return item;
  }
  await ensureReady();
  const r = await getPool()!.query(
    "SELECT id, user_id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE id = $1 AND user_id = $2",
    [historyId, userId]
  );
  return r.rows[0];
}

export async function deleteHistoryItem(historyId: string, userId: string): Promise<boolean> {
  if (USE_FALLBACK) {
    const item: any = memoryStore.history.get(historyId);
    if (item && item.user_id === userId) { memoryStore.history.delete(historyId); return true; }
    return false;
  }
  await ensureReady();
  const r = await getPool()!.query("DELETE FROM ask_history WHERE id = $1 AND user_id = $2", [historyId, userId]);
  return (r.rowCount ?? 0) > 0;
}

export async function clearUserHistory(userId: string): Promise<void> {
  if (USE_FALLBACK) {
    for (const [k, v] of memoryStore.history.entries()) if ((v as any).user_id === userId) memoryStore.history.delete(k);
    return;
  }
  await ensureReady();
  await getPool()!.query("DELETE FROM ask_history WHERE user_id = $1", [userId]);
}

// ============ Admin analytics ============

export async function adminGetStats() {
  if (USE_FALLBACK) {
    const users = Array.from(memoryStore.users.values());
    const history = Array.from(memoryStore.history.values()) as any[];
    const now = Date.now();
    const dayAgo = now - 24 * 3600 * 1000;
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    return {
      user_count: users.length,
      history_count: history.length,
      users_last_24h: users.filter(u => new Date(u.created_at).getTime() > dayAgo).length,
      history_last_24h: history.filter(h => new Date(h.timestamp).getTime() > dayAgo).length,
      history_last_7d: history.filter(h => new Date(h.timestamp).getTime() > weekAgo).length,
    };
  }
  await ensureReady();
  const p = getPool()!;
  const [u, h, u24, h24, h7] = await Promise.all([
    p.query("SELECT COUNT(*)::int AS c FROM users"),
    p.query("SELECT COUNT(*)::int AS c FROM ask_history"),
    p.query("SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '1 day'"),
    p.query("SELECT COUNT(*)::int AS c FROM ask_history WHERE timestamp > NOW() - INTERVAL '1 day'"),
    p.query("SELECT COUNT(*)::int AS c FROM ask_history WHERE timestamp > NOW() - INTERVAL '7 day'"),
  ]);
  return {
    user_count: u.rows[0].c,
    history_count: h.rows[0].c,
    users_last_24h: u24.rows[0].c,
    history_last_24h: h24.rows[0].c,
    history_last_7d: h7.rows[0].c,
  };
}

export async function adminGetDailyTrend(days: number = 30) {
  if (USE_FALLBACK) {
    const now = Date.now();
    const cutoff = now - days * 24 * 3600 * 1000;
    const history = Array.from(memoryStore.history.values()) as any[];
    const byDate: Record<string, number> = {};
    history.forEach(h => {
      const ts = new Date(h.timestamp).getTime();
      if (ts >= cutoff) {
        const dateStr = new Date(ts).toISOString().slice(0, 10);
        byDate[dateStr] = (byDate[dateStr] || 0) + 1;
      }
    });
    return Object.entries(byDate).sort().map(([date, count]) => ({ date, count }));
  }
  await ensureReady();
  const r = await getPool()!.query(
    `SELECT to_char(timestamp, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
     FROM ask_history
     WHERE timestamp > NOW() - ($1 || ' day')::INTERVAL
     GROUP BY date ORDER BY date ASC`,
    [String(days)]
  );
  return r.rows;
}

export async function adminGetTopRules(limit: number = 10) {
  if (USE_FALLBACK) {
    const counts: Record<string, number> = {};
    for (const h of Array.from(memoryStore.history.values()) as any[]) {
      try {
        const rules = typeof h.rules === "string" ? JSON.parse(h.rules) : h.rules;
        if (Array.isArray(rules)) {
          for (const r of rules) {
            const key = r?.title || r?.name || r?.id || String(r);
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      } catch {}
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([rule, count]) => ({ rule, count }));
  }
  await ensureReady();
  const rows = (await getPool()!.query("SELECT rules FROM ask_history WHERE rules IS NOT NULL AND rules != ''")).rows as { rules: string }[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    try {
      const rules = JSON.parse(row.rules);
      if (Array.isArray(rules)) {
        for (const r of rules) {
          const key = r?.title || r?.name || r?.id || String(r);
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    } catch {}
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([rule, count]) => ({ rule, count }));
}

export async function adminListUsers(page: number = 1, limit: number = 20, search: string = "") {
  const offset = (page - 1) * limit;
  if (USE_FALLBACK) {
    let users = Array.from(memoryStore.users.values());
    if (search) {
      const s = search.toLowerCase();
      users = users.filter((u: any) =>
        (u.username || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s)
      );
    }
    users.sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
    const total = users.length;
    const page_users = users.slice(offset, offset + limit).map((u: any) => {
      const history_count = (Array.from(memoryStore.history.values()) as any[]).filter(h => h.user_id === u.id).length;
      return { id: u.id, username: u.username, email: u.email, created_at: u.created_at, history_count };
    });
    return { users: page_users, total, page, limit };
  }
  await ensureReady();
  const p = getPool()!;
  const where = search ? "WHERE username ILIKE $1 OR email ILIKE $1" : "";
  const params: any[] = search ? [`%${search}%`] : [];
  const total = (await p.query(`SELECT COUNT(*)::int AS c FROM users ${where}`, params)).rows[0].c;
  const limitParamIdx = params.length + 1;
  const offsetParamIdx = params.length + 2;
  const users = (await p.query(
    `SELECT u.id, u.username, u.email, u.created_at,
       (SELECT COUNT(*)::int FROM ask_history WHERE user_id = u.id) AS history_count
     FROM users u ${where}
     ORDER BY u.created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
    [...params, limit, offset]
  )).rows;
  return { users, total, page, limit };
}

export async function adminGetUserDetail(userId: string) {
  if (USE_FALLBACK) {
    const u: any = memoryStore.users.get(userId);
    if (!u) return null;
    const history = (Array.from(memoryStore.history.values()) as any[])
      .filter(h => h.user_id === userId)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return { user: { id: u.id, username: u.username, email: u.email, created_at: u.created_at }, history };
  }
  await ensureReady();
  const p = getPool()!;
  const userR = await p.query("SELECT id, username, email, created_at FROM users WHERE id = $1", [userId]);
  if (userR.rows.length === 0) return null;
  const history = (await p.query(
    "SELECT id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 200",
    [userId]
  )).rows;
  return { user: userR.rows[0], history };
}

export async function adminListHistory(page: number = 1, limit: number = 20, userId: string = "", q: string = "") {
  const offset = (page - 1) * limit;
  if (USE_FALLBACK) {
    let history = Array.from(memoryStore.history.values()) as any[];
    if (userId) history = history.filter(h => h.user_id === userId);
    if (q) {
      const s = q.toLowerCase();
      history = history.filter(h => (h.question || "").toLowerCase().includes(s) || (h.answer || "").toLowerCase().includes(s));
    }
    history.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    const total = history.length;
    const page_history = history.slice(offset, offset + limit).map(h => {
      const u: any = memoryStore.users.get(h.user_id);
      return { ...h, username: u?.username || "unknown" };
    });
    return { history: page_history, total, page, limit };
  }
  await ensureReady();
  const p = getPool()!;
  const conds: string[] = [];
  const params: any[] = [];
  if (userId) { params.push(userId); conds.push(`h.user_id = $${params.length}`); }
  if (q) { params.push(`%${q}%`); conds.push(`(h.question ILIKE $${params.length} OR h.answer ILIKE $${params.length})`); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const total = (await p.query(`SELECT COUNT(*)::int AS c FROM ask_history h ${where}`, params)).rows[0].c;
  const limIdx = params.length + 1;
  const offIdx = params.length + 2;
  const history = (await p.query(
    `SELECT h.id, h.user_id, h.question, h.answer, h.rules, h.timestamp, u.username
     FROM ask_history h LEFT JOIN users u ON h.user_id = u.id
     ${where} ORDER BY h.timestamp DESC LIMIT $${limIdx} OFFSET $${offIdx}`,
    [...params, limit, offset]
  )).rows;
  return { history, total, page, limit };
}

// ============ Model config (singleton row, id=1) ============

export interface ModelConfigRow {
  provider: string;
  model_name: string;
  temperature: number | null;
  max_tokens: number | null;
  system_prompt: string | null;
  updated_at?: string;
  updated_by?: string;
}

let memoryModelConfig: ModelConfigRow | null = null;

function modelConfigTableName(): string {
  const t = process.env.MODEL_CONFIG_TABLE || "model_config";
  if (!/^[a-zA-Z0-9_]+$/.test(t)) throw new Error(`Invalid MODEL_CONFIG_TABLE: ${t}`);
  return t;
}

export async function getModelConfig(): Promise<ModelConfigRow | null> {
  if (USE_FALLBACK) return memoryModelConfig;
  await ensureReady();
  const r = await getPool()!.query(
    `SELECT provider, model_name, temperature, max_tokens, system_prompt, updated_at, updated_by FROM ${modelConfigTableName()} WHERE id = 1`
  );
  return r.rows[0] || null;
}

export async function upsertModelConfig(
  cfg: ModelConfigRow,
  updatedBy: string
): Promise<ModelConfigRow> {
  const row: ModelConfigRow = {
    provider: cfg.provider,
    model_name: cfg.model_name,
    temperature: cfg.temperature,
    max_tokens: cfg.max_tokens,
    system_prompt: cfg.system_prompt,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };
  if (USE_FALLBACK) {
    memoryModelConfig = row;
    return row;
  }
  await ensureReady();
  const table = modelConfigTableName();
  await getPool()!.query(
    `INSERT INTO ${table} (id, provider, model_name, temperature, max_tokens, system_prompt, updated_at, updated_by)
     VALUES (1, $1, $2, $3, $4, $5, NOW(), $6)
     ON CONFLICT (id) DO UPDATE SET
       provider = EXCLUDED.provider,
       model_name = EXCLUDED.model_name,
       temperature = EXCLUDED.temperature,
       max_tokens = EXCLUDED.max_tokens,
       system_prompt = EXCLUDED.system_prompt,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [
      row.provider,
      row.model_name,
      row.temperature,
      row.max_tokens,
      row.system_prompt,
      updatedBy,
    ]
  );
  return row;
}

// ============ Growth record functions ============

export interface GrowthRecord {
  id: string;
  user_id: string;
  date: string;          // YYYY-MM-DD
  mood: number;          // 1-5
  content: string;
  tags: string[];
  created_at: string;
}

export async function createGrowthRecord(
  userId: string,
  mood: number,
  content: string,
  tags: string[]
): Promise<GrowthRecord> {
  const id = randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const tagsJson = JSON.stringify(tags || []);

  if (USE_FALLBACK) {
    const rec: GrowthRecord = { id, user_id: userId, date: today, mood, content, tags, created_at: nowIso };
    memoryStore.growth = memoryStore.growth || new Map();
    memoryStore.growth.set(id, rec);
    return rec;
  }

  await ensureReady();
  await getPool()!.query(
    `INSERT INTO growth_records (id, user_id, date, mood, content, tags) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, today, mood, content, tagsJson]
  );
  return { id, user_id: userId, date: today, mood, content, tags, created_at: nowIso };
}

export async function getTodayGrowthRecord(userId: string): Promise<GrowthRecord | null> {
  const today = new Date().toISOString().slice(0, 10);
  if (USE_FALLBACK) {
    const store = memoryStore.growth || new Map();
    for (const r of store.values()) {
      if (r.user_id === userId && r.date === today) return r;
    }
    return null;
  }
  await ensureReady();
  const r = await getPool()!.query(
    "SELECT * FROM growth_records WHERE user_id = $1 AND date = $2 LIMIT 1",
    [userId, today]
  );
  return r.rows[0] ? { ...r.rows[0], tags: typeof r.rows[0].tags === 'string' ? JSON.parse(r.rows[0].tags) : r.rows[0].tags } : null;
}

export async function getGrowthRecords(
  userId: string,
  year: number,
  month: number
): Promise<GrowthRecord[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  if (USE_FALLBACK) {
    const store = memoryStore.growth || new Map();
    const results: GrowthRecord[] = [];
    for (const r of store.values()) {
      if (r.user_id === userId && r.date >= start && r.date < endDate) {
        results.push(r);
      }
    }
    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  }

  await ensureReady();
  const r = await getPool()!.query(
    "SELECT * FROM growth_records WHERE user_id = $1 AND date >= $2 AND date < $3 ORDER BY date ASC",
    [userId, start, endDate]
  );
  return r.rows.map((row: any) => ({
    ...row,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
  }));
}

export async function getGrowthStreak(userId: string): Promise<number> {
  const records = await getGrowthRecords(userId, new Date().getFullYear(), new Date().getMonth() + 1);
  // 也需要检查上个月末的连续记录
  const today = new Date().toISOString().slice(0, 10);
  const recDates = new Set(records.map(r => r.date));

  let streak = 0;
  const d = new Date();
  while (true) {
    const dateStr = d.toISOString().slice(0, 10);
    if (recDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (dateStr === today) {
      // today hasn't checked in yet, but streak could be from yesterday
      d.setDate(d.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export async function closeDatabase() {
  if (pool) { await pool.end(); pool = null; }
}
