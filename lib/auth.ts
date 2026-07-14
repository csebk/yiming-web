/**
 * JWT authentication middleware and utilities
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "yiming-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  username: string;
}

/** Hash a password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a password against a hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a JWT token */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Verify and decode a JWT token */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract auth token from either Cookie (Web) or Authorization Bearer Header (miniprogram/mobile).
 * Cookie takes precedence when both present.
 */
export function getTokenFromRequest(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
  headers: { get: (name: string) => string | null };
}): string | undefined {
  const cookieToken = request.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

/** Password strength validation */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: "密码长度至少6位" };
  }
  if (password.length > 50) {
    return { valid: false, error: "密码长度不能超过50位" };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: "密码需包含字母和数字" };
  }
  return { valid: true };
}

/** Username validation */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 2 || username.length > 20) {
    return { valid: false, error: "用户名长度需在2-20个字符之间" };
  }
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: "用户名只能包含中文、英文、数字和下划线" };
  }
  return { valid: true };
}

/** Email validation */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true }; // email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "邮箱格式不正确" };
  }
  return { valid: true };
}
