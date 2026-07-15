# 易命之书 · 开发手册

> 项目：**yiming-web**（易命之书 Web 端 + 后台）
> 维护人：仲超
> 最后更新：2026-07-15
>
> **本手册是所有开发/部署/运维行为的唯一权威文档。**
> 任何环境变量、账号、流程、坑点的变更，必须同步更新本文件。

---

## 1. 项目概览

### 1.1 产品定位
基于《易命之书》52 条人生法则的 AI 问答产品。用户输入困惑 → 系统检索命中相关法则 → 调用大模型生成有温度的建议。

### 1.2 双端形态
| 端 | 技术栈 | 部署 | 域名 |
|---|---|---|---|
| Web + 管理后台 | Next.js 16 (App Router + Turbopack) | CloudBase Cloud Run (国内主入口) + Vercel (海外灾备) | *填生产域名* |
| 微信小程序 | 原生小程序 (`yiming-miniprogram/`) | 微信小程序平台 | *小程序 AppID* |

### 1.3 核心技术栈
- **框架**：Next.js 16.2.9（App Router + Turbopack，不是传统 Pages Router）
- **语言**：TypeScript
- **样式**：Tailwind CSS 4（CSS-only `@plugin` 语法）
- **数据库**：Supabase PostgreSQL（东京区域，Transaction Pooler 端口 6543）
- **鉴权**：JWT（`jsonwebtoken` + `bcryptjs`）
- **大模型**：可切换 Provider（默认阿里云 DashScope · qwen-plus）
- **UI 图表**：recharts

### 1.4 路径速查
| 路径 | 用途 |
|---|---|
| `/` | 首页（问答入口）|
| `/auth` | 用户登录/注册 |
| `/admin/login` | 管理员登录 |
| `/admin` | 管理概览（KPI + 图表）|
| `/admin/users` | 用户管理 |
| `/admin/history` | 问答记录 |
| `/admin/model-config` | **大模型配置**（本次新增）|
| `POST /api/ask` | 用户提问入口 |
| `POST /api/auth/login` | 用户登录 |
| `POST /api/admin/login` | 管理员登录 |
| `GET/PUT /api/admin/model-config` | 大模型配置读写 |
| `POST /api/admin/model-config/test` | 大模型测试调用 |

---

## 2. 目录结构

```
yiming-web/
├── app/                              # Next.js App Router 页面 + API
│   ├── page.tsx                      # 首页
│   ├── layout.tsx                    # 根 layout
│   ├── admin/                        # 管理后台 UI
│   │   ├── layout.tsx                # 后台侧边栏（改这里加菜单项）
│   │   ├── login/page.tsx
│   │   ├── page.tsx                  # 概览
│   │   ├── users/, history/, model-config/
│   ├── auth/, api/
│   │   ├── ask/route.ts              # 主问答 API（调用大模型）
│   │   ├── admin/                    # 后台 API（要求 admin JWT）
│   │   └── auth/                     # 用户 JWT
├── lib/                              # 业务层（跨路由复用）
│   ├── database.ts                   # PG 连接池 + 所有 SQL（schema 自动迁移）
│   ├── llm-client.ts                 # 大模型统一客户端 + 30s 内存缓存
│   ├── providers.ts                  # 大模型 Provider 预设（4 家）
│   ├── knowledge-registry.ts         # 知识库注册中心
│   ├── knowledge-bases/              # 每个知识库一份规则数据
│   │   ├── yiming.ts                 # 《易命之书》52 条
│   │   ├── life-wisdom.ts
│   │   └── workplace.ts
│   ├── auth.ts / admin-auth.ts / admin-client.ts
├── .env.local                        # 本地环境变量（gitignore）
├── package.json
└── DEVELOPMENT.md                    # ← 本文件
```

### 2.1 高频改动区域

| 场景 | 改哪里 |
|---|---|
| 新增/修改一条法则 | `lib/knowledge-bases/*.ts` |
| 新增知识库 | 加一份 `lib/knowledge-bases/xxx.ts` + `knowledge-registry.ts` 注册 |
| 换大模型 / 调温度 / 改人设 | **后台 `/admin/model-config` 页面**（不用改代码）|
| 新增大模型 Provider（如 Kimi） | `lib/providers.ts` 加一条 + 部署环境加对应 API_KEY |
| 后台新增菜单 | `app/admin/layout.tsx` 的 `navItems` |
| 数据库新增字段/表 | `lib/database.ts` 的 `initSchema()`（用 `CREATE TABLE/COLUMN IF NOT EXISTS`）|

---

## 3. 本地开发环境

### 3.1 基础工具版本
- **Node.js**：v22.x（当前用 v22.23.1）
- **包管理器**：npm（package-lock.json 已提交）
- **编辑器**：VS Code / Cursor（含 TypeScript LSP）

### 3.2 首次初始化步骤
```bash
git clone git@github.com:csebk/yiming-web.git
cd yiming-web
npm install
cp .env.local.example .env.local   # 如果有 example；否则按 3.3 手写
# 编辑 .env.local 填入所有必需变量
npm run dev                        # 默认 http://localhost:3000
```

### 3.3 `.env.local` 字段清单（必需）

```bash
# ─── 数据库 ───────────────────────────────
# 从 Supabase Dashboard → Settings → Database → Transaction pooler（端口 6543）复制
# 密码里若含 $ 必须每个都转成 \$（Next.js dotenv 会展开变量！）
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# 本地开发专用：让本地写入 model_config_dev 表，不污染生产 model_config
# 生产环境（Cloud Run/Vercel）不设置此变量 → 默认走 model_config
MODEL_CONFIG_TABLE=model_config_dev

# ─── 大模型 API Key（至少配一个）────────────
DASHSCOPE_API_KEY=sk-xxx                         # 阿里云百炼（默认）
# ARK_API_KEY=xxx                                # 火山方舟（豆包）
# DEEPSEEK_API_KEY=sk-xxx                        # DeepSeek
# OPENAI_API_KEY=sk-xxx                          # OpenAI

# ─── 管理员账号（本地开发用，跟生产完全独立）──
ADMIN_USERNAME=admin
# bcrypt 生成命令：
#   node -e "const b=require('bcryptjs');console.log(b.hashSync('你的密码',10))"
# 生成结果形如 $2b$10$xxx，写入 .env.local 时每个 $ 都要转义为 \$
ADMIN_PASSWORD_HASH=\$2b\$10\$xxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── JWT ─────────────────────────────────
# 生产环境用一个 32+ 位强随机串（openssl rand -hex 32）
JWT_SECRET=local-dev-secret-do-not-use-in-prod
```

### 3.4 常用命令
```bash
npm run dev                     # 启动开发服务器（Turbopack，端口 3000）
npm run build                   # 生产构建（先跑这个检查编译错误）
npm run start                   # 跑构建后的产物
npx tsc --noEmit                # 类型检查
npm run lint                    # ESLint

# 强制释放 3000 端口
lsof -ti:3000 | xargs kill -9
```

### 3.5 首次启动检查清单
- [ ] 日志出现 `▲ Next.js 16.x.x (Turbopack)`
- [ ] 日志出现 `✓ Ready in <1s`
- [ ] 日志出现 `[yiming-db] Postgres schema ready`（若显示 `DATABASE_URL not set` 表示环境变量没读到）
- [ ] 浏览器打开 http://localhost:3000/ 能看到首页
- [ ] http://localhost:3000/admin/login 能登录后台

---

## 4. 部署环境

### 4.1 CloudBase Cloud Run（国内主入口）

| 项 | 值 |
|---|---|
| 服务名 | *填 CloudBase 里的服务名* |
| 区域 | *填* |
| CPU / 内存 | 0.25 核（成本优先）|
| 扩缩容 | *填最小/最大实例数* |
| 冷启动 | 首次请求 200~500ms 额外延迟（可接受）|

**环境变量**（在 CloudBase 控制台 → 版本管理 → 环境变量 里维护，**不**放代码仓库）：
- `DATABASE_URL`（Supabase 6543 pooler）
- `DASHSCOPE_API_KEY` / 其他 Provider Key
- `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`
- **不要设置** `MODEL_CONFIG_TABLE`（生产走默认表 `model_config`）

**部署流程**：*填当前使用的命令，如 `tcb service:deploy` 或控制台上传*

### 4.2 Vercel（海外灾备）

| 项 | 值 |
|---|---|
| 项目名 | yiming-web |
| GitHub | csebk/yiming-web，`main` 分支自动部署 |
| 域名 | *填* |

**环境变量**：与 CloudBase 一致（在 Vercel Dashboard → Settings → Environment Variables），同样**不设** `MODEL_CONFIG_TABLE`。

### 4.3 双入口切换
- 小程序 `API_BASE` 默认指向 **CloudBase 域名**（国内延迟低）
- CloudBase 故障时手动切到 Vercel 域名（改小程序配置文件或 CloudBase 里代理转发）

---

## 5. 数据库（Supabase）

### 5.1 项目信息
| 项 | 值 |
|---|---|
| Region | Tokyo (`ap-northeast-1`) |
| Host | `aws-0-ap-northeast-1.pooler.supabase.com` |
| Pooler 类型 | **Transaction pooler** |
| 端口 | **6543**（不是 5432 / 不是 Session pooler）|
| SSL | 必需（代码里已强制 `rejectUnauthorized: false`）|

⚠️ **端口选择说明**：Vercel Serverless / CloudBase Cloud Run 是短连接场景，必须用 Transaction pooler (6543)；Session pooler / 直连 5432 会耗尽连接数。

### 5.2 表清单
| 表 | 用途 | 谁写 |
|---|---|---|
| `users` | 用户账号 | `/api/auth/register` |
| `ask_history` | 问答历史（含命中的法则）| `/api/ask` |
| `model_config` | **生产**大模型配置（provider/model/温度/prompt）| `/api/admin/model-config` PUT（生产环境）|
| `model_config_dev` | **本地开发**大模型配置（隔离）| 同上（本地环境，`MODEL_CONFIG_TABLE` 触发）|

### 5.3 Schema 迁移
- 所有 `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` 语句在 `lib/database.ts` 的 `initSchema()` 里
- **首次请求任意 DB 读写时自动执行**（`ensureReady()` 幂等）
- 新增字段的正确姿势：加 `ALTER TABLE ADD COLUMN IF NOT EXISTS`，不要手动登 Supabase 控制台改

### 5.4 密码 / 连接串管理
- Supabase 数据库密码：**只存密码管理器**，不进任何文档
- 忘记密码 → Supabase Dashboard → Settings → Database → **Reset database password**（会强制断开所有连接，慎用；重置后要更新 Cloud Run + Vercel + 本地 `.env.local`）

### 5.5 备份
- Supabase 免费版：**每日自动备份保留 7 天**
- 重大变更前手动 Snapshot：*填流程*

---

## 6. 大模型配置

### 6.1 预设 Provider（`lib/providers.ts`）
| Provider | Endpoint | API Key Env | 默认模型 |
|---|---|---|---|
| DashScope（阿里百炼）| `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `DASHSCOPE_API_KEY` | `qwen-plus` |
| 火山方舟（豆包）| `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | `ARK_API_KEY` | `doubao-1-5-pro-32k-250115` |
| DeepSeek | `https://api.deepseek.com/v1/chat/completions` | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| OpenAI 兼容 | `https://api.openai.com/v1/chat/completions` | `OPENAI_API_KEY` | `gpt-4o-mini` |

### 6.2 后台"模型配置"页操作指南
访问 **`/admin/model-config`**，可修改：
- **Provider**：4 选 1（下拉）
- **模型名**：自由输入（有 datalist 建议）
- **Temperature**：0~1.5 滑块，易命之书建议 **0.3~0.5**（稳定优先）
- **Max Tokens**：100~8000，默认 1500
- **System Prompt**：多行文本，定义角色/风格/边界

保存后：
- 立即写入 DB（本地→`model_config_dev`，生产→`model_config`）
- 30 秒内 `/api/ask` 缓存自动过期，新配置生效
- 其他并行实例最长 30 秒后同步

**测试连接**按钮：用当前表单发一次真实调用（不落库），返回延时+样例回答。

### 6.3 新增 Provider（如接入 Kimi）
1. `lib/providers.ts` 追加一条到 `PROVIDERS`：
   ```ts
   moonshot: {
     id: "moonshot",
     label: "Moonshot Kimi",
     baseUrl: "https://api.moonshot.cn/v1/chat/completions",
     apiKeyEnv: "MOONSHOT_API_KEY",
     defaultModel: "moonshot-v1-8k",
     suggestions: ["moonshot-v1-8k", "moonshot-v1-32k"],
   }
   ```
2. `ProviderId` 联合类型也要加 `"moonshot"`
3. Cloud Run + Vercel + 本地 `.env.local` 都加 `MOONSHOT_API_KEY`
4. `npm run build` 通过 → commit → push

### 6.4 System Prompt 变更历史
| 日期 | 变更 | 生效环境 |
|---|---|---|
| 2026-07-15 | 初版：温和长者人设 | 默认值 |
| ... | | |

---

## 7. 管理员与安全

### 7.1 本地管理员账号（仅 dev）
- 用户名：`admin`
- 密码：`admin123`
- 存储：`.env.local` 里的 `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`
- 只在本地使用，**跟生产完全独立**

### 7.2 生产管理员账号
- 存储：CloudBase + Vercel 环境变量
- 密码存**密码管理器**（如 1Password / Bitwarden），不写文档
- 修改流程：
  1. 生成新 bcrypt hash：`node -e "console.log(require('bcryptjs').hashSync('新密码',10))"`
  2. 更新 Cloud Run + Vercel 的 `ADMIN_PASSWORD_HASH`（`$` 转义为 `\$`）
  3. 触发重新部署

### 7.3 JWT_SECRET
- **轮换影响**：所有在线用户 token 立即失效，需重新登录
- 生产环境务必用 32+ 位强随机串：`openssl rand -hex 32`
- 本地开发可以固定为可读字符串

### 7.4 敏感值不进 Git 检查
- `.gitignore` 已包含 `.env.local`、`.env*.local`
- 提交前 `git status` 确认无 `.env` 类文件

---

## 8. 常见问题与踩坑记录（活文档，持续追加）

### 8.1 Next.js 16 dotenv 会展开 `$xxx` 变量 ⚠️
**症状**：bcrypt hash `$2b$10$lnmwww...` 写入 `.env.local` 后，`process.env.ADMIN_PASSWORD_HASH` 只有 35 字符（应 60），登录永远失败。
**原因**：Next.js dotenv 把 `$2b`、`$10`、`$lnmwww...` 都当变量引用展开。**单/双引号救不了。**
**解决**：每个 `$` 前加反斜杠转义为 `\$`。写入后用如下方式验证：
```ts
// 临时加个路由 /api/admin/debug-env
console.log(process.env.ADMIN_PASSWORD_HASH?.length);  // 必须 60
```
**适用范围**：所有含 `$` 的密码、hash、密钥（如 DB 密码、bcrypt hash）。

### 8.2 Next.js 忽略以下划线开头的目录
**症状**：`app/api/admin/_debug-env/route.ts` 访问返回 404。
**原因**：`_` 前缀是 Next.js 私有约定（`_app` `_document` 等），整个目录不参与路由。
**解决**：改名成 `debug-env`（无下划线前缀）。

### 8.3 Turbopack 冷启动 & 懒编译
- 首次访问某路由要 2~5 秒编译（Turbopack 特性）
- 后续访问 < 50ms
- **验证方法**：`npm run build` 独立验证（不受懒编译影响）

### 8.4 Supabase Transaction Pooler vs Session Pooler
- **Serverless（Vercel/CloudBase）→ 必须用 Transaction Pooler (6543)**
- Session Pooler 保持连接，Serverless 短生命周期会耗尽连接数
- 直连 5432 更是不行

### 8.5 本地写生产表事故（2026-07-15）
**症状**：本地测试模型配置时，直接写入了 Supabase 里的 `model_config`（生产表）。
**根因**：本地和生产共享同一个 Supabase，且表名相同。
**解决**：引入 `MODEL_CONFIG_TABLE` 环境变量，本地设为 `model_config_dev` 实现表级隔离。
**类似坑预防**：未来如再引入需要"配置"性质的表（如 `settings`、`feature_flags`），同样设计 `XXX_TABLE` env 变量支持 dev 隔离。

### 8.6 CloudBase 冷启动
- 0.25 核实例长时间无请求会缩容到 0
- 冷启动 200~500ms 额外延迟 + 首次 DB 连接 ~200ms
- **缓解**：`llm-client.ts` 里加了 30s 模型配置缓存

### 8.7 （待补充）
- [ ] 小程序审核合规注意点
- [ ] 域名切换实操
- [ ] Sentry / 监控接入

---

## 9. 功能迭代记录

> **约定**：每完成一个可对外"报告"的功能就加一行；内部重构/纯 bug fix 不入表；日期用完成日；"用户可见变化"一句话说清。**新的在上**。

| 日期 | 版本 | 功能 | 用户可见变化 | 关联文件/位置 |
|---|---|---|---|---|
| 2026-07-15 | v0.2 | **大模型配置后台** | 管理后台新增"模型配置"菜单，可视化切换 Provider（DashScope / 豆包 / DeepSeek / OpenAI）、模型名、温度、Max Tokens、System Prompt，"测试连接"按钮可即时验证。无需改代码换模型。 | `app/admin/model-config/page.tsx`, `app/api/admin/model-config/*`, `lib/llm-client.ts`, `lib/providers.ts` |
| 2026-07-15 | v0.2 | 本地/生产表隔离（内部） | 无用户可见变化。开发者在本地保存模型配置不再污染生产数据。 | `lib/database.ts` (`MODEL_CONFIG_TABLE` env) |
| 2026-07-15 | v0.2 | 开发手册 DEVELOPMENT.md | 无用户可见变化。团队/AI 助手可查阅统一开发文档。 | `DEVELOPMENT.md` |
| 2026-07-15 | v0.1 | 管理后台 | 管理员可查看用户列表、问答记录、KPI 概览、每日趋势、热门法则 | `app/admin/*`, `app/api/admin/*` |
| 2026-07-14 | v0.1 | 三知识库系统 | 用户可在《易命之书》《人生智慧》《职场智慧》三个知识库间切换提问 | `lib/knowledge-bases/*`, `lib/knowledge-registry.ts` |
| 2026-07-08 | v0.1 | 用户系统 | 用户可注册、登录，问答记录自动保存到个人历史 | `app/auth/*`, `app/api/auth/*`, `lib/auth.ts` |
| 2026-07-05 | v0.1 | 双端部署 | 用户可通过 CloudBase（国内）或 Vercel（海外）访问；微信小程序可用 | CloudBase + Vercel + `yiming-miniprogram/` |
| 2026-07-02 | v0.1 | Vercel（海外）部署，存在国内访问慢问题
| 2026-07-02 | v0.1 | AI 问答核心 | 用户输入问题 → 检索命中相关法则 → 大模型生成有温度的建议 | `app/api/ask/route.ts` |
