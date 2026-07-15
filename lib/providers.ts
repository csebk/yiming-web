/**
 * LLM Provider presets — OpenAI-compatible chat completion endpoints.
 *
 * Each provider maps to:
 *   - baseUrl     : chat completion endpoint (POST here directly)
 *   - apiKeyEnv   : env var that holds the API key
 *   - defaultModel: sensible default model name for a first-time setup
 *   - suggestions : dropdown hints (user can still type any string in the admin UI)
 *
 * To add a new provider: append one entry here and set the corresponding env var
 * in Cloud Run + Vercel. No other code changes are required.
 */

export type ProviderId = "dashscope" | "volcengine" | "deepseek" | "openai";

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKeyEnv: string;
  defaultModel: string;
  suggestions: string[];
}

export const PROVIDERS: Record<ProviderId, ProviderPreset> = {
  dashscope: {
    id: "dashscope",
    label: "阿里云百炼 (DashScope)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiKeyEnv: "DASHSCOPE_API_KEY",
    defaultModel: "qwen-plus",
    suggestions: ["qwen-plus", "qwen-max", "qwen-turbo", "qwen-long"],
  },
  volcengine: {
    id: "volcengine",
    label: "火山方舟 (豆包)",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    apiKeyEnv: "ARK_API_KEY",
    defaultModel: "doubao-1-5-pro-32k-250115",
    suggestions: [
      "doubao-1-5-pro-32k-250115",
      "doubao-1-5-lite-32k-250115",
      "doubao-seed-1-6-250615",
    ],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-chat",
    suggestions: ["deepseek-chat", "deepseek-reasoner"],
  },
  openai: {
    id: "openai",
    label: "OpenAI 兼容 (自定义)",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
    suggestions: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  },
};

export const PROVIDER_LIST: ProviderPreset[] = Object.values(PROVIDERS);

export function getProvider(id: string): ProviderPreset | undefined {
  return PROVIDERS[id as ProviderId];
}

/** Default system prompt for 易命之书. Falls back to this if DB row has none. */
export const DEFAULT_SYSTEM_PROMPT = "你是一个精通《易命之书》52条人生法则的人生导师，名叫\"易命先生\"，语气平和有哲理但不玄乎，像一个阅历丰富的长者。";

export const DEFAULT_MODEL_CONFIG = {
  provider: "dashscope" as ProviderId,
  model_name: "qwen-plus",
  temperature: 0.5,
  max_tokens: 1500,
  system_prompt: DEFAULT_SYSTEM_PROMPT,
};
