/**
 * POST /api/admin/login
 * Body: { username, password }
 * Verifies against env ADMIN_USERNAME + ADMIN_PASSWORD_HASH (bcrypt).
 * Returns { success, token, user: { username, role } } on success.
 * Also sets HttpOnly cookie for browser sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body || {};
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "用户名和密码不能为空" }, { status: 400 });
    }

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminHash = process.env.ADMIN_PASSWORD_HASH || "";

    if (!adminHash) {
      return NextResponse.json({ success: false, error: "管理员未配置" }, { status: 500 });
    }
    if (username !== adminUsername) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, adminHash);
    if (!ok) {
      return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
    }

    // Reuse createToken but with role='admin' — cast to any to bypass strict JWTPayload type
    const token = createToken({ userId: `admin:${username}`, username, role: "admin" } as any);

    const response = NextResponse.json({
      success: true,
      token,
      user: { username, role: "admin" },
    });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
