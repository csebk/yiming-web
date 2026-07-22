/**
 * POST /api/deep-analysis/pay — Mock 支付（MVP阶段，直接标记订单为已支付）
 * Body: { order_id: string }
 * Response: { success: true, order: OrderRecord }
 *
 * 后续可替换为真实支付网关（微信支付/支付宝）
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { getOrder, markOrderPaid } from "@/lib/database";
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

    if (order.status !== "pending") {
      return NextResponse.json({
        success: false,
        error: order.status === "paid" ? "该订单已支付" : "订单状态异常",
        status: order.status,
      }, { status: 409 });
    }

    // Mock 支付：直接标记为已支付
    const mockTransactionId = `mock_${Date.now()}_${order_id.slice(0, 8)}`;
    const updated = await markOrderPaid(order_id, "mock", mockTransactionId);

    // 支付成功后自动触发深度分析报告生成
    let report: any = null;
    try {
      const result = await generateDeepAnalysis(
        order.question || "",
        payload.userId,
        order_id
      );
      report = {
        id: result.report.id,
        order_id: result.report.order_id,
        type: result.report.type,
        question: result.report.question,
        data: result.report.report_json,
        created_at: result.report.created_at,
      };
    } catch (genErr) {
      console.error("[deep-analysis/pay] report generation failed:", genErr);
      // 报告生成失败不影响支付结果，前端可稍后调用 /generate 重试
    }

    return NextResponse.json({
      success: true,
      message: "支付成功（Mock）",
      order: {
        id: updated?.id,
        type: updated?.type,
        price: updated?.price,
        status: updated?.status,
        question: updated?.question,
        pay_method: updated?.pay_method,
        transaction_id: updated?.transaction_id,
        paid_at: updated?.paid_at,
      },
      report,
    });
  } catch (err: any) {
    console.error("[deep-analysis/pay] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}