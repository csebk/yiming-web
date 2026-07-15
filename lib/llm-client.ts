/**
 * Unified LLM client for 易命之书.
 *
 * Reads the active model config from Supabase (30s in-memory cache),
 * calls the corresponding provider via OpenAI-compatible /chat/completions,
 * and gracefully falls back to a mock response when no API key is set.
 *
 * Public API:
 *   getActiveModelConfig() — resolved config (DB row merged with defaults)
 *   invalidateModelConfigCache() — call after PUT /api/admin/model-config
 *   callLLM(userPrompt, override?) — POST to provider; returns generated text
 *   testLLM(config) — one-shot test call with a fixed prompt; returns {ok, latencyMs, answer}
 */

import { getModelConfig, ModelConfigRow } from "@/lib/database";
import {
  DEFAULT_MODEL_CONFIG,
  DEFAULT_SYSTEM_PROMPT,
  PROVIDERS,
  ProviderId,
  getProvider,
} from "@/lib/providers";

export interface ResolvedModelConfig {
  provider: ProviderId;
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  base_url: string;
  api_key_env: string;
  has_api_key: boolean;
  source: "db" | "default";
  updated_at?: string;
  updated_by?: string;
}

let cache: { value: ResolvedModelConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30_000;

export function invalidateModelConfigCache() {
  cache = null;
}

function resolveConfig(row: ModelConfigRow | null): ResolvedModelConfig {
  const merged = {
    provider: (row?.provider || DEFAULT_MODEL_CONFIG.provider) as ProviderId,
    model_name: row?.model_name || DEFAULT_MODEL_CONFIG.model_name,
    temperature:
      row?.temperature !== null && row?.temperature !== undefined
        ? Number(row.temperature)
        : DEFAULT_MODEL_CONFIG.temperature,
    max_tokens:
      row?.max_tokens !== null && row?.max_tokens !== undefined
        ? Number(row.max_tokens)
        : DEFAULT_MODEL_CONFIG.max_tokens,
    system_prompt: row?.system_prompt || DEFAULT_MODEL_CONFIG.system_prompt,
  };
  const preset = getProvider(merged.provider) || PROVIDERS.dashscope;
  const apiKey = process.env[preset.apiKeyEnv];
  return {
    ...merged,
    base_url: preset.baseUrl,
    api_key_env: preset.apiKeyEnv,
    has_api_key: !!apiKey,
    source: row ? "db" : "default",
    updated_at: row?.updated_at,
    updated_by: row?.updated_by,
  };
}

export async function getActiveModelConfig(): Promise<ResolvedModelConfig> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  let row: ModelConfigRow | null = null;
  try {
    row = await getModelConfig();
  } catch (err) {
    console.error("[llm-client] getModelConfig failed, using defaults:", err);
  }
  const resolved = resolveConfig(row);
  cache = { value: resolved, expiresAt: now + CACHE_TTL_MS };
  return resolved;
}

function mockLLMResponse(): string {
  return `易命先生：

感谢你的信任。当前大模型服务未配置 API Key，返回的是模拟回答。

请在管理后台 → 模型配置 中检查 Provider 是否正确，并在服务器环境变量中配置对应的 API_KEY。

《易命之书》说："灵若根，身若树，运若叶。"稳住，你会迎来属于自己的春天。`;
}

export interface CallLLMOptions {
  /** Optional override — used by the admin "test connection" endpoint. */
  override?: Partial<ResolvedModelConfig>;
  /** Explicit system prompt (overrides config.system_prompt if set). */
  systemPromptOverride?: string;
}

export async function callLLM(
  userPrompt: string,
  opts: CallLLMOptions = {}
): Promise<string> {
  const base = await getActiveModelConfig();
  const cfg: ResolvedModelConfig = { ...base, ...opts.override };
  const apiKey = process.env[cfg.api_key_env];

  if (!apiKey) {
    console.warn(
      `[llm-client] ${cfg.api_key_env} not set — using mock response (provider=${cfg.provider})`
    );
    return mockLLMResponse();
  }

  const systemPrompt = opts.systemPromptOverride ?? cfg.system_prompt ?? DEFAULT_SYSTEM_PROMPT;

  try {
    const response = await fetch(cfg.base_url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model_name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: cfg.temperature,
        max_tokens: cfg.max_tokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "抱歉，未能生成回答，请稍后重试。";
  } catch (err) {
    console.error(
      `[llm-client] provider=${cfg.provider} model=${cfg.model_name} call failed:`,
      err
    );
    return "抱歉，服务暂时不可用。请稍后再试。";
  }
}

export interface TestLLMResult {
  ok: boolean;
  latency_ms: number;
  provider: ProviderId;
  model_name: string;
  answer?: string;
  error?: string;
  has_api_key: boolean;
}

export async function testLLM(cfg: {
  provider: ProviderId;
  model_name: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
}): Promise<TestLLMResult> {
  const preset = getProvider(cfg.provider);
  if (!preset) {
    return {
      ok: false,
      latency_ms: 0,
      provider: cfg.provider,
      model_name: cfg.model_name,
      has_api_key: false,
      error: `未知 provider: ${cfg.provider}`,
    };
  }
  const apiKey = process.env[preset.apiKeyEnv];
  if (!apiKey) {
    return {
      ok: false,
      latency_ms: 0,
      provider: cfg.provider,
      model_name: cfg.model_name,
      has_api_key: false,
      error: `环境变量 ${preset.apiKeyEnv} 未设置`,
    };
  }

  const t0 = Date.now();
  try {
    const response = await fetch(preset.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model_name,
        messages: [
          { role: "system", content: cfg.system_prompt || DEFAULT_SYSTEM_PROMPT },
          { role: "user", content: "用一句话说明《易命之书》的核心理念。" },
        ],
        temperature: cfg.temperature,
        max_tokens: Math.min(cfg.max_tokens, 200),
      }),
    });
    const latency = Date.now() - t0;
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        ok: false,
        latency_ms: latency,
        provider: cfg.provider,
        model_name: cfg.model_name,
        has_api_key: true,
        error: `HTTP ${response.status}: ${errText.slice(0, 300)}`,
      };
    }
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "";
    return {
      ok: true,
      latency_ms: latency,
      provider: cfg.provider,
      model_name: cfg.model_name,
      has_api_key: true,
      answer,
    };
  } catch (err: any) {
    return {
      ok: false,
      latency_ms: Date.now() - t0,
      provider: cfg.provider,
      model_name: cfg.model_name,
      has_api_key: true,
      error: err?.message || String(err),
    };
  }
}
