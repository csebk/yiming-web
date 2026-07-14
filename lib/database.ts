/**
 * Database layer for yiming-web
 * Uses SQLite via better-sqlite3 for local storage (non-serverless)
 * Gracefully degrades to in-memory fallback on Vercel serverless
 * Tables: users, ask_history
 */

import { randomUUID } from "crypto";

// Detect if running in serverless environment (native modules unavailable)
// Also detect read-only filesystem (Vercel serverless)
let USE_FALLBACK = false;
try {
  const Database = require("better-sqlite3");
  if (!Database) {
    USE_FALLBACK = true;
  }
  // Test if we can actually write to the filesystem
  const path = require("path");
  const fs = require("fs");
  const testDir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  const testFile = path.join(testDir, "test.tmp");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
} catch (err: unknown) {
  USE_FALLBACK = true;
  console.log("[yiming-db] Filesystem test failed, using fallback:", String(err));
}

// In-memory fallback store for serverless environments
const memoryStore = {
  users: new Map<string, any>(),
  history: new Map<string, any>(),
};

// Prepared statements (populated in non-fallback mode)
let stmts: Record<string, any> = {};

if (USE_FALLBACK) {
  console.log("[yiming-db] Running in serverless fallback mode (SQLite unavailable)");
} else {
  // Full SQLite mode — initialize eagerly (sync) rather than async
  try {
    const Database = require("better-sqlite3");
    const path = require("path");
    const fs = require("fs");

    const DB_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const DB_PATH = path.join(DB_DIR, "yiming.db");
    console.log("[yiming-db] Using SQLite at:", DB_PATH);

    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ask_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        rules TEXT,
        knowledge_base TEXT DEFAULT 'yiming',
        timestamp TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_history_user ON ask_history(user_id, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_history_user_id ON ask_history(user_id);
    `);

    // Prepare all statements
    stmts = {
      createUser: db.prepare("INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)"),
      getUserByUsername: db.prepare("SELECT * FROM users WHERE username = ?"),
      getUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
      getUserById: db.prepare("SELECT * FROM users WHERE id = ?"),
      insertHistory: db.prepare("INSERT INTO ask_history (id, user_id, question, answer, rules, knowledge_base) VALUES (?, ?, ?, ?, ?, ?)"),
      getHistoryByUser: db.prepare("SELECT id, user_id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?"),
      getHistoryCount: db.prepare("SELECT COUNT(*) as total FROM ask_history WHERE user_id = ?"),
      getHistoryById: db.prepare("SELECT id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE id = ? AND user_id = ?"),
      deleteHistoryItem: db.prepare("DELETE FROM ask_history WHERE id = ? AND user_id = ?"),
      clearUserHistory: db.prepare("DELETE FROM ask_history WHERE user_id = ?"),
    };

    (global as any).__yimingDb = { db, ready: true };
  } catch (err) {
    USE_FALLBACK = true;
    console.log("[yiming-db] SQLite init failed, using fallback:", err);
  }
}

export interface CreateUserResult {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
}

export interface HistoryRecord {
  id: string;
  question: string;
  answer: string;
  rules: string | null;
  knowledge_base: string;
  timestamp: string;
}

export function createUser(username: string, email: string | null, passwordHash: string): CreateUserResult {
  if (USE_FALLBACK) {
    const id = randomUUID();
    memoryStore.users.set(id, { id, username, email, password_hash: passwordHash, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return { id, username, email: email ?? '', created_at: new Date().toISOString() };
  }
  const id = randomUUID();
  stmts.createUser.run(id, username, email, passwordHash);
  return { id, username, email: email ?? '', created_at: new Date().toISOString() };
}

export function getUserByUsername(username: string) {
  if (USE_FALLBACK) {
    for (const u of memoryStore.users.values()) {
      if (u.username === username) return u;
    }
    return null;
  }
  return stmts.getUserByUsername.get(username) as any;
}

export function getUserByEmail(email: string) {
  if (USE_FALLBACK) {
    for (const u of memoryStore.users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }
  return stmts.getUserByEmail.get(email) as any;
}

export function getUserById(id: string): CreateUserResult | undefined {
  if (USE_FALLBACK) {
    return memoryStore.users.get(id) as CreateUserResult | undefined;
  }
  return stmts.getUserById.get(id) as CreateUserResult | undefined;
}

export function saveHistory(
  userId: string,
  question: string,
  answer: string,
  rules: any[],
  knowledgeBase: string = "yiming"
): string {
  const id = randomUUID();
  if (USE_FALLBACK) {
    memoryStore.history.set(id, {
      id, user_id: userId, question, answer,
      rules: JSON.stringify(rules), knowledge_base: knowledgeBase,
      timestamp: new Date().toISOString()
    });
    return id;
  }
  stmts.insertHistory.run(id, userId, question, answer, JSON.stringify(rules), knowledgeBase);
  return id;
}

export function getHistory(userId: string, page: number = 1, limit: number = 20) {
  if (USE_FALLBACK) {
    const all = Array.from(memoryStore.history.values()).filter((h: any) => h.user_id === userId);
    const offset = (page - 1) * limit;
    const records = all.slice(offset, offset + limit);
    return { records: records as HistoryRecord[], total: all.length, page, limit, totalPages: Math.ceil(all.length / limit) };
  }
  const offset = (page - 1) * limit;
  const records = stmts.getHistoryByUser.all(userId, limit, offset) as HistoryRecord[];
  const count = stmts.getHistoryCount.get(userId) as { total: number };
  return { records, total: count.total, page, limit, totalPages: Math.ceil(count.total / limit) };
}

export function getHistoryItem(historyId: string, userId: string): HistoryRecord | undefined {
  if (USE_FALLBACK) {
    const item = memoryStore.history.get(historyId);
    return item && item.user_id === userId ? (item as HistoryRecord) : undefined;
  }
  return stmts.getHistoryById.get(historyId, userId) as HistoryRecord | undefined;
}

export function deleteHistoryItem(historyId: string, userId: string): boolean {
  if (USE_FALLBACK) {
    const item = memoryStore.history.get(historyId);
    if (item && item.user_id === userId) {
      memoryStore.history.delete(historyId);
      return true;
    }
    return false;
  }
  const result = stmts.deleteHistoryItem.run(historyId, userId);
  return result.changes > 0;
}

export function clearUserHistory(userId: string): void {
  if (USE_FALLBACK) {
    for (const [key, val] of memoryStore.history.entries()) {
      if ((val as any).user_id === userId) memoryStore.history.delete(key);
    }
    return;
  }
  stmts.clearUserHistory.run(userId);
}

export function closeDatabase() {
  // No-op in fallback mode
  if (!USE_FALLBACK && (global as any).__yimingDb?.db) {
    (global as any).__yimingDb.db.close();
  }
}

// ============ Admin analytics functions ============

export function adminGetStats() {
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
  const g = (global as any).__yimingDb;
  const db = g.db;
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const historyCount = db.prepare("SELECT COUNT(*) as c FROM ask_history").get().c;
  const users24h = db.prepare("SELECT COUNT(*) as c FROM users WHERE created_at > datetime('now', '-1 day')").get().c;
  const history24h = db.prepare("SELECT COUNT(*) as c FROM ask_history WHERE timestamp > datetime('now', '-1 day')").get().c;
  const history7d = db.prepare("SELECT COUNT(*) as c FROM ask_history WHERE timestamp > datetime('now', '-7 day')").get().c;
  return { user_count: userCount, history_count: historyCount, users_last_24h: users24h, history_last_24h: history24h, history_last_7d: history7d };
}

export function adminGetDailyTrend(days: number = 30) {
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
  const g = (global as any).__yimingDb;
  const db = g.db;
  const rows = db.prepare(
    `SELECT substr(timestamp, 1, 10) as date, COUNT(*) as count
     FROM ask_history
     WHERE timestamp > datetime('now', ?)
     GROUP BY date ORDER BY date ASC`
  ).all(`-${days} day`) as { date: string; count: number }[];
  return rows;
}

export function adminGetTopRules(limit: number = 10) {
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
  const g = (global as any).__yimingDb;
  const db = g.db;
  const rows = db.prepare("SELECT rules FROM ask_history WHERE rules IS NOT NULL AND rules != ''").all() as { rules: string }[];
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

export function adminListUsers(page: number = 1, limit: number = 20, search: string = "") {
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
  const g = (global as any).__yimingDb;
  const db = g.db;
  const where = search ? "WHERE username LIKE ? OR email LIKE ?" : "";
  const params: any[] = search ? [`%${search}%`, `%${search}%`] : [];
  const total = (db.prepare(`SELECT COUNT(*) as c FROM users ${where}`).get(...params) as { c: number }).c;
  const users = db.prepare(
    `SELECT u.id, u.username, u.email, u.created_at,
       (SELECT COUNT(*) FROM ask_history WHERE user_id = u.id) as history_count
     FROM users u ${where}
     ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);
  return { users, total, page, limit };
}

export function adminGetUserDetail(userId: string) {
  if (USE_FALLBACK) {
    const u: any = memoryStore.users.get(userId);
    if (!u) return null;
    const history = (Array.from(memoryStore.history.values()) as any[])
      .filter(h => h.user_id === userId)
      .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return { user: { id: u.id, username: u.username, email: u.email, created_at: u.created_at }, history };
  }
  const g = (global as any).__yimingDb;
  const db = g.db;
  const user = db.prepare("SELECT id, username, email, created_at FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  const history = db.prepare(
    "SELECT id, question, answer, rules, knowledge_base, timestamp FROM ask_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 200"
  ).all(userId);
  return { user, history };
}

export function adminListHistory(page: number = 1, limit: number = 20, userId: string = "", q: string = "") {
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
  const g = (global as any).__yimingDb;
  const db = g.db;
  const conds: string[] = [];
  const params: any[] = [];
  if (userId) { conds.push("h.user_id = ?"); params.push(userId); }
  if (q) { conds.push("(h.question LIKE ? OR h.answer LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const total = (db.prepare(`SELECT COUNT(*) as c FROM ask_history h ${where}`).get(...params) as { c: number }).c;
  const history = db.prepare(
    `SELECT h.id, h.user_id, h.question, h.answer, h.rules, h.timestamp, u.username
     FROM ask_history h LEFT JOIN users u ON h.user_id = u.id
     ${where} ORDER BY h.timestamp DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);
  return { history, total, page, limit };
}
