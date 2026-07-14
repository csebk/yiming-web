/**
 * 知识库注册表 — 统一管理所有知识库
 * 
 * 新增知识库时只需：
 * 1. 创建一个新的 KnowledgeBase 实现（如 lib/knowledge-bases/yiming.ts）
 * 2. 在这里注册
 */

import type { KnowledgeBase } from './knowledge-base';
import { yimingKnowledgeBase } from './knowledge-bases/yiming';
import { lifeWisdomKnowledgeBase } from './knowledge-bases/life-wisdom';
import { workplaceKnowledgeBase } from './knowledge-bases/workplace';

// 知识库注册表
const registeredBases: Map<string, KnowledgeBase> = new Map();

/** 注册知识库 */
export function registerKnowledgeBase(kb: KnowledgeBase): void {
  registeredBases.set(kb.id, kb);
  console.log(`[KnowledgeBase] Registered: ${kb.name} (${kb.id})`);
}

/** 获取已注册的所有知识库 */
export function getAllKnowledgeBases(): KnowledgeBase[] {
  return Array.from(registeredBases.values());
}

/** 按ID获取知识库 */
export function getKnowledgeBase(id: string): KnowledgeBase | undefined {
  return registeredBases.get(id);
}

/** 搜索指定知识库的相关法则 */
export function searchInKnowledgeBase(kbId: string, query: string, topK: number = 5) {
  const kb = registeredBases.get(kbId);
  if (!kb) {
    console.warn(`[KnowledgeBase] Unknown knowledge base: ${kbId}`);
    return [];
  }
  return kb.searchRules(query, topK);
}

/** 搜索所有知识库的相关法则 */
export function searchAllKnowledgeBases(query: string, topK: number = 5) {
  const allRules: Array<{ rule: ReturnType<KnowledgeBase['searchRules']>[0]; score: number }> = [];
  
  for (const kb of registeredBases.values()) {
    const rules = kb.searchRules(query, topK);
    for (const rule of rules) {
      allRules.push({ rule, score: 1 }); // 简化评分，实际可按知识库权重调整
    }
  }
  
  return allRules
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(r => r.rule);
}

// 初始化：注册所有知识库
for (const kb of [yimingKnowledgeBase, lifeWisdomKnowledgeBase, workplaceKnowledgeBase]) {
  registerKnowledgeBase(kb);
}
