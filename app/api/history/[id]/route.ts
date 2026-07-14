/**
 * DELETE /api/history/[id]
 * 删除单条历史记录
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteHistoryItem } from "@/lib/database";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "登录已过期" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const deleted = await deleteHistoryItem(id, payload.userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "记录不存在或无权删除" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[yiming] 删除历史失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
