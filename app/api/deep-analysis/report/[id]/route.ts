/**
 * GET /api/deep-analysis/report/[id] — 获取深度分析报告
 * 校验：登录态 + 报告存在 + 归属当前用户
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getReport } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "登录已过期，请重新登录" }, { status: 401 });
    }

    const { id } = await params;
    const report = await getReport(id);
    if (!report) {
      return NextResponse.json({ success: false, error: "报告不存在" }, { status: 404 });
    }

    if (report.user_id !== payload.userId) {
      return NextResponse.json({ success: false, error: "无权查看此报告" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        order_id: report.order_id,
        type: report.type,
        question: report.question,
        data: report.report_json,
        created_at: report.created_at,
      },
    });
  } catch (err: any) {
    console.error("[deep-analysis/report] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}