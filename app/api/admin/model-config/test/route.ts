/**
 * POST /api/admin/model-config/test
 * Body: { provider, model_name, temperature, max_tokens, system_prompt }
 * One-shot test call; does NOT persist.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { testLLM } from "@/lib/llm-client";
import { PROVIDERS, ProviderId } from "@/lib/providers";

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const provider = String(body.provider || "");
    if (!(provider in PROVIDERS)) {
      return NextResponse.json(
        { success: false, error: `未知 provider: ${provider}` },
        { status: 400 }
      );
    }
    const result = await testLLM({
      provider: provider as ProviderId,
      model_name: String(body.model_name || "").trim(),
      temperature: Number(body.temperature ?? 0.5),
      max_tokens: parseInt(String(body.max_tokens ?? 500), 10),
      system_prompt: String(body.system_prompt || ""),
    });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[admin/model-config/test]", err);
    return NextResponse.json(
      { success: false, error: "测试调用失败" },
      { status: 500 }
    );
  }
}
