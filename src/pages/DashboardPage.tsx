import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Target,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
  isTaskTodayOrOverdue,
} from '../utils/dateUtils';

const priorityTag: Record<
  'high' | 'medium' | 'low',
  { label: string; cls: string }
> = {
  high: {
    label: 'P1 / 高优',
    cls: 'bg-[#E61919] text-white border-[#0A0A0A]',
  },
  medium: {
    label: 'P2 / 中优',
    cls: 'bg-[#0A0A0A] text-white border-[#0A0A0A]',
  },
  low: {
    label: 'P3 / 低优',
    cls: 'bg-[#F6F5F2] text-[#525252] border-[#0A0A0A]',
  },
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

  return (
    <div className="space-y-6">
      {/* Swiss Architectural Header Frame */}
      <div className="bg-white border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
        {/* Top Metadata Strip */}
        <div className="px-5 py-2.5 bg-[#0A0A0A] text-white flex flex-wrap items-center justify-between gap-2 font-mono-swiss text-xs font-bold">
          <span>01 // EXECUTIVE OVERVIEW & METRICS</span>
          <span>{user?.roleLabel || 'CAREER TRACK: SOFTWARE ENGINEER'}</span>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase leading-tight">
              {user?.displayName || user?.email}
            </h1>
            <p className="text-xs sm:text-sm text-[#525252] max-w-2xl leading-relaxed font-medium">
              全部指标实时聚合自底层持久化数据库（AC-07）。通过下方五步闭环矩阵，将长期学习目标转化为每日可量化验证的工程进度。
            </p>

            {/* 5-Step Swiss Matrix Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-5 border border-[#0A0A0A] bg-[#F6F5F2] divide-y sm:divide-y-0 sm:divide-x divide-[#0A0A0A]">
              {[
                { idx: '01', name: '目标制定', to: '/goals', val: goals.length },
                {
                  idx: '02',
                  name: '项目规划',
                  to: '/projects',
                  val: projects.length,
                },
                { idx: '03', name: '任务执行', to: '/tasks', val: tasks.length },
                {
                  idx: '04',
                  name: '总完成率',
                  to: '/dashboard',
                  val: stats.overallCompletionLabel,
                },
                {
                  idx: '05',
                  name: '周期复盘',
                  to: '/reviews',
                  val: `${reviews.length}W`,
                },
              ].map((step) => (
                <Link
                  key={step.idx}
                  to={step.to}
                  className="p-2.5 hover:bg-[#0A0A0A] hover:text-white transition-colors group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between font-mono-swiss text-[10px] font-bold text-[#E61919] group-hover:text-white">
                    <span>{step.idx}</span>
                    <span>→</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className="text-xs font-extrabold">{step.name}</span>
                    <span className="font-mono-swiss text-xs font-black">
                      {step.val}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Geometric Completion Block */}
          <div className="lg:col-span-4 border-2 border-[#0A0A0A] bg-[#F6F5F2] p-5 space-y-3">
            <div className="flex items-center justify-between font-mono-swiss text-xs font-bold">
              <span>GLOBAL PROGRESS</span>
              <span className="px-1.5 py-0.5 bg-[#E61919] text-white">
                LIVE
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono-swiss text-4xl sm:text-5xl font-black tracking-tighter">
                {stats.overallCompletionLabel}
              </span>
              <span className="font-mono-swiss text-xs font-bold text-[#525252]">
                {stats.completedTasksCount} / {stats.totalTasksCount} DONE
              </span>
            </div>
            <div className="w-full h-3 border border-[#0A0A0A] bg-white">
              <div
                className="h-full bg-[#0A0A0A] transition-all duration-200"
                style={{ width: `${stats.overallPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/tasks"
                className="swiss-btn-accent py-2 px-3 text-xs flex items-center justify-center gap-1"
              >
                <span>任务中心</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              <Link
                to="/reviews"
                className="swiss-btn-outline py-2 px-3 text-xs flex items-center justify-center gap-1"
              >
                <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>周复盘</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Swiss Grid Cells (Shared Hairline Borders) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border-2 border-[#0A0A0A] divide-y lg:divide-y-0 divide-x divide-[#0A0A0A]">
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between font-mono-swiss text-[11px] font-bold text-[#525252]">
            <span>KPI.01 // TODAY</span>
            <Clock className="w-4 h-4 text-[#0A0A0A]" aria-hidden="true" />
          </div>
          <div className="font-mono-swiss text-3xl sm:text-4xl font-black tracking-tighter">
            {String(stats.todayPendingCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold">今日待办任务</div>
          <p className="text-[11px] text-[#525252]">
            计划今日执行或今日截止
          </p>
        </div>

        <div
          className={`p-5 space-y-2 ${
            stats.overdueCount > 0 ? 'bg-[#E61919] text-white' : ''
          }`}
        >
          <div
            className={`flex items-center justify-between font-mono-swiss text-[11px] font-bold ${
              stats.overdueCount > 0 ? 'text-white' : 'text-[#525252]'
            }`}
          >
            <span>KPI.02 // OVERDUE</span>
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="font-mono-swiss text-3xl sm:text-4xl font-black tracking-tighter">
            {String(stats.overdueCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold">逾期未完成提醒 (AC-05)</div>
          <p
            className={`text-[11px] ${
              stats.overdueCount > 0 ? 'text-white/90 font-semibold' : 'text-[#525252]'
            }`}
          >
            {stats.overdueCount > 0 ? '存在逾期任务需立即处理' : '当前无逾期积压'}
          </p>
        </div>

        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between font-mono-swiss text-[11px] font-bold text-[#525252]">
            <span>KPI.03 // PROJECTS</span>
            <FolderKanban className="w-4 h-4 text-[#0A0A0A]" aria-hidden="true" />
          </div>
          <div className="font-mono-swiss text-3xl sm:text-4xl font-black tracking-tighter">
            {String(stats.activeProjectCount).padStart(2, '0')}
          </div>
          <div className="text-xs font-bold">进行中项目数</div>
          <p className="text-[11px] text-[#525252]">
            关联 {stats.activeGoalCount} 个进行中长期目标
          </p>
        </div>

        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between font-mono-swiss text-[11px] font-bold text-[#525252]">
            <span>KPI.04 // COMPLETION</span>
            <Target className="w-4 h-4 text-[#E61919]" aria-hidden="true" />
          </div>
          <div className="font-mono-swiss text-3xl sm:text-4xl font-black tracking-tighter">
            {stats.overallCompletionLabel}
          </div>
          <div className="text-xs font-bold">总任务完成率</div>
          <p className="text-[11px] text-[#525252]">
            已完成 {stats.completedTasksCount} / 共 {stats.totalTasksCount} 项
          </p>
        </div>
      </div>

      {/* Main 12-Column Swiss Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Focus & Overdue Tasks */}
        <div className="lg:col-span-7 bg-white border-2 border-[#0A0A0A]">
          <div className="px-5 py-3.5 border-b-2 border-[#0A0A0A] bg-[#F6F5F2] flex items-center justify-between">
            <div>
              <span className="font-mono-swiss text-[11px] font-bold text-[#E61919]">
                SECTION 01.A // EXECUTION QUEUE
              </span>
              <h2 className="text-base font-black uppercase tracking-tight">
                今日聚焦与逾期督办
              </h2>
            </div>
            <Link
              to="/tasks"
              className="swiss-btn-outline px-3 py-1.5 text-xs font-mono-swiss inline-flex items-center gap-1"
            >
              <span>ALL TASKS</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {focusTasks.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="text-sm font-extrabold">
                今日与逾期任务已全部清空
              </div>
              <p className="text-xs text-[#525252]">
                可前往“任务中心”规划新任务，或进入“每周复盘”归档本周总结。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#0A0A0A]">
              {focusTasks.map((task) => {
                const overdue = isTaskOverdue(task, todayStr);
                const proj = projects.find((p) => p.id === task.project_id);
                const pri = priorityTag[task.priority];

                return (
                  <div
                    key={task.id}
                    className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                      overdue
                        ? 'bg-red-50/70'
                        : task.status === 'done'
                        ? 'bg-[#F6F5F2] opacity-65'
                        : 'bg-white hover:bg-[#F6F5F2]'
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
                        className="mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white shrink-0 cursor-pointer transition-colors"
                        aria-label={`切换任务 ${task.title} 完成状态`}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        ) : task.status === 'doing' ? (
                          <Clock className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Circle className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <div
                          className={`text-sm font-extrabold leading-snug break-words ${
                            task.status === 'done'
                              ? 'line-through text-[#525252]'
                              : 'text-[#0A0A0A]'
                          }`}
                        >
                          {task.title}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 font-mono-swiss text-[11px]">
                          <span
                            className={`px-1.5 py-0.5 border font-bold ${pri.cls}`}
                          >
                            {pri.label}
                          </span>

                          {proj ? (
                            <Link
                              to={`/projects/${proj.id}`}
                              className="px-1.5 py-0.5 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white font-bold truncate max-w-[200px]"
                            >
                              {proj.name}
                            </Link>
                          ) : (
                            <span className="px-1.5 py-0.5 border border-[#D4D4D0] text-[#525252]">
                              独立任务
                            </span>
                          )}

                          {task.due_date && (
                            <span
                              className={
                                overdue
                                  ? 'text-[#E61919] font-extrabold'
                                  : 'text-[#525252]'
                              }
                            >
                              DUE: {task.due_date}
                            </span>
                          )}

                          {overdue && (
                            <span className="px-1.5 py-0.5 bg-[#E61919] text-white font-extrabold">
                              ! 已逾期
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono-swiss text-[10px] font-bold uppercase px-2 py-1 border border-[#0A0A0A] bg-white shrink-0">
                      {task.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Active Projects Progress & Review */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Projects Swiss Box */}
          <div className="bg-white border-2 border-[#0A0A0A]">
            <div className="px-5 py-3.5 border-b-2 border-[#0A0A0A] bg-[#F6F5F2] flex items-center justify-between">
              <div>
                <span className="font-mono-swiss text-[11px] font-bold text-[#E61919]">
                  SECTION 01.B // MILESTONES (AC-06)
                </span>
                <h2 className="text-base font-black uppercase tracking-tight">
                  进行中项目完成率
                </h2>
              </div>
              <Link
                to="/projects"
                className="font-mono-swiss text-xs font-bold underline hover:text-[#E61919]"
              >
                VIEW ALL →
              </Link>
            </div>

            {activeProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#525252]">
                当前没有进行中的项目
              </div>
            ) : (
              <div className="divide-y divide-[#0A0A0A]">
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
                      className="block p-4 sm:p-5 hover:bg-[#F6F5F2] transition-colors space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold group-hover:text-[#E61919] truncate flex items-center gap-1">
                            <span className="truncate">{proj.name}</span>
                            <ArrowUpRight
                              className="w-3.5 h-3.5 shrink-0"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="text-[11px] text-[#525252] truncate mt-0.5">
                            {goal ? `目标：${goal.title}` : '独立项目'}
                          </div>
                        </div>

                        <span className="font-mono-swiss px-2 py-0.5 bg-[#0A0A0A] text-white text-xs font-extrabold shrink-0">
                          {progress.label}
                        </span>
                      </div>

                      <div className="w-full h-2.5 border border-[#0A0A0A] bg-white">
                        <div
                          className="h-full bg-[#E61919] transition-all duration-200"
                          style={{ width: `${progress.percentage ?? 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between font-mono-swiss text-[11px] text-[#525252]">
                        <span>
                          TASKS: {progress.completedTasks}/{progress.totalTasks}
                        </span>
                        {proj.due_date && <span>DUE: {proj.due_date}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Review Snapshot Swiss Box */}
          <div className="bg-white border-2 border-[#0A0A0A]">
            <div className="px-5 py-3 border-b-2 border-[#0A0A0A] bg-[#0A0A0A] text-white flex items-center justify-between">
              <span className="font-mono-swiss text-xs font-bold">
                01.C // LATEST WEEKLY REVIEW (AC-08)
              </span>
              <Link
                to="/reviews"
                className="font-mono-swiss text-xs font-bold text-[#E61919] bg-white px-2 py-0.5 hover:bg-[#E61919] hover:text-white transition-colors"
              >
                EDIT →
              </Link>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-[#525252] p-5">
                尚未记录周复盘，建议每周末复盘成果、问题与下周计划。
              </p>
            ) : (
              <div className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between font-mono-swiss border-b border-[#D4D4D0] pb-2">
                  <span className="font-extrabold">
                    WEEK_START // {reviews[0].week_start}
                  </span>
                  <span className="text-[#525252]">UNIQUE UPSERT</span>
                </div>
                <div className="text-[#0A0A0A] line-clamp-2 whitespace-pre-line leading-relaxed">
                  <strong className="font-extrabold uppercase mr-1">
                    [成果]
                  </strong>
                  {reviews[0].achievements}
                </div>
                <div className="text-[#525252] line-clamp-2 whitespace-pre-line leading-relaxed">
                  <strong className="text-[#0A0A0A] font-extrabold uppercase mr-1">
                    [计划]
                  </strong>
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
