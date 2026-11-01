# StudyFlow · 学程 —— 大学生学习与项目管理平台

[![CI](https://github.com/DuXingXY/StudyFlow/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/DuXingXY/StudyFlow/actions/workflows/ci.yml)

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

- Windows、macOS 或 Linux。
- Node.js `>= 22`（推荐 `24 LTS`；锁文件中的 Supabase 客户端要求 Node.js 22 或以上），以及随 Node.js 安装的 npm。
- Git（使用下方克隆方式时需要）。

可先在终端执行 `node --version`、`npm --version` 和 `git --version` 确认环境。首次下载源码和安装依赖需要联网。

### 4.2 安装与本地启动

在你希望存放项目的目录打开终端，执行以下命令。Windows PowerShell、macOS 和 Linux 终端均可使用，无需创建特定盘符或目录。

```bash
# 1. 下载源码并进入项目目录
git clone https://github.com/DuXingXY/StudyFlow.git
cd StudyFlow

# 2. 按仓库锁文件安装依赖，与 CI 保持一致
npm ci

# 3. 启动本地开发服务器
npm run dev
```

没有安装 Git 时，也可以在仓库页面选择 **Code → Download ZIP**，解压后在包含 `package.json` 的文件夹中打开终端，从 `npm ci` 开始执行。

启动后保持终端运行，在浏览器访问终端输出的 **Local** 地址，通常为 `http://localhost:5173`。端口被占用时 Vite 会尝试其他端口，请以实际输出为准；按 `Ctrl+C` 可停止服务器。

**首次体验无需创建 `.env`、配置 Supabase 或注册账号。** 在登录页点击 **“一键进入：竞赛生主账号 (User A)”** 即可查看预置目标、项目、任务和周复盘；进入 StudyFlow 项目可看到 `3/5 = 60%` 的初始进度。也可使用隔离测试账号 User B 对比两位用户的数据。

默认模式将数据保存在当前浏览器、当前访问地址的 LocalStorage 中；刷新后保留，更换浏览器、设备或访问端口不会自动同步。侧边栏的 **“重置数据”** 会覆盖本地修改并恢复初始演示数据。

### 4.3 运行自动化验收测试与生产构建
```bash
# 运行现有 8 项核心数据层验收测试
npm test -- --run

# 执行 TypeScript 类型检查与生产环境打包
npm run build

# 在本机预览刚生成的生产包（先完成上面的构建）
npm run preview
```

生产包生成在 `dist/` 中；预览时访问终端输出的地址。`npm run preview` 用于本机检查构建结果。

GitHub Actions 在每次推送、Pull Request 或手动触发时，使用 Node.js 24 依次执行 `npm ci`、`npm test -- --run` 与 `npm run build`。流程见 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)，运行结果见 [GitHub Actions](https://github.com/DuXingXY/StudyFlow/actions)。

现有自动化测试覆盖本地数据层的认证、目标与项目关联、删除保护、逾期与进度计算、周复盘防重、用户隔离和空输入校验；浏览器路由、刷新持久化、390px 移动端交互及真实 Supabase RLS 仍需按 [`docs/05-ACCEPTANCE.md`](./docs/05-ACCEPTANCE.md) 的对应步骤验收。

### 4.4 （可选）连接真实 Supabase 云端数据库

需要使用云端账号与数据库时，再进行以下配置；默认本地演示可跳过本节。

1. 在 Supabase 控制台新建项目，打开 SQL Editor 执行 [`supabase/migrations/001_init_studyflow.sql`](./supabase/migrations/001_init_studyflow.sql)；
2. 在项目根目录复制 `.env.example` 为 `.env`，填入你自己的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。可在文件管理器中复制，或使用对应终端命令：

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env
   ```

   ```bash
   # macOS / Linux
   cp .env.example .env
   ```

3. 停止并重新运行 `npm run dev`。两个变量均填写后，应用自动使用 Supabase，侧边栏显示 `CLOUD RLS`；若使用生产包，修改环境变量后需要重新构建。
4. 使用该 Supabase 项目的真实账号注册或登录。本地演示账号及其预置数据不会自动导入云端；一键演示入口仅在本地模式显示。

### 4.5 常见启动问题

| 现象 | 处理方式 |
| :--- | :--- |
| 提示找不到 `node`、`npm` 或 `git` | 确认对应程序已安装，关闭终端后重新打开，再检查版本。 |
| 提示找不到 `package.json` | 切换到下载或解压得到的项目根目录；该目录应包含 `package.json`、`package-lock.json` 和 `src/`。 |
| Node.js 版本不满足依赖要求 | 切换至 Node.js 24 LTS，停止开发服务器后重新执行 `npm ci`。 |
| Windows 执行 `npm ci` 时提示原生模块 `EPERM` / 文件占用 | 先用 `Ctrl+C` 停止正在运行的本项目开发服务器或预览进程，再重试安装。 |
| 浏览器无法打开 `localhost:5173` | 确认启动终端仍在运行，并使用终端实际输出的 Local 地址。 |
| 想体验预置数据，但出现云端登录错误 | 检查是否配置过 Supabase 环境变量；清空 `.env` 中的两个配置值后重启，并确认终端或其他 `.env.*` 文件没有提供相同变量。 |

---

## 5. 比赛答辩 3 分钟核心演示脚本

1. **登录与安全守卫（`/login`）**：展示未登录拦截，点击 **`一键进入：竞赛生主账号 (User A)`** 进入系统；
2. **学习总览（`/dashboard`）**：展示“今日待办”“逾期未完成（红色预警）”“进行中项目”“总完成率”四大实时指标，右侧项目列表中 StudyFlow 项目显示 `60%`；
3. **目标与项目拆解（`/goals` → `/projects/:id`）**：查看“从程序设计竞赛向软件开发工程师转型”目标，点进 `StudyFlow` 项目详情页，现场勾选完成第 4 个子任务，观察完成率立即从 **`60% (3/5)`** 跃升至 **`80% (4/5)`**；
4. **每周复盘防重（`/reviews`）**：展示本周复盘内容，现场修改“下周计划”并点击保存，验证同一自然周自动更新原记录而不产生重复记录；
5. **多用户数据隔离（侧边栏切换 User B）**：点击左下角 **`切换至用户 B`**，展示 User B 只能看到自己的英语备考数据，完全无法查看或篡改 User A 的竞赛与项目记录。

---

## 6. 工程文档索引

- 📄 [01-PRD.md](./docs/01-PRD.md) —— 产品需求文档
- 📄 [02-MVP.md](./docs/02-MVP.md) —— MVP 功能清单与业务规则规范
- 📄 [03-PAGES.md](./docs/03-PAGES.md) —— 页面结构、路由规划与响应式交互设计
- 📄 [04-DATABASE.md](./docs/04-DATABASE.md) —— 数据库 Schema、ER 图与 PostgreSQL RLS 安全策略设计
- 📄 [05-ACCEPTANCE.md](./docs/05-ACCEPTANCE.md) —— MVP 13 项量化验收标准与测试结果
- 📄 [06-DECISIONS.md](./docs/06-DECISIONS.md) —— 架构与技术决策记录（ADR-01 ~ ADR-07）
- 📄 [07-DEVLOG.md](./docs/07-DEVLOG.md) —— 项目开发与职业成长实践日志（比赛过程证据链）
