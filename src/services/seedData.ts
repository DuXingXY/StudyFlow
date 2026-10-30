import type { Goal, Project, Task, UserProfile, WeeklyReview } from '../types/models';
import { addDays, getLocalDateString, normalizeToWeekMonday } from '../utils/dateUtils';

export const DEMO_USER_A: UserProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'coder@studyflow.edu.cn',
  displayName: '竞赛生主账号 (User A)',
  roleLabel: '目标职业：软件开发工程师',
};

export const DEMO_USER_B: UserProfile = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'tester_b@studyflow.edu.cn',
  displayName: '隔离测试账号 (User B)',
  roleLabel: '用于验证 AC-10 跨用户数据隔离',
};

export interface SeedDataset {
  users: Array<UserProfile & { passwordHash: string }>;
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  weekly_reviews: WeeklyReview[];
}

export function buildInitialSeedDataset(todayStr: string = getLocalDateString()): SeedDataset {
  const nowIso = new Date().toISOString();
  const yesterdayStr = addDays(todayStr, -1);
  const twoDaysAgoStr = addDays(todayStr, -2);
  const tomorrowStr = addDays(todayStr, 1);
  const nextWeekStr = addDays(todayStr, 7);
  const inTwoWeeksStr = addDays(todayStr, 14);
  const inOneMonthStr = addDays(todayStr, 30);

  const currentMonday = normalizeToWeekMonday(todayStr);
  const lastWeekMonday = addDays(currentMonday, -7);

  // User A Goals
  const goalEngineeringId = 'a0000001-0000-4000-8000-000000000001';
  const goalContestId = 'a0000001-0000-4000-8000-000000000002';
  const goalCourseId = 'a0000001-0000-4000-8000-000000000003';

  // User B Goal
  const goalUserBId = 'b0000001-0000-4000-8000-000000000001';

  const goals: Goal[] = [
    {
      id: goalEngineeringId,
      user_id: DEMO_USER_A.id,
      title: '完成从程序设计竞赛向“软件开发工程师”的工程化转型',
      description:
        '在已有蓝桥杯、码蹄杯等算法竞赛基础上，补齐需求分析、PostgreSQL 数据库设计、权限安全（RLS）与现代前端工程开发能力，交付完整可演示的代表性软件项目。',
      target_date: inOneMonthStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: goalContestId,
      user_id: DEMO_USER_A.id,
      title: '算法竞赛专题复盘与数据结构知识体系沉淀',
      description:
        '系统复盘第八届码蹄杯省赛银奖、第十七届蓝桥杯省三、传智杯及团体天梯赛中的高频算法考点（动态规划、图论、树状数组），将赛场解题思维转化为扎实的代码基本功。',
      target_date: inTwoWeeksStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: goalCourseId,
      user_id: DEMO_USER_A.id,
      title: '完成大二上学期核心专业课与 Git 规范化实践',
      description: '掌握数据库系统原理、软件工程规范与 Git 分支提交工作流。',
      target_date: inOneMonthStr,
      status: 'completed',
      created_at: nowIso,
      updated_at: nowIso,
    },
    // User B isolated goal
    {
      id: goalUserBId,
      user_id: DEMO_USER_B.id,
      title: 'User B 的独立英语四六级备考目标',
      description: '用于验证多用户隔离（AC-10）：User A 无法查看或修改此记录。',
      target_date: inOneMonthStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  // User A Projects
  const projStudyFlowId = 'a0000002-0000-4000-8000-000000000001';
  const projWhaleBalanceId = 'a0000002-0000-4000-8000-000000000002';
  const projAlgoReviewId = 'a0000002-0000-4000-8000-000000000003';
  const projEmptyDemoId = 'a0000002-0000-4000-8000-000000000004';

  // User B Project
  const projUserBId = 'b0000002-0000-4000-8000-000000000001';

  const projects: Project[] = [
    {
      id: projStudyFlowId,
      user_id: DEMO_USER_A.id,
      goal_id: goalEngineeringId,
      name: 'StudyFlow 大学生学习与项目管理平台 MVP',
      description:
        '使用 React + TypeScript + Tailwind CSS + Supabase (PostgreSQL & RLS) 开发的个人学习与项目管理 Web 系统，包含 5 项核心子任务（当前完成 3 项，进度 60%，对应 AC-06 验收）。',
      due_date: inTwoWeeksStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: projWhaleBalanceId,
      user_id: DEMO_USER_A.id,
      goal_id: goalEngineeringId,
      name: 'WhaleBalance 余额查询工具工程化重构',
      description:
        '围绕 GitHub 已有的个人余额查询小工具，补充输入校验、异常处理、配置管理与规范 README 文档，体现从简单脚本到工程化软件的迭代改进。',
      due_date: nextWeekStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: projAlgoReviewId,
      user_id: DEMO_USER_A.id,
      goal_id: goalContestId,
      name: '码蹄杯与蓝桥杯高频算法错题复盘集',
      description:
        '整理省赛银奖与蓝桥杯备赛过程中的动态规划、最短路及贪心典型错题，形成结构化题解笔记。',
      due_date: nextWeekStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: projEmptyDemoId,
      user_id: DEMO_USER_A.id,
      goal_id: null,
      name: '个人技术博客静态站点迁移（待启动规划）',
      description:
        '独立项目示例（尚未拆分子任务，用于直观验证 AC-06 无任务项目显示“暂无任务”）。',
      due_date: inOneMonthStr,
      status: 'on_hold',
      created_at: nowIso,
      updated_at: nowIso,
    },
    // User B isolated project
    {
      id: projUserBId,
      user_id: DEMO_USER_B.id,
      goal_id: goalUserBId,
      name: 'User B 的专属阅读理解训练计划',
      description: 'User B 私有项目，User A 无法访问或把任务绑定到此项目。',
      due_date: nextWeekStr,
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  // User A Tasks
  // Note: projStudyFlowId has EXACTLY 5 tasks, 3 of which are 'done' -> 60% completion (AC-06!)
  const tasks: Task[] = [
    // --- Project 1: StudyFlow MVP (5 tasks: 3 done, 1 doing, 1 todo -> 60%) ---
    {
      id: 'a0000003-0000-4000-8000-000000000001',
      user_id: DEMO_USER_A.id,
      project_id: projStudyFlowId,
      title: '完成 StudyFlow 第一阶段需求分析 (PRD) 与 13 项验收标准设计',
      status: 'done',
      priority: 'high',
      planned_date: twoDaysAgoStr,
      due_date: yesterdayStr,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000002',
      user_id: DEMO_USER_A.id,
      project_id: projStudyFlowId,
      title: '设计 PostgreSQL 四张核心表结构与 Row Level Security (RLS) 策略',
      status: 'done',
      priority: 'high',
      planned_date: yesterdayStr,
      due_date: todayStr,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000003',
      user_id: DEMO_USER_A.id,
      project_id: projStudyFlowId,
      title: '搭建 React + TypeScript + Tailwind CSS 响应式导航骨架（适配 390px）',
      status: 'done',
      priority: 'medium',
      planned_date: todayStr,
      due_date: todayStr,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000004',
      user_id: DEMO_USER_A.id,
      project_id: projStudyFlowId,
      title: '联调目标、项目详情、任务流转与周复盘 Upsert 防重逻辑',
      status: 'doing',
      priority: 'high',
      planned_date: todayStr,
      due_date: tomorrowStr,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000005',
      user_id: DEMO_USER_A.id,
      project_id: projStudyFlowId,
      title: '邀请 2~3 位同学试用 StudyFlow 并根据反馈完善异常处理与演示材料',
      status: 'todo',
      priority: 'medium',
      planned_date: tomorrowStr,
      due_date: nextWeekStr,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },

    // --- Project 2: WhaleBalance 升级 (2 tasks: 1 done, 1 overdue todo) ---
    {
      id: 'a0000003-0000-4000-8000-000000000006',
      user_id: DEMO_USER_A.id,
      project_id: projWhaleBalanceId,
      title: '重构余额查询接口的网络超时重试与错误提示模块',
      status: 'done',
      priority: 'medium',
      planned_date: twoDaysAgoStr,
      due_date: yesterdayStr,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000007',
      user_id: DEMO_USER_A.id,
      project_id: projWhaleBalanceId,
      title: '补充 WhaleBalance 项目架构说明、运行截图与单元测试用例',
      status: 'todo',
      priority: 'high',
      planned_date: yesterdayStr,
      due_date: yesterdayStr, // OVERDUE task for AC-05 demonstration!
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },

    // --- Project 3: 算法竞赛复盘 (2 tasks: 1 done, 1 today todo) ---
    {
      id: 'a0000003-0000-4000-8000-000000000008',
      user_id: DEMO_USER_A.id,
      project_id: projAlgoReviewId,
      title: '复盘第八届码蹄杯省赛银奖压轴图论题与状态压缩 DP 解法',
      status: 'done',
      priority: 'medium',
      planned_date: twoDaysAgoStr,
      due_date: yesterdayStr,
      completed_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000003-0000-4000-8000-000000000009',
      user_id: DEMO_USER_A.id,
      project_id: projAlgoReviewId,
      title: '整理团体程序设计天梯赛与蓝桥杯 C/C++ B组高频数据结构模板',
      status: 'todo',
      priority: 'medium',
      planned_date: todayStr,
      due_date: tomorrowStr,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },

    // --- Independent Task (project_id = null) ---
    {
      id: 'a0000003-0000-4000-8000-000000000010',
      user_id: DEMO_USER_A.id,
      project_id: null,
      title: '撰写全国大学生职业规划大赛成长赛道生涯发展报告初稿',
      status: 'todo',
      priority: 'high',
      planned_date: todayStr,
      due_date: todayStr,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },

    // --- User B Isolated Task ---
    {
      id: 'b0000003-0000-4000-8000-000000000001',
      user_id: DEMO_USER_B.id,
      project_id: projUserBId,
      title: 'User B 的私有任务：完成 2 套六级真题阅读理解',
      status: 'todo',
      priority: 'medium',
      planned_date: todayStr,
      due_date: tomorrowStr,
      completed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  const weekly_reviews: WeeklyReview[] = [
    {
      id: 'a0000004-0000-4000-8000-000000000001',
      user_id: DEMO_USER_A.id,
      week_start: currentMonday,
      achievements:
        '1. 完成了个人竞赛成果（码蹄杯省赛银奖、蓝桥杯省三、天梯赛等 5 项荣誉）与软件开发工程师岗位要求的差距分析；\n2. 独立完成了 StudyFlow 平台的第一阶段 PRD、数据库 RLS 安全设计与 13 项量化验收标准；\n3. 推进了 StudyFlow 核心模块开发，实现从“单题算法训练”向“完整 Web 软件工程”的跨越。',
      problems:
        '1. 以往写 C/C++ 竞赛题习惯单文件编写，初次设计多表外键（ON DELETE SET NULL）与行级安全策略（RLS）时考虑不够周全；\n2. WhaleBalance 项目的文档整理任务出现 1 天逾期，说明多任务并行时的时间预估仍需精细化。',
      next_plan:
        '1. 完成 StudyFlow 全部 AC-01 ~ AC-13 验收测试并修复潜在边界问题；\n2. 清空 WhaleBalance 逾期文档任务；\n3. 邀请 2~3 位同学实际试用系统并收集改进反馈，充实职业规划大赛实践材料。',
      created_at: nowIso,
      updated_at: nowIso,
    },
    {
      id: 'a0000004-0000-4000-8000-000000000002',
      user_id: DEMO_USER_A.id,
      week_start: lastWeekMonday,
      achievements:
        '1. 完成了 WhaleBalance 余额查询工具的接口异常处理重构；\n2. 复盘了码蹄杯省赛与传智杯中的图论与动态规划错题。',
      problems:
        '发现自己的 GitHub 仓库缺少能够体现完整前后端数据流转与用户权限隔离的工程级项目，与企业招聘软件开发工程师的要求存在差距。',
      next_plan:
        '围绕大学生真实学习痛点立项开发 StudyFlow 学习与项目管理平台，严格按照需求设计、数据库建模、模块化开发与验收测试流程推进。',
      created_at: nowIso,
      updated_at: nowIso,
    },
  ];

  return {
    users: [
      { ...DEMO_USER_A, passwordHash: '123456' },
      { ...DEMO_USER_B, passwordHash: '123456' },
    ],
    goals,
    projects,
    tasks,
    weekly_reviews,
  };
}
