/**
 * 知识库抽象层 — 支持多知识库扩展
 * 
 * 设计目标：
 * - 核心检索逻辑与具体知识库解耦
 * - 新增知识库只需实现 KnowledgeBase 接口
 * - API 路由支持通过 query param 切换知识库
 */

export interface Rule {
  id: number | string;
  title: string;
  text: string;
  category: string;
  keywords: string[];
  /** 知识库标识，用于区分不同知识库 */
  knowledgeBase?: string;
}

export interface KnowledgeBase {
  /** 知识库唯一标识 */
  id: string;
  /** 知识库名称 */
  name: string;
  /** 知识库描述 */
  description: string;
  /** 获取所有法则 */
  getAllRules(): Rule[];
  /** 搜索相关法则（核心接口） */
  searchRules(query: string, topK: number): Rule[];
  /** 按ID获取单条法则 */
  getRuleById(id: number | string): Rule | undefined;
  /** 按类别获取法则 */
  getRulesByCategory(category: string): Rule[];
}

/** 通用搜索算法：关键词匹配 + n-gram + 语义映射 */
export function universalSearch(rules: Rule[], query: string, topK: number = 5): Rule[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  // 提取查询的分词（2-3字n-gram）
  const queryBigrams = extractNgrams(lowerQuery, 2);
  const queryTrigrams = extractNgrams(lowerQuery, 3);

  const scored = rules.map((rule) => {
    let score = 0;

    // --- 精确子串匹配 ---
    if (rule.title.includes(lowerQuery)) score += 15;
    if (rule.text.includes(lowerQuery)) score += 8;

    // --- 分词匹配（n-gram 重叠） ---
    const titleBigrams = extractNgrams(rule.title, 2);
    const titleTrigrams = extractNgrams(rule.title, 3);
    for (const qg of queryBigrams) {
      if (titleBigrams.some(tg => tg.includes(qg) || qg.includes(tg))) score += 5;
    }
    for (const qt of queryTrigrams) {
      if (titleTrigrams.some(tt => tt.includes(qt) || qt.includes(tt))) score += 3;
    }

    // 文本分词匹配
    const textBigrams = extractNgrams(rule.text, 2);
    const textTrigrams = extractNgrams(rule.text, 3);
    for (const qg of queryBigrams) {
      if (textBigrams.some(tb => tb.includes(qg) || qg.includes(tb))) score += 2;
    }

    // --- 关键词匹配 ---
    for (const kw of rule.keywords) {
      if (kw.includes(lowerQuery) || lowerQuery.includes(kw)) {
        score += 5;
      } else {
        for (const qg of queryBigrams) {
          if (kw.includes(qg) || qg.includes(kw)) {
            score += 2;
            break;
          }
        }
      }
    }

    return { rule, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.rule);
}

function extractNgrams(text: string, n: number): string[] {
  const results: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    results.push(text.slice(i, i + n));
  }
  return results;
}
