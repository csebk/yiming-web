/**
 * 深度分析报告生成逻辑 (Phase 2)
 *
 * 核心流程：
 * 1. 搜索全部 3 个知识库（yiming / life-wisdom / workplace）
 * 2. 按 category 分组相关法则
 * 3. 调用 LLM，要求以严格 JSON 返回 5 维度分析
 * 4. 解析 JSON（带 try/catch 兜底）
 * 5. 通过 createReport 保存报告
 */

import { searchAllKnowledgeBases } from "@/lib/knowledge-registry";
import { callLLM } from "@/lib/llm-client";
import { createReport, AnalysisReport } from "@/lib/database";
import type { Rule } from "@/lib/knowledge-base";

// ============ Types ============

export interface AnalysisDimension {
  category: string;
  rules: string[];
  analysis: string;
}

export interface AnalysisActions {
  immediate: string[];
  medium: string[];
  long_term: string[];
}

export interface DeepAnalysisPayload {
  conclusion: string;
  dimensions: AnalysisDimension[];
  conflicts: string;
  actions: AnalysisActions;
  quote: string;
  /** 命中的法则（原始检索结果，供前端展示引用） */
  matched_rules?: Array<{ title: string; category: string; knowledgeBase?: string }>;
}

export interface GenerateDeepAnalysisResult {
  report: AnalysisReport;
  dimensions: AnalysisDimension[];
}

// ============ Prompt ============

const JSON_SYSTEM_PROMPT = `你是《易命之书》的资深命理与人生策略分析师。你的任务是基于用户的问题和检索到的相关法则，生成一份结构化的深度分析报告。

严格要求：
1. 只返回一个合法的 JSON 对象，不要输出任何 markdown 代码块标记（不要 \`\`\`json），不要任何解释性文字。
2. JSON 结构必须严格如下：
{
  "conclusion": "一句话总结（20-40字）",
  "dimensions": [
    { "category": "修身", "rules": ["相关法则标题1", "相关法则标题2"], "analysis": "针对该维度的深入分析（100-200字）" }
  ],
  "conflicts": "关键矛盾分析：指出用户处境中的核心张力与取舍（100-200字）",
  "actions": {
    "immediate": ["本周内可执行的具体行动1", "行动2"],
    "medium": ["1-3个月内的行动1", "行动2"],
    "long_term": ["3-12个月的行动1", "行动2"]
  },
  "quote": "一段个性化的人生寄语（引用或化用《易命之书》风格，40-80字）"
}
3. dimensions 数组应包含 3-5 个维度，维度的 category 尽量对应检索到的法则类别（如 修身、财富、人际、心态、运势 等）。
4. 每个维度的 rules 数组应引用检索到的相关法则标题。
5. 语言使用简体中文，风格温润、有洞见、可落地。`;

function buildUserPrompt(
  question: string,
  grouped: Record<string, Rule[]>
): string {
  const sections: string[] = [];
  for (const [category, rules] of Object.entries(grouped)) {
    const ruleLines = rules
      .map((r) => `  - 【${r.title}】${r.text}`)
      .join("\n");
    sections.push(`类别「${category}」相关法则：\n${ruleLines}`);
  }
  const knowledgeBlock = sections.length
    ? sections.join("\n\n")
    : "（未检索到强相关法则，请基于《易命之书》的通用智慧进行分析）";

  return `用户的问题是：
"""
${question}
"""

以下是从三大知识库检索到的相关法则（已按类别分组）：

${knowledgeBlock}

请基于以上法则和用户问题，生成一份 5 维度的深度分析报告，并严格按照系统提示要求的 JSON 格式返回。`;
}

// ============ JSON parsing helpers ============

/** 从可能包含 markdown / 前后噪声的字符串中提取 JSON 对象 */
function extractJson(raw: string): any | null {
  if (!raw) return null;
  let text = raw.trim();

  // 去除 markdown 代码块围栏
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // 直接尝试
  try {
    return JSON.parse(text);
  } catch {
    // fallthrough
  }

  // 提取第一个 { 到最后一个 } 之间的内容
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fallthrough
    }
  }
  return null;
}

function buildFallbackPayload(
  question: string,
  grouped: Record<string, Rule[]>,
  rawText: string
): DeepAnalysisPayload {
  const dimensions: AnalysisDimension[] = Object.entries(grouped).map(
    ([category, rules]) => ({
      category,
      rules: rules.map((r) => r.title),
      analysis:
        "系统未能生成结构化分析，以下为该类别相关法则的原始参考：" +
        rules.map((r) => r.text).join(" "),
    })
  );

  return {
    conclusion: "本次分析未能完整生成结构化结论，已为你保留可参考的原始洞见。",
    dimensions:
      dimensions.length > 0
        ? dimensions
        : [
            {
              category: "综合",
              rules: [],
              analysis: rawText?.slice(0, 400) || "暂无内容。",
            },
          ],
    conflicts: "未能生成结构化的矛盾分析，建议结合上述法则自行权衡取舍。",
    actions: {
      immediate: ["静心梳理当下最困扰你的一件事，写下它。"],
      medium: ["选择一个可持续的小习惯，坚持 21 天。"],
      long_term: ["确立一个 1 年后想成为的自己，并倒推关键节点。"],
    },
    quote:
      "《易命之书》说：灵若根，身若树，运若叶。稳住根本，你终会迎来属于自己的春天。",
  };
}

// ============ Core ============

function normalizePayload(
  parsed: any,
  question: string,
  grouped: Record<string, Rule[]>
): DeepAnalysisPayload {
  const safeArray = (v: any): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

  const dimensions: AnalysisDimension[] = Array.isArray(parsed?.dimensions)
    ? parsed.dimensions.map((d: any) => ({
        category: typeof d?.category === "string" ? d.category : "综合",
        rules: safeArray(d?.rules),
        analysis: typeof d?.analysis === "string" ? d.analysis : "",
      }))
    : [];

  const actions: AnalysisActions = {
    immediate: safeArray(parsed?.actions?.immediate),
    medium: safeArray(parsed?.actions?.medium),
    long_term: safeArray(parsed?.actions?.long_term),
  };

  return {
    conclusion:
      typeof parsed?.conclusion === "string" ? parsed.conclusion : "",
    dimensions:
      dimensions.length > 0
        ? dimensions
        : buildFallbackPayload(question, grouped, "").dimensions,
    conflicts: typeof parsed?.conflicts === "string" ? parsed.conflicts : "",
    actions,
    quote: typeof parsed?.quote === "string" ? parsed.quote : "",
  };
}

export async function generateDeepAnalysis(
  question: string,
  userId: string,
  orderId: string
): Promise<GenerateDeepAnalysisResult> {
  // 1. 搜索全部知识库
  const rules: Rule[] = searchAllKnowledgeBases(question, 10);

  // 2. 按 category 分组
  const grouped: Record<string, Rule[]> = {};
  for (const rule of rules) {
    const cat = rule.category || "综合";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(rule);
  }

  const matchedRules = rules.map((r) => ({
    title: r.title,
    category: r.category,
    knowledgeBase: r.knowledgeBase,
  }));

  // 3. 调用 LLM
  const userPrompt = buildUserPrompt(question, grouped);
  let payload: DeepAnalysisPayload;

  try {
    const raw = await callLLM(userPrompt, {
      systemPromptOverride: JSON_SYSTEM_PROMPT,
    });
    // 4. 解析 JSON（带兜底）
    const parsed = extractJson(raw);
    if (parsed && typeof parsed === "object") {
      payload = normalizePayload(parsed, question, grouped);
    } else {
      console.warn(
        "[deep-analysis] LLM did not return valid JSON, using fallback"
      );
      payload = buildFallbackPayload(question, grouped, raw);
    }
  } catch (err) {
    console.error("[deep-analysis] generation failed, using fallback:", err);
    payload = buildFallbackPayload(question, grouped, "");
  }

  payload.matched_rules = matchedRules;

  // 5. 保存报告
  const report = await createReport(
    userId,
    orderId,
    "deep_analysis",
    question,
    payload
  );

  return { report, dimensions: payload.dimensions };
}
