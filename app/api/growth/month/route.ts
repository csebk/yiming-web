/**
 * GET /api/growth/month?year=2026&month=7 — 获取某月打卡记录
 * Response: { success: true, records: GrowthRecord[], streak: number }
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getGrowthRecords, getGrowthStreak } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    if (year < 2020 || year > 2030 || month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: "参数无效" }, { status: 400 });
    }

    const [records, streak] = await Promise.all([
      getGrowthRecords(payload.userId, year, month),
      getGrowthStreak(payload.userId),
    ]);

    return NextResponse.json({ success: true, records, streak });
  } catch (err: any) {
    console.error("[growth/month] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}