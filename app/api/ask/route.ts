/**
 * API Route: /api/ask
 * 接收用户问题 → 检索法则 → 调用大模型 → 返回回答
 * 
 * 支持多知识库切换：?kb=yiming（默认）
 */

import { NextRequest, NextResponse } from "next/server";
import { searchAllKnowledgeBases, getKnowledgeBase } from "@/lib/knowledge-registry";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import { saveHistory } from "@/lib/database";

// 模拟大模型响应（无 API Key 时的 fallback）
function mockLLMResponse(): string {
  return `易命先生：

感谢你的信任，愿意与我分享你的困惑。

《易命之书》的智慧在于，它不提供标准答案，而是给你一面镜子，让你看清自己的方向。

建议你静心思考，写下目前最困扰你的三件事，对每件事问自己：三个月后回头看，这还重要吗？

记住，《易命之书》说："灵若根，身若树，运若叶。叶虽凋落，苟灵不死、身不枯，逢其时，终见枝繁叶茂。"

你现在的处境，正是扎根的时候。稳住，你会迎来属于自己的春天。`;
}

async function callDashScope(prompt: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    console.warn("[yiming] DASHSCOPE_API_KEY 未设置，使用模拟响应");
    return mockLLMResponse();
  }

  try {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: "你是一个精通《易命之书》的人生导师。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "抱歉，未能生成回答，请稍后重试。";
  } catch (error) {
    console.error("[yiming] DashScope API 调用失败:", error);
    return "抱歉，服务暂时不可用。请稍后再试。";
  }
}

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
      // 指定知识库
      rules = kb.searchRules(question, 5);
    } else {
      // 跨知识库搜索
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

    const prompt = `你是一个精通《易命之书》52条人生法则的人生导师，名叫"易命先生"。

你的任务是根据用户的问题，引用《易命之书》中的法则，给出有深度、有温度的人生建议。

## 可用的法则

${rulesText}

## 回答要求

1. **开场**：先共情，理解用户的处境和感受，一句话概括你的核心观点
2. **引用法则**：明确引用相关的"第X术"，简要解释该法则的含义
3. **具体分析**：结合用户的具体情况，逐条分析这些法则如何适用于他的处境
4. **行动建议**：给出具体的、可操作的建议，不要太抽象
5. **结尾**：用一句温暖有力的话收尾，给用户信心

## 语气风格

- 平和、有哲理但不玄乎
- 像一个阅历丰富的长者，不是高高在上的说教
- 适当使用古文引用，但要解释清楚
- 字数控制在300-500字

## 用户问题

${question}`;

    const answer = await callDashScope(prompt);

    // 3. 保存历史记录（仅已登录用户）
    if (userId) {
      try {
        await saveHistory(userId, question, answer, rules.map((r: any) => ({
          id: r.id, title: r.title, category: r.category, text: r.text,
        })), knowledgeBaseId);
      } catch (saveErr) {
        console.error("[yiming] 保存历史失败:", saveErr);
        // 不阻塞主流程
      }
    }

    // 4. 返回结果
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
