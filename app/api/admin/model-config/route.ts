/**
 * GET  /api/admin/model-config — return active config + provider presets
 * PUT  /api/admin/model-config — upsert config (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { upsertModelConfig } from "@/lib/database";
import {
  getActiveModelConfig,
  invalidateModelConfigCache,
} from "@/lib/llm-client";
import { PROVIDER_LIST, PROVIDERS, ProviderId } from "@/lib/providers";

function providerPublicInfo() {
  return PROVIDER_LIST.map((p) => ({
    id: p.id,
    label: p.label,
    base_url: p.baseUrl,
    api_key_env: p.apiKeyEnv,
    default_model: p.defaultModel,
    suggestions: p.suggestions,
    has_api_key: !!process.env[p.apiKeyEnv],
  }));
}

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const active = await getActiveModelConfig();
    return NextResponse.json({
      success: true,
      config: active,
      providers: providerPublicInfo(),
    });
  } catch (err) {
    console.error("[admin/model-config GET]", err);
    return NextResponse.json(
      { success: false, error: "读取模型配置失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const model_name = String(body.model_name || "").trim();
    if (!model_name) {
      return NextResponse.json(
        { success: false, error: "模型名不能为空" },
        { status: 400 }
      );
    }
    const temperature = Number(body.temperature);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
      return NextResponse.json(
        { success: false, error: "temperature 必须在 0 ~ 2 之间" },
        { status: 400 }
      );
    }
    const max_tokens = parseInt(String(body.max_tokens), 10);
    if (Number.isNaN(max_tokens) || max_tokens < 100 || max_tokens > 8000) {
      return NextResponse.json(
        { success: false, error: "max_tokens 必须在 100 ~ 8000 之间" },
        { status: 400 }
      );
    }
    const system_prompt = body.system_prompt ? String(body.system_prompt) : null;

    const saved = await upsertModelConfig(
      {
        provider: provider as ProviderId,
        model_name,
        temperature,
        max_tokens,
        system_prompt,
      },
      auth.username
    );
    invalidateModelConfigCache();
    return NextResponse.json({ success: true, config: saved });
  } catch (err) {
    console.error("[admin/model-config PUT]", err);
    return NextResponse.json(
      { success: false, error: "保存模型配置失败" },
      { status: 500 }
    );
  }
}
