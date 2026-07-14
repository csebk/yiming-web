/** GET /api/admin/history?page&limit&user_id&q */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminListHistory } from "@/lib/database";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const userId = searchParams.get("user_id") || "";
  const q = searchParams.get("q") || "";

  try {
    const result = await adminListHistory(page, limit, userId, q);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[admin/history]", err);
    return NextResponse.json({ success: false, error: "查询失败" }, { status: 500 });
  }
}
