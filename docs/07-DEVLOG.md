# 07 - 项目开发与职业成长实践日志 (Development & Career Growth Log)

> **项目名称**：StudyFlow（学程）—— 大学生学习与项目管理平台  
> **目标岗位**：软件开发工程师  
> **对应赛事**：第四届全国大学生职业规划大赛（成长赛道）  
> **日志用途**：真实记录从需求分析、技术选型、分阶段编码、测试修复到验收交付的全过程，作为成长赛道**“学习实践行动（50分）”**与**“优化改进（20分）”**的核心过程证据。

---

## 1. 成长主线映射（竞赛背景 → 工程实践）

| 成长阶段 | 已有积累 / 关键行动 | 发现的差距与反思 | 下一步改进方向 |
| :--- | :--- | :--- | :--- |
| **第一阶段：算法与编程基础（2025—2026）** | 获第八届码蹄杯省赛银奖、第十七届蓝桥杯 C/C++ 山东赛区三等奖、传智杯初赛二等奖、2026 团体程序设计天梯赛省三等奖、校园程序设计赛二等奖 | 算法竞赛侧重单题逻辑与时间复杂度优化，缺乏数据库设计、前后端工程架构、权限隔离与产品交付经验 | 从写“单文件解题代码”转向开发“有真实用户场景的完整软件系统” |
| **第二阶段：初步个人项目尝试** | 独立开发 GitHub 余额查询工具小项目（WhaleBalance） | 工具功能较为单一，缺乏多模块数据关联、用户认证隔离与规范的软件工程文档 | 立项开发包含完整需求文档、数据库建模与验收标准的 Web 应用 `StudyFlow` |
| **第三阶段：StudyFlow 规范化软件工程实践（2026.10.30 起）** | 按照“需求分析 → 数据库与安全设计 → 模块化开发 → 13 项验收测试”推进 | 在利用 AI 工具提升编码效率的同时，牢牢掌握系统设计主导权、数据安全边界（RLS）与自动化测试验收能力 | 邀请同学实际试用，持续收集反馈迭代并融入职业规划大赛汇报展示 |

---

## 2. 分阶段开发过程与 Git 提交证据链

### 阶段一：需求分析、架构设计与验收标准冻结（Commit `c644f2a`）
- **主导完成的决策与设计**：
  1. 确立 `学习目标 (Goals) → 项目 (Projects) → 任务 (Tasks) → 学习总览 (Dashboard) → 每周复盘 (Weekly Reviews)` 五步核心闭环，冻结首版范围；
  2. 决定外键 `projects.goal_id` 与 `tasks.project_id` 采用 `ON DELETE SET NULL`，保护学生历史任务记录不被级联误删；
  3. 制定 PostgreSQL RLS 策略（含跨用户外键关联 `EXISTS` 校验）与 `AC-01` ~ `AC-13` 共 13 项量化验收标准。
- **阶段产出**：`docs/01-PRD.md` ~ `docs/06-DECISIONS.md`。

---

### 阶段二：工程底座初始化、SQL 迁移脚本与双模式数据层（Commit `4e3c9ab`）
- **开发内容**：
  1. 初始化 `React 19 + TypeScript + Vite 6 + Tailwind CSS v4` 项目骨架；
  2. 编写 [`supabase/migrations/001_init_studyflow.sql`](../supabase/migrations/001_init_studyflow.sql)，落地 4 张表结构、`updated_at` 触发器、索引与全套 RLS 策略；
  3. 实现 [`src/utils/dateUtils.ts`](../src/utils/dateUtils.ts)（自然周周一归一化、逾期判定、项目完成率精确计算）与 [`src/services/repository.ts`](../src/services/repository.ts) 双模式持久化引擎；
  4. 构建 [`src/services/seedData.ts`](../src/services/seedData.ts)，植入竞赛生主账号（User A）与隔离测试账号（User B）数据。

---

### 阶段三：响应式导航骨架与全部六大业务模块实现（Commits `c9c75c1`, `c6ea47b`）
- **开发内容**：
  1. 实现全局上下文 [`StudyFlowContext.tsx`](../src/context/StudyFlowContext.tsx) 与响应式导航骨架 [`AppLayout.tsx`](../src/components/AppLayout.tsx)（桌面端 256px 左侧栏 + `390px` 移动端顶部汉堡抽屉菜单）；
  2. 实现登录注册页 [`LoginPage.tsx`](../src/pages/LoginPage.tsx)、学习目标页 [`GoalsPage.tsx`](../src/pages/GoalsPage.tsx)、项目管理页 [`ProjectsPage.tsx`](../src/pages/ProjectsPage.tsx) 及项目详情页 [`ProjectDetailPage.tsx`](../src/pages/ProjectDetailPage.tsx)；
  3. 实现任务中心 [`TasksPage.tsx`](../src/pages/TasksPage.tsx)、学习总览 [`DashboardPage.tsx`](../src/pages/DashboardPage.tsx) 与每周复盘 [`ReviewsPage.tsx`](../src/pages/ReviewsPage.tsx)。
- **开发过程中发现并解决的技术问题（真实排错记录）**：
  - **问题 1（TypeScript 构建报错 `TS2339: Property 'env' does not exist on type 'ImportMeta'`）**：
    - **现象**：首次执行 `npm run build`（`tsc -b && vite build`）时，`src/services/repository.ts` 读取 `import.meta.env.VITE_SUPABASE_URL` 触发类型报错；
    - **原因分析**：手动创建的 `tsconfig.app.json` 未包含 Vite 客户端环境变量类型声明；
    - **解决方案**：新增 [`src/vite-env.d.ts`](../src/vite-env.d.ts) 引入 `/// <reference types="vite/client" />`，重新执行 `npm run build` 零错误通过。
  - **问题 2（自然周日期归一化边界处理）**：
    - **现象**：JavaScript `Date.prototype.getDay()` 中周日返回 `0`（而非 `7`），若直接用 `1 - dayOfWeek` 计算周一，周日会被错误推到下一周的周一；
    - **解决方案**：在 `normalizeToWeekMonday` 中显式处理 `dayOfWeek === 0 ? -6 : 1 - dayOfWeek`，并通过单元测试验证同一周任意日期均归一到同一个周一，确保 `AC-08` 周复盘唯一性。

---

### 阶段四：自动化验收测试与工程交付（当前阶段）
- **测试内容**：
  - 编写 [`src/__tests__/acceptance.test.ts`](../src/__tests__/acceptance.test.ts)，使用 Vitest 对未登录拦截（`AC-01`）、目标与项目删除保留下级记录（`AC-02/03/04`）、逾期判定（`AC-05`）、3/5 任务显示 `60%` 及无任务显示 `暂无任务`（`AC-06`）、同周复盘 Upsert 防重（`AC-08`）、User A 与 User B 跨用户访问及外键越权绑定拦截（`AC-10`）、空输入校验（`AC-11`）进行了自动化回归测试，**8 项核心测试全部 100% 通过**。
- **试用反馈与持续改进记录表**：

| 序号 | 反馈来源 | 发现的问题或建议 | 复现步骤 / 原因分析 | 改进措施与验证结果 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | 自我走查与答辩模拟 | 比赛答辩现场只有 3~5 分钟，现场手动注册两个账号来演示“多用户数据隔离 (`AC-10`)”耗时太长 | 常规登录流程需要先退出、再输入第二个邮箱密码登录 | 在登录页与侧边栏底部增加“一键切换：竞赛生主账号 A / 隔离测试账号 B”快捷切换器，1 秒即可对比演示多用户隔离效果 |
| 2 | 窄屏移动端测试 (`390px`) | 项目详情页快速添加任务表单在 `390px` 宽度下若強制单行排列会出现按钮挤压 | 桌面端 12 列网格在小屏下未折行 | 改为 `grid-cols-1 sm:grid-cols-12` 响应式栅格，移动端自动垂直堆叠并显示“添加任务”文字标签 |

---

### 阶段五：GitHub 交付与持续集成（2026-10-30）
- 核对 `master` 基线 `2b7e480` 的工作区与忽略规则：`node_modules/`、`dist/`、`.env` 未被追踪，`.env.example` 保留在版本控制中。
- 本地运行 `npm test -- --run`，8 项现有测试全部通过；运行 `npm run build`，类型检查和生产构建通过。
- 新增 [GitHub Actions 工作流](../.github/workflows/ci.yml)，使用 Node.js 24 执行 `npm ci`、自动化测试和生产构建；README 添加动态 CI 徽章。
- 根据锁定的 Supabase 客户端实际引擎要求，将 README 的最低 Node.js 版本修正为 22，推荐 24 LTS。
- 补充本次回归的验证范围，明确现有测试与浏览器、移动端、Supabase 云端验收的边界；未修改业务页面与 Swiss Style 设计系统。
- 安装审计发现 Vitest 开发依赖链有 3 项漏洞，修复建议涉及跨主版本升级；记录在验收文档中，留待独立迁移与回归验证。
