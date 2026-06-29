# 易命之书 · 人生答疑

> 输入你的困惑，让《易命之书》52条人生法则为你指点迷津

## 产品简介

「易命之书问答产品」是一个基于《易命之书》52条人生法则的智能问答系统。用户输入人生困惑后，系统会：

1. **智能检索** — 从52条法则中匹配最相关的3-5条
2. **AI分析** — 调用大模型基于法则生成个性化回答
3. **法则引用** — 展示引用的法则原文及出处

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.9 | Web 框架（App Router） |
| React | 19.2.4 | UI 库 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4 | 原子化 CSS |
| DashScope | - | 大模型 API（通义千问 qwen-plus） |

## 项目结构

```
yiming-web/
├── app/
│   ├── layout.tsx              # 根布局（中文字体、元信息）
│   ├── page.tsx                # 主页面（输入框 + 回答展示 + 示例问题）
│   ├── globals.css             # 全局样式（Tailwind CSS 4 + 自定义主题）
│   └── api/
│       └── ask/
│           └── route.ts        # API 路由：POST /api/ask
├── lib/
│   └── yiming.ts               # 核心逻辑：52条法则 + 检索算法 + Prompt 构建
├── public/                     # 静态资源
├── .env.example                # 环境变量模板
├── .env.local                  # 本地环境变量（含 API Key，git 忽略）
├── next.config.ts              # Next.js 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 依赖管理
└── README.md                   # 本文件
```

## 快速开始

### 本地开发

```bash
cd yiming-web
npm install
npm run dev
# 访问 http://localhost:3000
```

### 构建生产版本

```bash
npm run build
npm start
```

### 配置大模型 API

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 DASHSCOPE_API_KEY
```

## 核心功能

### 1. 智能法则检索

采用三层混合检索策略：
- **精确子串匹配** — 标题/文本精确匹配（权重最高）
- **n-gram 分词匹配** — 2-3字片段重叠匹配
- **语义映射** — 常见问题到法则ID的快捷映射

### 2. 大模型回答生成

- 调用通义千问 qwen-plus 模型
- 基于检索到的法则构建结构化 Prompt
- 包含系统角色、法则列表、回答要求、用户问题
- 支持 fallback 模拟响应（无 API Key 时）

### 3. 用户体验优化

- 每日一句（随机展示法则名言）
- 示例问题引导
- 问答历史记录（localStorage 持久化）
- 加载动画 + 骨架屏
- 响应式设计（移动端友好）

## 部署

### Vercel（推荐）

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 设置环境变量 `DASHSCOPE_API_KEY`
4. 自动部署，获得 `*.vercel.app` 域名

### Docker

```bash
docker build -t yiming-web .
docker run -p 3000:3000 --env-file .env.local yiming-web
```

## 成本

- **Vercel**：免费额度足够
- **DashScope API**：约 0.01 元/次提问
- **域名**：可选（Vercel 提供 *.vercel.app 免费域名）

## 参考资料

- 《易命之书52条人生法则》：`人生感悟知识库/易命之书52条人生法则.md`
- 产品设计方案：`方案A_产品设计方案.md`
- 技术文档：`技术文档.md`
