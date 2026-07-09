/**
 * POST /api/auth/register
 * 用户注册
 */

import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByUsername, getUserByEmail } from "@/lib/database";
import { hashPassword, createToken, validatePasswordStrength, validateUsername, validateEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, error: usernameValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email || "");
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "用户名已被占用" },
        { status: 409 }
      );
    }

    // Check if email exists
    if (email) {
      const existingEmail = getUserByEmail(email);
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: "邮箱已被注册" },
          { status: 409 }
        );
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = createUser(username, email || null, passwordHash);

    // Create token
    const token = createToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
      token,
    });

    // Set token in HttpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[yiming] 注册失败:", error);
    return NextResponse.json(
      { success: false, error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
