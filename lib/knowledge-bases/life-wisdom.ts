/**
 * 人生智慧知识库 — 扩展版（20条法则）
 * 
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
  {
    id: 11, title: "格物致知",
    text: "穷究事物的道理，以此获得真正的智慧。深入观察万事万物，本质自会显现。",
    category: "求知",
    keywords: ["探究", "学问", "求知", "观察", "本质", "道理", "研究"]
  },
  {
    id: 12, title: "三省吾身",
    text: "每日多次反省自己：为人谋而不忠乎？与朋友交而不信乎？传不习乎？反省是进步的起点。",
    category: "自省",
    keywords: ["反省", "吾身", "每天", "改进", "自省", "日志", "复盘"]
  },
  {
    id: 13, title: "当仁不让",
    text: "面对应该做的事，即使老师在前也不谦让。该出手时就出手，担当是成长的第一步。",
    category: "担当",
    keywords: ["担当", "责任", "主动", "挺身而出", "正义", "勇气", "作为"]
  },
  {
    id: 14, title: "见贤思齐",
    text: "看到贤德的人，要想着向他看齐。看到不贤的人，要反省自己有没有类似的毛病。",
    category: "学习",
    keywords: ["榜样", "学习", "效仿", "进步", "见贤", "优秀", "向上"]
  },
  {
    id: 15, title: "不迁怒",
    text: "不把自己的怒气转移到别人身上。不犯同样的错误。情绪管理是成熟的第一步。",
    category: "情绪",
    keywords: ["迁怒", "情绪", "脾气", "发泄", "克制", "冷静", "生气"]
  },
  {
    id: 16, title: "欲速不达",
    text: "一味追求速度反而达不到目标。做事要循序渐进，急躁只会徒增障碍。",
    category: "耐心",
    keywords: ["急躁", "快", "慢", "循序渐进", "耐心", "欲速", "焦虑"]
  },
  {
    id: 17, title: "以直报怨",
    text: "面对伤害你的人，不必以德报怨，也不必以怨报怨。用正直坦诚的态度回应，才是最好的方式。",
    category: "处世",
    keywords: ["恩怨", "报复", "宽容", "正直", "公平", "伤害", "原谅"]
  },
  {
    id: 18, title: "敏行讷言",
    text: "说话谨慎迟钝，做事敏捷勤快。少说多做，是成事者最朴素的修养。",
    category: "言行",
    keywords: ["少说多做", "行动", "慎言", "务实", "讷言", "沉默", "踏实"]
  },
  {
    id: 19, title: "过犹不及",
    text: "过度和不足一样有害。做任何事都要把握分寸，恰到好处才是最高境界。",
    category: "平衡",
    keywords: ["过度", "不足", "分寸", "适度", "恰到好处", "过量", "刚好"]
  },
  {
    id: 20, title: "人无远虑",
    text: "人如果没有长远的考虑，必然会有近在眼前的忧患。眼光放远，才能走得更稳。",
    category: "远见",
    keywords: ["远见", "规划", "忧虑", "长远", "目光", "未来", "打算"]
  },
];

export const lifeWisdomKnowledgeBase: KnowledgeBase = {
  id: 'life-wisdom',
  name: '人生智慧',
  description: '源自东方传统智慧的20条人生法则',
  getAllRules: () => RULES,
  searchRules: (query: string, topK: number = 5) => universalSearch(RULES, query, topK),
  getRuleById: (id: number | string) => RULES.find((r) => r.id === id),
  getRulesByCategory: (category: string) => RULES.filter((r) => r.category === category),
};