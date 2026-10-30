# StudyFlow · 学程 —— 大学生学习与项目管理平台

> 面向大学生的 **“目标制定 → 项目规划 → 任务执行 → 进度统计 → 周期复盘”** 全链路个人学习与工程实践管理平台。  
> **第四届全国大学生职业规划大赛（成长赛道）** 软件开发工程师方向代表性工程实践项目。

---

## 1. 项目简介与立项背景

大学生在日常专业学习、程序设计竞赛训练（如蓝桥杯、码蹄杯、天梯赛）与个人软件开发过程中，常面临**任务分散、长期目标难拆解、项目进度缺乏量化反馈、完成后缺少复盘总结**四大痛点。

**StudyFlow（学程）** 不只是一个简单的待办事项清单（To-Do List），而是将每一天的具体任务执行，与阶段性项目进度、中长期职业/学习目标串联成完整闭环，并通过自然周结构化复盘沉淀真实可追溯的成长轨迹。

---

## 2. 核心功能模块 (MVP)

| 模块 | 路由 | 核心能力与验收亮点 |
| :--- | :--- | :--- |
| **账户与安全隔离** | `/login` | 邮箱注册/登录/退出、路由守卫拦截（`AC-01`）、多用户数据严格隔离与跨用户外键绑定拦截（`AC-10`） |
| **学习总览** | `/dashboard` | 今日待办数、逾期未完成警示、进行中项目实时进度条、总任务完成率真实统计（`AC-07`） |
| **学习目标** | `/goals` | 长期目标创建、编辑、状态流转（进行中/已完成/已暂停）及关联项目进度追踪（`AC-02`） |
| **项目管理与详情** | `/projects`<br/>`/projects/:id` | 项目创建与目标关联（`AC-03`）、按子任务自动计算完成率（如 `3/5 -> 60%`，无任务显示 `暂无任务`，`AC-06`）、删除项目保留原有任务并自动解绑（`AC-04`） |
| **任务中心** | `/tasks` | 任务增删改查、状态切换（`todo`/`doing`/`done`）、优先级、计划日期与逾期红色高亮提醒（`AC-05`）、多维筛选 |
| **每周复盘** | `/reviews` | 按自然周（周一 `week_start`）记录成果、问题与下周计划，同周重复保存自动更新原记录（Upsert 防重，`AC-08`） |

---

## 3. 技术栈与双模式架构

- **前端框架**：React 19 + TypeScript + Vite 6 + React Router 7 + Lucide Icons
- **样式与适配**：Tailwind CSS v4（桌面端固定左侧导航 + `390px` 移动端抽屉菜单自适应，无横向溢出，`AC-12`）
- **数据存储与安全架构（双模式无缝切换）**：
  1. **本地持久化隔离模式（默认开箱即用）**：内置 `LocalPersistenceRepository`，完整复刻外键 `ON DELETE SET NULL`、同周唯一约束与跨用户 RLS 拦截逻辑，并预置“竞赛生主账号 (User A)”与“隔离测试账号 (User B)”真实演示数据，无需配置外部云服务即可离线秒开演示。
  2. **Supabase 云端生产模式**：提供完整 PostgreSQL 建表、触发器与 Row Level Security (RLS) 迁移脚本 [`supabase/migrations/001_init_studyflow.sql`](./supabase/migrations/001_init_studyflow.sql)。配置 `.env` 后自动切换至云端 PostgreSQL 数据库。
- **自动化测试**：Vitest 验收测试套件（[`src/__tests__/acceptance.test.ts`](./src/__tests__/acceptance.test.ts)），覆盖核心业务逻辑与安全隔离验证。

---

## 4. 快速启动与运行指南（对应 `AC-13`）

### 4.1 环境要求
- Node.js `>= 18`（推荐 `v20+` / `v24+`）

### 4.2 安装与本地启动
```bash
# 1. 进入项目目录
cd d:\Codex\StudyFlow

# 2. 安装依赖（若已安装可跳过）
npm install

# 3. 启动本地开发服务器
npm run dev
```
启动后在浏览器访问终端提示的地址（通常为 `http://localhost:5173`）。

### 4.3 运行自动化验收测试与生产构建
```bash
# 运行 AC-01 ~ AC-11 自动化验收测试套件
npm test

# 执行 TypeScript 类型检查与生产环境打包
npm run build
```

### 4.4 （可选）连接真实 Supabase 云端数据库
1. 在 Supabase 控制台新建项目，打开 SQL Editor 执行 [`supabase/migrations/001_init_studyflow.sql`](./supabase/migrations/001_init_studyflow.sql)；
2. 复制 `.env.example` 为 `.env`，填入你的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`；
3. 重启 `npm run dev`，系统左下角状态指示器将自动切换为 **`Supabase RLS 云端隔离`**。

---

## 5. 比赛答辩 3 分钟核心演示脚本

1. **登录与安全守卫（`/login`）**：展示未登录拦截，点击 **`一键登录：竞赛生主账号 (User A)`** 进入系统；
2. **学习总览（`/dashboard`）**：展示“今日待办”“逾期未完成（红色预警）”“进行中项目（StudyFlow MVP 显示 `60%`）”四大实时指标；
3. **目标与项目拆解（`/goals` → `/projects/:id`）**：查看“从程序设计竞赛向软件开发工程师转型”目标，点进 `StudyFlow` 项目详情页，现场勾选完成第 4 个子任务，观察完成率立即从 **`60% (3/5)`** 跃升至 **`80% (4/5)`**；
4. **每周复盘防重（`/reviews`）**：展示本周复盘内容，现场修改“下周计划”并点击保存，验证同一自然周自动更新原记录而不产生重复记录；
5. **多用户数据隔离（侧边栏切换 User B）**：点击左下角 **`切换至测试用户 B (验证隔离)`**，展示 User B 只能看到自己的英语备考数据，完全无法查看或篡改 User A 的竞赛与项目记录。

---

## 6. 工程文档索引

- 📄 [01-PRD.md](./docs/01-PRD.md) —— 产品需求文档
- 📄 [02-MVP.md](./docs/02-MVP.md) —— MVP 功能清单与业务规则规范
- 📄 [03-PAGES.md](./docs/03-PAGES.md) —— 页面结构、路由规划与响应式交互设计
- 📄 [04-DATABASE.md](./docs/04-DATABASE.md) —— 数据库 Schema、ER 图与 PostgreSQL RLS 安全策略设计
- 📄 [05-ACCEPTANCE.md](./docs/05-ACCEPTANCE.md) —— MVP 13 项量化验收标准与测试结果
- 📄 [06-DECISIONS.md](./docs/06-DECISIONS.md) —— 架构与技术决策记录（ADR-01 ~ ADR-07）
- 📄 [07-DEVLOG.md](./docs/07-DEVLOG.md) —— 项目开发与职业成长实践日志（比赛过程证据链）
