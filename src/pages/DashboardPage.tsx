import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
  isTaskTodayOrOverdue,
} from '../utils/dateUtils';

const priorityPill: Record<
  'high' | 'medium' | 'low',
  { label: string; cls: string }
> = {
  high: { label: '高优', cls: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: '中优', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  low: { label: '低优', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const DashboardPage: React.FC = () => {
  const { user, goals, projects, tasks, reviews, updateTask } = useStudyFlow();
  const todayStr = getLocalDateString();

  const stats = useMemo(() => {
    const todayPendingTasks = tasks.filter(
      (t) =>
        t.status !== 'done' &&
        (t.planned_date === todayStr || t.due_date === todayStr)
    );
    const overdueTasks = tasks.filter((t) => isTaskOverdue(t, todayStr));
    const activeProjects = projects.filter((p) => p.status === 'active');
    const overallProgress = calculateProjectProgress(tasks);

    return {
      todayPendingCount: todayPendingTasks.length,
      overdueCount: overdueTasks.length,
      activeProjectCount: activeProjects.length,
      activeGoalCount: goals.filter((g) => g.status === 'active').length,
      overallPercentage: overallProgress.percentage ?? 0,
      overallCompletionLabel: overallProgress.label,
      completedTasksCount: overallProgress.completedTasks,
      totalTasksCount: overallProgress.totalTasks,
    };
  }, [tasks, projects, goals, todayStr]);

  const focusTasks = useMemo(() => {
    return tasks
      .filter((t) => isTaskTodayOrOverdue(t, todayStr))
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        const aOver = isTaskOverdue(a, todayStr) ? 1 : 0;
        const bOver = isTaskOverdue(b, todayStr) ? 1 : 0;
        return bOver - aOver;
      });
  }, [tasks, todayStr]);

  const activeProjects = useMemo(
    () => projects.filter((p) => p.status === 'active'),
    [projects]
  );

  // SVG Ring calculation
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (stats.overallPercentage / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      {/* Top Hero Bento Card: Greeting + 5-Step Closed-Loop Pipeline + Circular Progress Ring */}
      <div className="rounded-3xl bg-mesh-teal text-white p-6 sm:p-8 shadow-xl border border-teal-800/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-teal-200">
              <Award className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
              <span>{user?.roleLabel || '个人工程成长空间'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              你好，{user?.displayName || user?.email}
            </h1>

            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed">
              这里是你的学习与工程项目总览中枢。每一项子任务的状态变更都会实时驱动项目完成率与周期复盘数据更新（AC-07）。
            </p>

            {/* 5-Step Closed Loop Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              {[
                { step: '01 目标制定', to: '/goals', count: goals.length },
                { step: '02 项目规划', to: '/projects', count: projects.length },
                { step: '03 任务执行', to: '/tasks', count: tasks.length },
                {
                  step: '04 进度统计',
                  to: '/dashboard',
                  count: stats.overallCompletionLabel,
                },
                { step: '05 周期复盘', to: '/reviews', count: `${reviews.length}周` },
              ].map((item, idx) => (
                <React.Fragment key={item.step}>
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-semibold text-white transition-colors"
                  >
                    <span>{item.step}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-teal-400/25 text-teal-200 text-[11px] font-bold">
                      {item.count}
                    </span>
                  </Link>
                  {idx < 4 && (
                    <span className="text-teal-400/60 hidden sm:inline">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Circular Progress Gauge + Quick CTAs */}
          <div className="flex items-center gap-5 bg-white/8 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg
                className="w-24 h-24 -rotate-90"
                viewBox="0 0 96 96"
                aria-hidden="true"
              >
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={ringRadius}
                  stroke="#2DD4BF"
                  strokeWidth="8"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringStrokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white leading-none">
                  {stats.overallCompletionLabel}
                </span>
                <span className="text-[10px] text-teal-200/80 mt-1">
                  总完成度
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="text-xs font-bold text-teal-200">
                  全局执行进度
                </div>
                <div className="text-sm font-extrabold text-white">
                  已完成 {stats.completedTasksCount} / {stats.totalTasksCount} 项
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/tasks"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <span>管理任务</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
                <Link
                  to="/reviews"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors"
                >
                  <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>周复盘</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Bento Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Today Pending */}
        <div className="bento-card bento-card-interactive p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">今日待办任务</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/70 flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.todayPendingCount}
            </span>
            <span className="text-xs font-semibold text-teal-700">项待执行</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            计划日期或截止日期为 {todayStr}
          </p>
        </div>

        {/* Tile 2: Overdue Alert */}
        <div
          className={`bento-card bento-card-interactive p-5 flex flex-col justify-between ${
            stats.overdueCount > 0
              ? 'bg-red-50/60 border-red-200'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">逾期未完成</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                stats.overdueCount > 0
                  ? 'bg-red-100 text-red-700 border-red-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              {stats.overdueCount}
            </span>
            <span
              className={`text-xs font-bold ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {stats.overdueCount > 0 ? '需优先清理 (AC-05)' : '无逾期积压'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            截止日期早于今日且尚未完成
          </p>
        </div>

        {/* Tile 3: Active Projects */}
        <div className="bento-card bento-card-interactive p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">进行中项目</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 border border-orange-200/70 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.activeProjectCount}
            </span>
            <span className="text-xs font-semibold text-orange-700">
              个活跃项目
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            支撑 {stats.activeGoalCount} 个进行中的长期学习目标
          </p>
        </div>

        {/* Tile 4: Overall Completion Rate */}
        <div className="bento-card bento-card-interactive p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">总任务完成率</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-700">
              {stats.overallCompletionLabel}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({stats.completedTasksCount}/{stats.totalTasksCount})
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            实时汇总全部项目与日常独立任务
          </p>
        </div>
      </div>

      {/* Main 12-Column Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Focus & Overdue Action List */}
        <div className="lg:col-span-7 bento-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" aria-hidden="true" />
                <span>今日聚焦与逾期督办</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                点击任务左侧复选框可直接完成任务，右侧项目完成率将即时同步重算
              </p>
            </div>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200/70 shrink-0"
            >
              <span>全部任务</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-sm font-bold text-slate-700">
                今日与逾期任务已全部清空！
              </div>
              <p className="text-xs text-slate-400">
                你可以前往“任务中心”规划新的学习任务，或进入“每周复盘”记录本周收获。
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {focusTasks.map((task) => {
                const overdue = isTaskOverdue(task, todayStr);
                const proj = projects.find((p) => p.id === task.project_id);
                const pri = priorityPill[task.priority];

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      overdue
                        ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                        : task.status === 'done'
                        ? 'bg-slate-50/70 border-slate-200/70 opacity-75'
                        : 'bg-white border-slate-200/90 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            status: task.status === 'done' ? 'todo' : 'done',
                          })
                        }
                        className="mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-teal-600 shrink-0 cursor-pointer transition-colors"
                        aria-label={`切换任务 ${task.title} 完成状态`}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2
                            className="w-5 h-5 text-emerald-600"
                            aria-hidden="true"
                          />
                        ) : task.status === 'doing' ? (
                          <Clock
                            className="w-5 h-5 text-teal-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <div
                          className={`text-sm font-bold leading-snug break-words ${
                            task.status === 'done'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-md border font-bold ${pri.cls}`}
                          >
                            {pri.label}
                          </span>

                          {proj ? (
                            <Link
                              to={`/projects/${proj.id}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60 font-semibold hover:bg-teal-100 truncate max-w-[200px]"
                            >
                              <FolderKanban
                                className="w-3 h-3 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">{proj.name}</span>
                            </Link>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                              独立任务
                            </span>
                          )}

                          {task.due_date && (
                            <span
                              className={
                                overdue
                                  ? 'text-red-700 font-bold'
                                  : 'text-slate-500 font-medium'
                              }
                            >
                              截止：{task.due_date}
                            </span>
                          )}

                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-bold">
                              <AlertTriangle
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                              已逾期
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'doing'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.status === 'done'
                        ? '已完成'
                        : task.status === 'doing'
                        ? '进行中'
                        : '待办'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Active Projects Progress & Weekly Review Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Projects Progress Bento Card */}
          <div className="bento-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  进行中项目进度 (AC-06)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  按已完成子任务数 / 总任务数实时计算
                </p>
              </div>
              <Link
                to="/projects"
                className="text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                管理项目 →
              </Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                当前没有进行中的项目，可前往“我的项目”创建。
              </div>
            ) : (
              <div className="space-y-3.5">
                {activeProjects.map((proj) => {
                  const projTasks = tasks.filter(
                    (t) => t.project_id === proj.id
                  );
                  const progress = calculateProjectProgress(projTasks);
                  const goal = goals.find((g) => g.id === proj.goal_id);

                  return (
                    <Link
                      key={proj.id}
                      to={`/projects/${proj.id}`}
                      className="block p-4 rounded-2xl border border-slate-200/90 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30 transition-all space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-slate-900 group-hover:text-teal-800 truncate flex items-center gap-1">
                            <span className="truncate">{proj.name}</span>
                            <ArrowUpRight
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Target
                              className="w-3 h-3 text-teal-600 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {goal ? goal.title : '独立项目'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl bg-teal-700 text-white text-xs font-black shrink-0">
                          {progress.label}
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            progress.percentage === 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-teal-600 to-teal-400'
                          }`}
                          style={{ width: `${progress.percentage ?? 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>
                          已完成 {progress.completedTasks} / {progress.totalTasks}{' '}
                          个任务
                        </span>
                        {proj.due_date && <span>截止：{proj.due_date}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Review Snapshot Bento Card */}
          <div className="bento-card p-6 space-y-3.5 bg-gradient-to-br from-white to-teal-50/40">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpenCheck
                  className="w-4 h-4 text-teal-700"
                  aria-hidden="true"
                />
                <span>最新自然周复盘精粹</span>
              </h2>
              <Link
                to="/reviews"
                className="text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                去编辑 →
              </Link>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                尚未记录周复盘，建议每周末复盘成果、问题与下周计划。
              </p>
            ) : (
              <div className="p-4 rounded-2xl bg-white border border-teal-200/70 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                    周一：{reviews[0].week_start}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    同周唯一归档 (AC-08)
                  </span>
                </div>
                <div className="text-slate-700 line-clamp-2 whitespace-pre-line leading-relaxed">
                  <strong className="text-slate-900">本周成果：</strong>
                  {reviews[0].achievements}
                </div>
                <div className="text-slate-600 line-clamp-2 whitespace-pre-line leading-relaxed">
                  <strong className="text-slate-900">下周计划：</strong>
                  {reviews[0].next_plan}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
