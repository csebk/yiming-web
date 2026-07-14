/**
 * Admin authentication helpers
 * - Verifies admin JWT token from Authorization: Bearer header (or cookie).
 * - Admin credentials sourced from env ADMIN_USERNAME + ADMIN_PASSWORD_HASH (bcrypt).
 * - Admin tokens carry `role: 'admin'` in the JWT payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export interface AdminPayload {
  username: string;
  role: "admin";
}

/**
 * Return the admin payload if the request carries a valid admin token,
 * else return a NextResponse with 401.
 */
export function requireAdmin(request: NextRequest): AdminPayload | NextResponse {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }
  const payload = verifyToken(token) as any;
  if (!payload || payload.role !== "admin") {
    return NextResponse.json({ success: false, error: "无管理员权限" }, { status: 403 });
  }
  return { username: payload.username, role: "admin" };
}
