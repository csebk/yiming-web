/**
 * 职场智慧知识库 — 第三知识库示例
 * 
 * 新增知识库只需实现 KnowledgeBase 接口并注册到 knowledge-registry.ts。
 */

import type { Rule, KnowledgeBase } from '../knowledge-base';
import { universalSearch } from '../knowledge-base';

const RULES: Rule[] = [
  {
    id: 1, title: "先立后破",
    text: "在找到新出路之前，不要轻易放弃现有阵地。先站稳脚跟，再图更大的发展。",
    category: "职业",
    keywords: ["跳槽", "辞职", "转型", "裸辞", "稳定", "后路", "备选"]
  },
  {
    id: 2, title: "向上管理",
    text: "管理你与上级的关系，不是讨好而是主动同步。让领导知道你的进度、困难和成果，比埋头苦干更重要。",
    category: "沟通",
    keywords: ["领导", "汇报", "管理", "上级", "沟通", "老板", "同步"]
  },
  {
    id: 3, title: "价值交换",
    text: "职场本质上是一场价值交换。你的薪酬取决于你能解决多大的问题，而不是你有多辛苦。",
    category: "认知",
    keywords: ["薪酬", "价值", "付出", "回报", "工资", "涨薪", "加薪"]
  },
  {
    id: 4, title: "拒绝内耗",
    text: "工作中的内耗多数来自人际关系，而非工作本身。少琢磨别人怎么看你，多关注事情怎么做好。",
    category: "心态",
    keywords: ["内耗", "纠结", "焦虑", "同事", "关系", "办公室", "精神内耗"]
  },
  {
    id: 5, title: "主动破局",
    text: "等待机会的人永远在等，创造机会的人永远在走。主动承担边界外的工作，是成长最快的方式。",
    category: "成长",
    keywords: ["主动", "机会", "争取", "承担", "突破", "成长", "挑战"]
  },
  {
    id: 6, title: "成果导向",
    text: "过程再精彩，没有结果等于零。职场只看交付，不看你加了多少班。学会用结果说话。",
    category: "执行",
    keywords: ["结果", "交付", "KPI", "考核", "加班", "效率", "产出"]
  },
  {
    id: 7, title: "边界感",
    text: "同事可以是朋友，但首先要有边界。不越界帮忙，不过度分享私事，不把情绪带到工作中。",
    category: "人际",
    keywords: ["同事", "边界", "距离", "私事", "分寸", "分寸感", "相处"]
  },
  {
    id: 8, title: "终身学习",
    text: "你在职场最大的竞争力，不是现在的技能，而是学习新技能的能力。保持学习，才能不被淘汰。",
    category: "成长",
    keywords: ["学习", "技能", "提升", "充电", "培训", "竞争力", "混日子"]
  },
  {
    id: 9, title: "拒绝完美主义",
    text: "完成比完美重要。先做出来，再迭代优化。等待完美方案的人，往往什么都做不出来。",
    category: "执行",
    keywords: ["完美", "拖延", "完成", "行动", "迭代", "追求完美", "纠结"]
  },
  {
    id: 10, title: "人脉本质",
    text: "人脉不是你认识多少人，而是多少人愿意帮你。建立人脉最好的方式，是让自己变得有价值。",
    category: "社交",
    keywords: ["人脉", "社交", "资源", "关系", "合作", "价值", "人脉圈"]
  },
];

export const workplaceKnowledgeBase: KnowledgeBase = {
  id: 'workplace',
  name: '职场智慧',
  description: '职场生存与发展的10条核心法则',
  getAllRules: () => RULES,
  searchRules: (query: string, topK: number = 5) => universalSearch(RULES, query, topK),
  getRuleById: (id: number | string) => RULES.find((r) => r.id === id),
  getRulesByCategory: (category: string) => RULES.filter((r) => r.category === category),
};