/**
 * Database layer for yiming-web
 * Uses SQLite via better-sqlite3 for local storage
 * Tables: users, ask_history
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "yiming.db");

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Initialize schema
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

// Preparing statements
const stmts = {
  createUser: db.prepare(`
    INSERT INTO users (id, username, email, password_hash)
    VALUES (?, ?, ?, ?)
  `),
  getUserByUsername: db.prepare(`
    SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?
  `),
  getUserByEmail: db.prepare(`
    SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?
  `),
  getUserById: db.prepare(`
    SELECT id, username, email, created_at FROM users WHERE id = ?
  `),
  insertHistory: db.prepare(`
    INSERT INTO ask_history (id, user_id, question, answer, rules, knowledge_base)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getHistoryByUser: db.prepare(`
    SELECT id, question, answer, rules, knowledge_base, timestamp
    FROM ask_history
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `),
  getHistoryCount: db.prepare(`
    SELECT COUNT(*) as total FROM ask_history WHERE user_id = ?
  `),
  deleteHistoryItem: db.prepare(`
    DELETE FROM ask_history WHERE id = ? AND user_id = ?
  `),
  clearUserHistory: db.prepare(`
    DELETE FROM ask_history WHERE user_id = ?
  `),
  getHistoryById: db.prepare(`
    SELECT id, question, answer, rules, knowledge_base, timestamp
    FROM ask_history WHERE id = ? AND user_id = ?
  `),
};

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
  const id = randomUUID();
  stmts.createUser.run(id, username, email, passwordHash);
  return { id, username, email, created_at: new Date().toISOString() };
}

export function getUserByUsername(username: string) {
  return stmts.getUserByUsername.get(username) as any;
}

export function getUserByEmail(email: string) {
  return stmts.getUserByEmail.get(email) as any;
}

export function getUserById(id: string): CreateUserResult | undefined {
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
  stmts.insertHistory.run(
    id,
    userId,
    question,
    answer,
    JSON.stringify(rules),
    knowledgeBase
  );
  return id;
}

export function getHistory(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const records = stmts.getHistoryByUser.all(userId, limit, offset) as HistoryRecord[];
  const count = stmts.getHistoryCount.get(userId) as { total: number };
  return { records, total: count.total, page, limit, totalPages: Math.ceil(count.total / limit) };
}

export function getHistoryItem(historyId: string, userId: string): HistoryRecord | undefined {
  return stmts.getHistoryById.get(historyId, userId) as HistoryRecord | undefined;
}

export function deleteHistoryItem(historyId: string, userId: string): boolean {
  const result = stmts.deleteHistoryItem.run(historyId, userId);
  return result.changes > 0;
}

export function clearUserHistory(userId: string): void {
  stmts.clearUserHistory.run(userId);
}

export function closeDatabase() {
  db.close();
}
