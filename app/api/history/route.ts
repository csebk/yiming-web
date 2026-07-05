/**
 * GET /api/history
 * 获取当前用户的历史记录
 * Query params: page (default 1), limit (default 20)
 */

import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/database";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "登录已过期" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    const result = getHistory(payload.userId, page, Math.min(limit, 100));

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[yiming] 获取历史失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
