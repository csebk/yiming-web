/**
 * API Route: /api/ask
 * 接收用户问题 → 检索法则 → 调用大模型 → 返回回答
 *
 * 支持多知识库切换：?kb=yiming（默认）
 * 大模型配置从 model_config 表读取（管理后台 → 模型配置 页面维护）
 */

import { NextRequest, NextResponse } from "next/server";
import { searchAllKnowledgeBases, getKnowledgeBase } from "@/lib/knowledge-registry";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { saveHistory } from "@/lib/database";
import { callLLM } from "@/lib/llm-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = body.question?.trim();

    // 提取用户ID（可选：未登录也能问，但历史记录不保存）
    const token = getTokenFromRequest(request);
    let userId: string | null = null;
    if (token) {
      const payload = verifyToken(token);
      if (payload) userId = payload.userId;
    }

    // 支持知识库参数切换
    const url = new URL(request.url);
    const kbParam = url.searchParams.get('kb');
    const knowledgeBaseId = kbParam || 'yiming';

    if (!question) {
      return NextResponse.json(
        { error: "请输入您的问题" },
        { status: 400 }
      );
    }

    // 1. 检索相关法则（支持多知识库）
    const kb = getKnowledgeBase(knowledgeBaseId);
    let rules;

    if (kb) {
      rules = kb.searchRules(question, 5);
    } else {
      rules = searchAllKnowledgeBases(question, 5);
    }

    if (rules.length === 0) {
      return NextResponse.json(
        { error: "未能匹配到相关法则，请换个问法试试", rules: [] },
        { status: 400 }
      );
    }

    // 2. 构建 prompt 并调用大模型
    const rulesText = rules
      .map((r: any) => `【${r.category}】第${r.id}术 · ${r.title}：${r.text}`)
      .join("\n\n");

    const prompt = `根据用户的问题，引用《易命之书》中的法则，给出有深度、有温度的人生建议。

## 可用的法则

${rulesText}

## 回答要求

1. **开场**：先共情，理解用户的处境和感受，一句话概括你的核心观点
2. **引用法则**：明确引用相关的"第X术"，简要解释该法则的含义
3. **具体分析**：结合用户的具体情况，逐条分析这些法则如何适用于他的处境
4. **行动建议**：给出具体的、可操作的建议，不要太抽象
5. **结尾**：用一句温暖有力的话收尾，给用户信心

## 用户问题

${question}`;

    const answer = await callLLM(prompt);

    // 3. 保存历史记录（仅已登录用户）
    if (userId) {
      try {
        await saveHistory(userId, question, answer, rules.map((r: any) => ({
          id: r.id, title: r.title, category: r.category, text: r.text,
        })), knowledgeBaseId);
      } catch (saveErr) {
        console.error("[yiming] 保存历史失败:", saveErr);
      }
    }

    return NextResponse.json({
      answer,
      rules: rules.map((r: any) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        text: r.text,
        knowledgeBase: r.knowledgeBase,
      })),
      question,
      knowledgeBase: knowledgeBaseId,
    });
  } catch (error) {
    console.error("[yiming] 处理请求失败:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
