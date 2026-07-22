/**
 * POST /api/deep-analysis/generate — 生成深度分析报告
 * Body: { order_id: string }
 * Response: { success: true, report: {...} }
 *
 * 校验：登录态 + 订单存在 + status === "paid" + 归属当前用户。
 * 若报告已存在（order.report_id），直接返回已有报告，避免重复生成。
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getOrder, getReport } from "@/lib/database";
import { generateDeepAnalysis } from "@/lib/deep-analysis";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ success: false, error: "登录已过期，请重新登录" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: "请提供订单ID（order_id）" }, { status: 400 });
    }

    const order = await getOrder(order_id);
    if (!order) {
      return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
    }

    if (order.user_id !== payload.userId) {
      return NextResponse.json({ success: false, error: "无权操作此订单" }, { status: 403 });
    }

    if (order.status !== "paid") {
      return NextResponse.json({
        success: false,
        error: "订单尚未支付，无法生成报告",
        status: order.status,
      }, { status: 409 });
    }

    // 报告已存在，直接返回，避免重复生成
    if (order.report_id) {
      const existing = await getReport(order.report_id);
      if (existing) {
        return NextResponse.json({
          success: true,
          cached: true,
          report: {
            id: existing.id,
            order_id: existing.order_id,
            type: existing.type,
            question: existing.question,
            data: existing.report_json,
            created_at: existing.created_at,
          },
        });
      }
    }

    const { report } = await generateDeepAnalysis(
      order.question || "",
      payload.userId,
      order_id
    );

    return NextResponse.json({
      success: true,
      cached: false,
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
    console.error("[deep-analysis/generate] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
