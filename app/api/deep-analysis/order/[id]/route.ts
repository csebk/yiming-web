/**
 * GET /api/deep-analysis/order/[id] — 查询订单状态
 * Response: { success: true, order: OrderRecord, report?: AnalysisReport }
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getOrder, getReportByOrder } from "@/lib/database";

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
      return NextResponse.json({ success: false, error: "登录已过期" }, { status: 401 });
    }

    const { id } = await params;
    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "订单不存在" }, { status: 404 });
    }

    // 只能查看自己的订单
    if (order.user_id !== payload.userId) {
      return NextResponse.json({ success: false, error: "无权查看此订单" }, { status: 403 });
    }

    let report = undefined;
    if (order.status === "paid" && order.report_id) {
      report = await getReportByOrder(order.id);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        price: order.price,
        status: order.status,
        question: order.question,
        pay_method: order.pay_method,
        transaction_id: order.transaction_id,
        report_id: order.report_id,
        created_at: order.created_at,
        paid_at: order.paid_at,
      },
      report,
    });
  } catch (err: any) {
    console.error("[deep-analysis/order/[id]] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}