/**
 * Admin — Model Configuration Page
 * Manage the active LLM provider, model name, temperature, max_tokens, and system prompt.
 * API keys are NOT managed here (they live in server environment variables).
 */

"use client";

import { useEffect, useState } from "react";
import { adminFetch, formatTime } from "@/lib/admin-client";

interface ProviderInfo {
  id: string;
  label: string;
  base_url: string;
  api_key_env: string;
  default_model: string;
  suggestions: string[];
  has_api_key: boolean;
}

interface ActiveConfig {
  provider: string;
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

export default function ModelConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [active, setActive] = useState<ActiveConfig | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Form state
  const [provider, setProvider] = useState("dashscope");
  const [modelName, setModelName] = useState("");
  const [temperature, setTemperature] = useState(0.5);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const r = await adminFetch("/api/admin/model-config");
    if (r?.success) {
      setActive(r.config);
      setProviders(r.providers);
      setProvider(r.config.provider);
      setModelName(r.config.model_name);
      setTemperature(Number(r.config.temperature));
      setMaxTokens(Number(r.config.max_tokens));
      setSystemPrompt(r.config.system_prompt || "");
    } else {
      setMessage({ type: "error", text: r?.error || "加载失败" });
    }
    setLoading(false);
  }

  const currentProvider = providers.find((p) => p.id === provider);

  function onProviderChange(id: string) {
    setProvider(id);
    const p = providers.find((x) => x.id === id);
    if (p && !modelName) setModelName(p.default_model);
  }

  async function onSave() {
    setSaving(true);
    setMessage(null);
    const r = await adminFetch("/api/admin/model-config", {
      method: "PUT",
      body: JSON.stringify({
        provider,
        model_name: modelName,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
      }),
    });
    if (r?.success) {
      setMessage({ type: "success", text: "已保存并生效" });
      await load();
    } else {
      setMessage({ type: "error", text: r?.error || "保存失败" });
    }
    setSaving(false);
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    setMessage(null);
    const r = await adminFetch("/api/admin/model-config/test", {
      method: "POST",
      body: JSON.stringify({
        provider,
        model_name: modelName,
        temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
      }),
    });
    if (r?.success) {
      setTestResult(r.result);
    } else {
      setMessage({ type: "error", text: r?.error || "测试失败" });
    }
    setTesting(false);
  }

  function onResetDefault() {
    const p = providers.find((x) => x.id === provider);
    if (p) setModelName(p.default_model);
    setTemperature(0.5);
    setMaxTokens(1500);
    setSystemPrompt(
      "你是一个精通《易命之书》52条人生法则的人生导师，名叫\"易命先生\"，语气平和有哲理但不玄乎，像一个阅历丰富的长者。"
    );
  }

  if (loading) return <div className="text-sm text-neutral-500">加载中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">模型配置</h1>
        <p className="text-sm text-neutral-500 mt-1">
          管理 /api/ask 使用的大模型。修改保存后立即生效（30秒内其他实例逐步同步）。API Key 仍通过服务器环境变量管理。
        </p>
      </div>

      {/* Active config card */}
      {active && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="text-xs text-neutral-500 mb-2">当前生效配置</div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-lg font-semibold">
                {providers.find((p) => p.id === active.provider)?.label || active.provider}
                <span className="text-neutral-400 mx-2">·</span>
                <code className="text-base bg-neutral-100 px-2 py-0.5 rounded">{active.model_name}</code>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                temperature={Number(active.temperature).toFixed(2)} · max_tokens={active.max_tokens}
                {active.source === "default" && (
                  <span className="ml-2 text-amber-600">（尚未在后台保存，使用默认值）</span>
                )}
              </div>
              {active.updated_at && (
                <div className="text-xs text-neutral-400 mt-1">
                  上次更新：{formatTime(active.updated_at)} · by {active.updated_by || "unknown"}
                </div>
              )}
            </div>
            <div>
              {active.has_api_key ? (
                <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">
                  ✓ API Key 已配置 ({active.api_key_env})
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-red-50 text-red-700">
                  ✗ 缺少环境变量 {active.api_key_env}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : message.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold">编辑配置</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Provider</label>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} {p.has_api_key ? "" : "(未配置Key)"}
                </option>
              ))}
            </select>
            {currentProvider && (
              <div className="text-xs text-neutral-500 mt-1">
                Endpoint: <code>{currentProvider.base_url}</code>
                <br />
                Env: <code>{currentProvider.api_key_env}</code>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">模型名 (自由填写)</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              list="model-suggestions"
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm font-mono"
              placeholder={currentProvider?.default_model}
            />
            <datalist id="model-suggestions">
              {currentProvider?.suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
            {currentProvider && (
              <div className="text-xs text-neutral-500 mt-1">
                建议：{currentProvider.suggestions.join(" · ")}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Temperature: <span className="font-mono text-neutral-600">{temperature.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-neutral-500 mt-1">
              低=严谨稳定，高=发散有变化（易命之书建议 0.3~0.5）
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Max Tokens</label>
            <input
              type="number"
              min="100"
              max="8000"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1500)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
            <div className="text-xs text-neutral-500 mt-1">单次回答最大字数（约 1 token≈1.5 汉字）</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">System Prompt（人设 / 规则）</label>
          <textarea
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full border border-neutral-300 rounded px-3 py-2 text-sm font-mono"
          />
          <div className="text-xs text-neutral-500 mt-1">
            每次对话最开头发给模型的"总指令"，决定角色/风格/边界。修改后保存即生效。
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-neutral-900 text-white rounded text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存并生效"}
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="px-4 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {testing ? "测试中..." : "测试连接"}
          </button>
          <button
            onClick={onResetDefault}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
          >
            恢复默认
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-3 p-4 rounded text-sm ${
              testResult.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="font-medium mb-2">
              {testResult.ok ? "✓ 测试成功" : "✗ 测试失败"}
              <span className="ml-2 text-xs text-neutral-500">耗时 {testResult.latency_ms} ms</span>
            </div>
            {testResult.error && (
              <div className="text-red-700 font-mono text-xs whitespace-pre-wrap">{testResult.error}</div>
            )}
            {testResult.answer && (
              <div className="text-neutral-700 whitespace-pre-wrap border-t border-green-200 pt-2 mt-2">
                <span className="text-neutral-500 text-xs">模型回答：</span>
                <br />
                {testResult.answer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
