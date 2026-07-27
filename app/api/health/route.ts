/**
 * GET /api/health — 线上健康检查端点
 *
 * 用于监控告警 / 部署后验证 / 定时探活。
 * 返回：服务状态、数据库连通性（含延迟）、知识库注册数、LLM key 配置状态、版本信息。
 *
 * 状态码：
 *   200 — 一切正常（db ok）
 *   503 — 数据库不可达（degraded）
 */

import { NextResponse } from "next/server";
import { pingDatabase } from "@/lib/database";
import { getAllKnowledgeBases } from "@/lib/knowledge-registry";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  const db = await pingDatabase();
  const kbs = getAllKnowledgeBases();
  const totalRules = kbs.reduce((sum, kb) => sum + (kb.getAllRules().length), 0);

  const healthy = db.ok;

  const body = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    database: {
      mode: db.mode,
      ok: db.ok,
      latencyMs: db.latencyMs,
      ...(db.error ? { error: db.error } : {}),
    },
    knowledgeBases: {
      count: kbs.length,
      totalRules,
      ids: kbs.map((kb) => kb.id),
    },
    llm: {
      configured: Boolean(process.env.DASHSCOPE_API_KEY),
    },
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
