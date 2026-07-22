/**
 * POST /api/deep-analysis/order — 创建深度分析订单
 * Body: { type: 'deep_analysis'|'monthly_report'|'yearly_plan', question: string }
 * Response: { success: true, order: OrderRecord }
 */
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createOrder } from "@/lib/database";

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
    const { type, question } = body;

    const validTypes = ["deep_analysis", "monthly_report", "yearly_plan"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: "请选择有效的报告类型（deep_analysis / monthly_report / yearly_plan）",
      }, { status: 400 });
    }

    if (!question || typeof question !== "string" || question.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: "请输入您的问题（至少2个字符）",
      }, { status: 400 });
    }

    const order = await createOrder(payload.userId, type, question.trim());

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        price: order.price,
        status: order.status,
        question: order.question,
        created_at: order.created_at,
      },
    });
  } catch (err: any) {
    console.error("[deep-analysis/order] error:", err);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}