/** GET /api/admin/users/[id] — detail + history */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminGetUserDetail } from "@/lib/database";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    const detail = await adminGetUserDetail(id);
    if (!detail) return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });
    return NextResponse.json({ success: true, ...detail });
  } catch (err) {
    console.error("[admin/users/:id]", err);
    return NextResponse.json({ success: false, error: "查询失败" }, { status: 500 });
  }
}
