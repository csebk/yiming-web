/** GET /api/admin/users?page&limit&search */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminListUsers } from "@/lib/database";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const search = searchParams.get("search") || "";

  try {
    const result = await adminListUsers(page, limit, search);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ success: false, error: "查询失败" }, { status: 500 });
  }
}
