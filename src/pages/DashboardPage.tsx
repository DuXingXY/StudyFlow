import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  LayoutDashboard,
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
      overallCompletionLabel: overallProgress.label,
      completedTasksCount: overallProgress.completedTasks,
      totalTasksCount: overallProgress.totalTasks,
    };
  }, [tasks, projects, todayStr]);

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>学习总览 (Dashboard)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            你好，{user?.displayName || user?.email} · 今天是 {todayStr}，所有统计与进度均实时取自持久化数据库（AC-07）。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>管理今日任务</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/reviews"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <BookOpenCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>填写本周复盘</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>今日待办</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.todayPendingCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            计划今日执行或今日截止
          </div>
        </div>

        <div
          className={`rounded-2xl border p-4 sm:p-5 shadow-2xs ${
            stats.overdueCount > 0
              ? 'bg-red-50/70 border-red-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>逾期未完成</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-400'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-2xl sm:text-3xl font-extrabold ${
              stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {stats.overdueCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {stats.overdueCount > 0 ? '需优先清理逾期任务' : '当前无逾期积压'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>进行中项目</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {stats.activeProjectCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            关联 {goals.filter((g) => g.status === 'active').length} 个进行中目标
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>总任务完成率</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {stats.overallCompletionLabel}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            已完成 {stats.completedTasksCount} / {stats.totalTasksCount} 项任务
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Tasks & Overdue Alerts */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                今日聚焦与逾期督办
              </h2>
              <p className="text-xs text-slate-500">
                点击左侧状态图标可直接完成任务，实时联动右侧项目进度条
              </p>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
            >
              查看全部 →
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-700">
                今日任务已全部清空！
              </div>
              <p className="text-xs text-slate-400">
                可以前往“任务中心”规划新的学习任务或进入“每周复盘”总结收获。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {focusTasks.map((task) => {
                const overdue = isTaskOverdue(task, todayStr);
                const proj = projects.find((p) => p.id === task.project_id);
                return (
                  <div
                    key={task.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateTask(task.id, {
                            status: task.status === 'done' ? 'todo' : 'done',
                          })
                        }
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                        aria-label={`切换任务 ${task.title} 状态`}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : task.status === 'doing' ? (
                          <Clock className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div
                          className={`text-sm font-medium break-words ${
                            task.status === 'done'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {proj ? (
                            <Link
                              to={`/projects/${proj.id}`}
                              className="text-indigo-600 font-medium hover:underline truncate max-w-[180px]"
                            >
                              {proj.name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">独立任务</span>
                          )}

                          {task.due_date && (
                            <span
                              className={
                                overdue
                                  ? 'text-red-600 font-semibold'
                                  : 'text-slate-500'
                              }
                            >
                              截止：{task.due_date}
                            </span>
                          )}

                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              已逾期
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700'
                          : task.status === 'doing'
                          ? 'bg-indigo-50 text-indigo-700'
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

        {/* Right: Active Projects Progress & Recent Review */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                进行中项目进度
              </h2>
              <Link
                to="/projects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                全部项目 →
              </Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                当前没有进行中的项目，可前往“我的项目”新建。
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
                      className="block p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <Target className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">
                              {goal ? goal.title : '独立项目'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-indigo-600 shrink-0">
                          {progress.label}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            progress.percentage === 100
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progress.percentage ?? 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          已完成 {progress.completedTasks} / {progress.totalTasks}{' '}
                          项任务
                        </span>
                        {proj.due_date && <span>截止：{proj.due_date}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Latest Weekly Review Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                最近每周复盘摘要
              </h2>
              <Link
                to="/reviews"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                去复盘 →
              </Link>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">
                尚未记录周复盘，建议每周末总结成果、问题与下周计划。
              </p>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-indigo-700">
                  周期起点（周一）：{reviews[0].week_start}
                </div>
                <div className="text-slate-700 line-clamp-2 whitespace-pre-line">
                  <span className="font-semibold text-slate-900">本周成果：</span>
                  {reviews[0].achievements}
                </div>
                <div className="text-slate-600 line-clamp-2 whitespace-pre-line">
                  <span className="font-semibold text-slate-900">下周计划：</span>
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
