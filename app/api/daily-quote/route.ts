/**
 * GET /api/daily-quote — 每日一句 API
 * 
 * 从所有知识库（易命之书52条 + 人生智慧20条 + 职场智慧10条）中
 * 按日期轮换选取一条法则作为每日一句推送。
 * 
 * 每日一句由当天日期决定（确定性），同一日同一句。
 * 支持 ?kb= 参数指定知识库，默认全库轮换。
 * 支持 ?date=2026-07-16 指定日期预览。
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllKnowledgeBases, getKnowledgeBase } from "@/lib/knowledge-registry";

interface QuoteResult {
  quote: string;
  rule: {
    id: number | string;
    title: string;
    text: string;
    category: string;
  };
  knowledgeBase: {
    id: string;
    name: string;
  };
  date: string;
  index: number;
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const kbParam = url.searchParams.get("kb");
    const dateParam = url.searchParams.get("date");

    // 确定日期
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);

    // 获取知识库
    let bases;
    if (kbParam) {
      const kb = getKnowledgeBase(kbParam);
      if (!kb) {
        return NextResponse.json(
          { error: `未知知识库: ${kbParam}`, date: dateStr },
          { status: 400 }
        );
      }
      bases = [kb];
    } else {
      bases = getAllKnowledgeBases();
    }

    // 收集所有法则
    interface RuleItem {
      id: number | string;
      title: string;
      text: string;
      category: string;
      kbId: string;
      kbName: string;
    }
    const allRules: RuleItem[] = [];
    for (const kb of bases) {
      const rules = kb.getAllRules();
      for (const rule of rules) {
        allRules.push({
          id: rule.id,
          title: rule.title,
          text: rule.text,
          category: rule.category,
          kbId: kb.id,
          kbName: kb.name,
        });
      }
    }

    if (allRules.length === 0) {
      return NextResponse.json(
        { error: "知识库为空", date: dateStr },
        { status: 500 }
      );
    }

    // 用日期计算确定性索引
    const dayOfYear = getDayOfYear(targetDate);
    const index = dayOfYear % allRules.length;

    const selected = allRules[index];

    // 构建每日一句文案（短小精悍，适合推送）
    const quote = `「${selected.text}」——${selected.kbName}·第${selected.id}术·${selected.title}`;

    const result: QuoteResult = {
      quote,
      rule: {
        id: selected.id,
        title: selected.title,
        text: selected.text,
        category: selected.category,
      },
      knowledgeBase: {
        id: selected.kbId,
        name: selected.kbName,
      },
      date: dateStr,
      index,
      total: allRules.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[daily-quote] 获取每日一句失败:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

/** 计算一年中的第几天（1-366） */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}