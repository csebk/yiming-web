/**
 * 人生智慧知识库 — 示例扩展知识库
 * 
 * 这是一个演示性质的第二知识库，包含来自不同文化传统的智慧法则。
 * 新增知识库只需实现 KnowledgeBase 接口并注册到 knowledge-registry.ts。
 */

import type { Rule, KnowledgeBase } from '../knowledge-base';
import { universalSearch } from '../knowledge-base';

const RULES: Rule[] = [
  {
    id: 1, title: "知行合一",
    text: "知而不行，只是未知。真正的知识必须体现在行动中，否则只是空谈。",
    category: "实践",
    keywords: ["行动", "实践", "知行", "做事", "落实", "执行", "理论", "空谈"]
  },
  {
    id: 2, title: "反求诸己",
    text: "行有不得，反求诸己。遇到问题先从自己身上找原因，而不是责怪外界。",
    category: "自省",
    keywords: ["自责", "反思", "内因", "归因", "自身", "责任", "自我反省"]
  },
  {
    id: 3, title: "中庸之道",
    text: "过犹不及，凡事有度。极端往往带来极端的结果，平衡才是长久之道。",
    category: "平衡",
    keywords: ["适度", "平衡", "极端", "分寸", "节制", "走极端", "过犹不及"]
  },
  {
    id: 4, title: "厚积薄发",
    text: "长期积累的力量远超想象。不要在短期内看不到成果时就放弃，坚持就是胜利。",
    category: "坚持",
    keywords: ["积累", "沉淀", "长期", "坚持", "爆发", "厚积薄发", "耐心"]
  },
  {
    id: 5, title: "顺势而为",
    text: "个人的努力固然重要，但更要学会观察大势，顺势而动，事半功倍。",
    category: "策略",
    keywords: ["趋势", "大势", "机会", "风口", "方向", "选择", "时机"]
  },
  {
    id: 6, title: "知足常乐",
    text: "贪多嚼不烂，懂得知足的人反而能获得更多快乐。满足不是放弃，而是理性取舍。",
    category: "心态",
    keywords: ["知足", "满足", "贪心", "欲望", "快乐", "幸福", "放下"]
  },
  {
    id: 7, title: "和而不同",
    text: "真正的和谐不是千篇一律，而是在差异中找到共鸣。包容不同的声音，才能成就更大的格局。",
    category: "人际",
    keywords: ["包容", "差异", "多元", "和谐", "不同", "共识", "尊重"]
  },
  {
    id: 8, title: "居安思危",
    text: "在顺境中保持警惕，在安乐中不忘危机。只有居安思危，才能在变化来临时从容应对。",
    category: "警觉",
    keywords: ["危机", "警惕", "预防", "风险", "忧患", "准备", "未雨绸缪"]
  },
  {
    id: 9, title: "大智若愚",
    text: "真正有智慧的人往往不显山露水，他们懂得藏拙守静，不争一时之长短。",
    category: "智慧",
    keywords: ["低调", "藏拙", "聪明", "智慧", "谦逊", "内敛", "装傻"]
  },
  {
    id: 10, title: "塞翁失马",
    text: "失去未必是坏事，得到也未必是好事。看待得失要有长远的眼光，世事无常，福祸相依。",
    category: "豁达",
    keywords: ["得失", "祸福", "转换", "乐观", "豁达", "不幸中的万幸", "转机"]
  },
];

export const lifeWisdomKnowledgeBase: KnowledgeBase = {
  id: 'life-wisdom',
  name: '人生智慧',
  description: '源自东方传统智慧的10条人生法则',
  getAllRules: () => RULES,
  searchRules: (query: string, topK: number = 5) => universalSearch(RULES, query, topK),
  getRuleById: (id: number | string) => RULES.find((r) => r.id === id),
  getRulesByCategory: (category: string) => RULES.filter((r) => r.category === category),
};
