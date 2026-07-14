/** GET /api/admin/stats — KPI + daily trend + top rules */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminGetStats, adminGetDailyTrend, adminGetTopRules } from "@/lib/database";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await adminGetStats();
    const trend = await adminGetDailyTrend(30);
    const topRules = await adminGetTopRules(10);
    return NextResponse.json({ success: true, stats, trend, top_rules: topRules });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ success: false, error: "统计失败" }, { status: 500 });
  }
}
