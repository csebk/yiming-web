/**
 * Database layer for yiming-web
 * Uses SQLite via better-sqlite3 for local storage (non-serverless)
 * Gracefully degrades to in-memory fallback on Vercel serverless
 * Tables: users, ask_history
 */

import { randomUUID } from "crypto";

// Detect if running in serverless environment (native modules unavailable)
let USE_FALLBACK = false;
try {
  const Database = require("better-sqlite3");
  if (!Database) {
    USE_FALLBACK = true;
  }
} catch {
  USE_FALLBACK = true;
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

    const DB_DIR = path.join(process.cwd(), ".data");
    const DB_PATH = path.join(DB_DIR, "yiming.db");

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

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
