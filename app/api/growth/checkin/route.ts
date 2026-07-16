/**
 * POST /api/growth/checkin — 每日打卡
 * Body: { mood: 1-5, content?: string, tags?: string[] }
 * Response: { success: true, record: GrowthRecord }
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createGrowthRecord, getTodayGrowthRecord } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "登录已过期，请重新登录" }, { status: 401 });
    }

    const { userId } = payload;
    if (!userId) {
      return NextResponse.json({ success: false, error: "登录已过期，请重新登录" }, { status: 401 });
    }

    const body = await request.json();
    const { mood, content, tags } = body;

    if (!mood || typeof mood !== "number" || mood < 1 || mood > 5) {
      return NextResponse.json({ success: false, error: "心情评分（mood）需为1-5的整数" }, { status: 400 });
    }

    // 检查今日是否已打卡
    const existing = await getTodayGrowthRecord(userId);
    if (existing) {
      return NextResponse.json({
        success: false,
        error: "今天已经打过卡了，明天再来吧",
        record: existing,
      }, { status: 409 });
    }

    const tagsArray = Array.isArray(tags) ? tags : [];
    const record = await createGrowthRecord(userId, mood, content || "", tagsArray);

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("[growth/checkin] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}

/**
 * GET /api/growth/checkin — 查询今日打卡状态
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const { userId } = require("@/lib/auth").verifyToken(token) || {};
    if (!userId) {
      return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
    }

    const record = await getTodayGrowthRecord(userId);
    return NextResponse.json({ success: true, checkedIn: !!record, record });
  } catch (err: any) {
    console.error("[growth/checkin GET] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}