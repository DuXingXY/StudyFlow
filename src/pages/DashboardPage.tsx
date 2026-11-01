import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
  isTaskTodayOrOverdue,
} from '../utils/dateUtils';
import {
  EmptyState,
  MetaItem,
  PageHeader,
  ProgressBar,
  Section,
  Stat,
  TaskRow,
  buttonClass,
  textLinkClass,
} from '../components/ui';

export const DashboardPage: React.FC = () => {
  const { user, goals, projects, tasks, reviews, updateTask, runAction } = useStudyFlow();
  const todayStr = getLocalDateString();

  const stats = useMemo(() => {
    const overall = calculateProjectProgress(tasks);
    return {
      todayPending: tasks.filter(
        (t) => t.status !== 'done' && (t.planned_date === todayStr || t.due_date === todayStr)
      ).length,
      overdue: tasks.filter((t) => isTaskOverdue(t, todayStr)).length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      activeGoals: goals.filter((g) => g.status === 'active').length,
      overall,
    };
  }, [tasks, projects, goals, todayStr]);

  const focusTasks = useMemo(
    () =>
      tasks
        .filter((t) => isTaskTodayOrOverdue(t, todayStr))
        .sort((a, b) => {
          if (a.status === 'done' && b.status !== 'done') return 1;
          if (a.status !== 'done' && b.status === 'done') return -1;
          return Number(isTaskOverdue(b, todayStr)) - Number(isTaskOverdue(a, todayStr));
        }),
    [tasks, todayStr]
  );

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const latestReview = reviews[0];

  const loop = [
    { idx: '01', name: '目标', to: '/goals', val: goals.length },
    { idx: '02', name: '项目', to: '/projects', val: projects.length },
    { idx: '03', name: '任务', to: '/tasks', val: tasks.length },
    { idx: '04', name: '完成率', to: '/tasks', val: stats.overall.percentage === null ? '—' : `${stats.overall.percentage}%` },
    { idx: '05', name: '复盘', to: '/reviews', val: `${reviews.length} 周` },
  ];

  return (
    <div>
      <PageHeader
        index="01"
        title={user?.displayName || user?.email || '学习总览'}
        description="所有数字都实时来自你的目标、项目与任务数据（AC-07）。从今天要做的事开始。"
        meta={user?.roleLabel ? <span>{user.roleLabel}</span> : undefined}
        actions={
          <>
            <Link to="/tasks" className={buttonClass('primary')}>
              任务中心
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to="/reviews" className={buttonClass('outline')}>
              写周复盘
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6">
        <Stat label="今日待办" value={stats.todayPending} note="计划今天执行或今天截止" />
        <Stat
          label="逾期未完成"
          tag="AC-05"
          value={stats.overdue}
          alert={stats.overdue > 0}
          note={stats.overdue > 0 ? '需要优先处理' : '没有逾期积压'}
        />
        <Stat
          label="进行中项目"
          value={stats.activeProjects}
          note={`关联 ${stats.activeGoals} 个进行中目标`}
        />
        <Stat
          label="总完成率"
          value={stats.overall.percentage === null ? '—' : `${stats.overall.percentage}%`}
          note={
            <span className="tabular-nums">
              已完成 {stats.overall.completedTasks} / {stats.overall.totalTasks}
            </span>
          }
        />
      </div>

      <nav aria-label="学习闭环" className="mt-4 mb-12 sm:mb-16 grid grid-cols-5 border-y border-ink">
        {loop.map((step) => (
          <Link
            key={step.idx}
            to={step.to}
            className="group px-2 sm:px-4 py-3 border-l border-line first:border-l-0 hover:bg-canvas transition-colors"
          >
            <span className="block text-[11px] text-muted tabular-nums group-hover:text-accent">{step.idx}</span>
            <span className="mt-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
              <span className="text-xs sm:text-sm font-semibold">{step.name}</span>
              <span className="text-sm font-bold tabular-nums">{step.val}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12">
        <Section
          className="lg:col-span-7"
          index="A"
          title="今日聚焦与逾期"
          actions={<Link to="/tasks" className={textLinkClass}>全部任务</Link>}
        >
          {focusTasks.length === 0 ? (
            <EmptyState title="今天的任务都处理完了" description="可以去任务中心规划新任务，或者写一份本周复盘。" />
          ) : (
            <ul className="border-t border-line">
              {focusTasks.map((task) => {
                const proj = projects.find((p) => p.id === task.project_id);
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    overdue={isTaskOverdue(task, todayStr)}
                    onToggle={() =>
                      runAction(() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }))
                    }
                    context={
                      proj ? (
                        <Link to={`/projects/${proj.id}`} className="text-ink hover:text-accent truncate max-w-[14rem]">
                          {proj.name}
                        </Link>
                      ) : (
                        <span>独立任务</span>
                      )
                    }
                  />
                );
              })}
            </ul>
          )}
        </Section>

        <div className="lg:col-span-5 space-y-12">
          <Section
            index="B"
            title="进行中项目"
            tag="AC-06"
            actions={<Link to="/projects" className={textLinkClass}>全部项目</Link>}
          >
            {activeProjects.length === 0 ? (
              <EmptyState title="没有进行中的项目" />
            ) : (
              <ul className="border-t border-line">
                {activeProjects.map((proj) => {
                  const progress = calculateProjectProgress(tasks.filter((t) => t.project_id === proj.id));
                  const goal = goals.find((g) => g.id === proj.goal_id);
                  return (
                    <li key={proj.id} className="border-b border-line">
                      <Link to={`/projects/${proj.id}`} className="group block py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug group-hover:text-accent transition-colors break-words">
                              {proj.name}
                            </p>
                            <p className="mt-1 text-xs text-muted truncate">
                              {goal ? goal.title : '独立项目'}
                            </p>
                          </div>
                          <span className="text-2xl font-bold leading-none tabular-nums shrink-0">
                            {progress.percentage === null ? (
                              <span className="text-sm font-semibold text-muted">{progress.label}</span>
                            ) : (
                              progress.label
                            )}
                          </span>
                        </div>
                        <ProgressBar value={progress.percentage} tone="accent" label={`${proj.name} 完成率`} className="mt-3" />
                        <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
                          <span>{progress.completedTasks} / {progress.totalTasks} 项</span>
                          {proj.due_date && <span>截止 {proj.due_date}</span>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section
            index="C"
            title="最近一次复盘"
            tag="AC-08"
            actions={<Link to="/reviews" className={textLinkClass}>编辑</Link>}
          >
            {!latestReview ? (
              <EmptyState title="还没有周复盘" description="建议每周末记录成果、问题与下周计划。" />
            ) : (
              <div className="border-t border-line pt-4 space-y-4 text-sm">
                <div className="text-xs text-muted">
                  <MetaItem label="周一">{latestReview.week_start}</MetaItem>
                </div>
                {latestReview.achievements && (
                  <div>
                    <p className="text-xs font-semibold">本周成果</p>
                    <p className="mt-1 text-muted leading-relaxed line-clamp-3 whitespace-pre-line">
                      {latestReview.achievements}
                    </p>
                  </div>
                )}
                {latestReview.next_plan && (
                  <div>
                    <p className="text-xs font-semibold">下周计划</p>
                    <p className="mt-1 text-muted leading-relaxed line-clamp-3 whitespace-pre-line">
                      {latestReview.next_plan}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};
