import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  ShieldAlert,
  Target,
  Trash2,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../types/models';
import {
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
} from '../utils/dateUtils';

const priorityBadge: Record<TaskPriority, { label: string; cls: string }> = {
  high: { label: '高优', cls: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: '中优', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  low: { label: '低优', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    goals,
    projects,
    tasks,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useStudyFlow();

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id]
  );

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskPlannedDate, setTaskPlannedDate] = useState(getLocalDateString());
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  if (!project) {
    return (
      <div className="bento-card p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">
          项目不存在或无权访问 (AC-10 安全隔离)
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          未找到该项目，或该项目归属于其他用户账户，已被 Row Level Security (RLS) 安全策略拦截。
        </p>
        <Link
          to="/projects"
          className="min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          返回我的项目列表
        </Link>
      </div>
    );
  }

  const linkedGoal = goals.find((g) => g.id === project.goal_id);
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const filteredTasks =
    statusFilter === 'all'
      ? projectTasks
      : projectTasks.filter((t) => t.status === statusFilter);
  const progress = calculateProjectProgress(projectTasks);
  const todayStr = getLocalDateString();

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    if (!taskTitle.trim()) {
      setTaskError('请输入子任务标题');
      return;
    }
    try {
      await createTask({
        title: taskTitle,
        project_id: project.id,
        priority: taskPriority,
        planned_date: taskPlannedDate || null,
        due_date: taskDueDate || null,
        status: 'todo',
      });
      setTaskTitle('');
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : '添加任务失败');
    }
  };

  const handleDeleteCurrentProject = async () => {
    const confirmText = `确定删除项目“${project.name}”吗？\n该项目下的 ${projectTasks.length} 个任务将被保留并转为独立任务。`;
    if (!window.confirm(confirmText)) return;
    await deleteProject(project.id);
    navigate('/projects', { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/projects"
          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-teal-400 hover:text-teal-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>返回我的项目</span>
        </Link>

        <button
          type="button"
          onClick={handleDeleteCurrentProject}
          className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>删除项目（保留任务）</span>
        </button>
      </div>

      {/* Hero Project Overview Bento Card */}
      <div className="bento-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-0.5 rounded-full">
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                {linkedGoal ? linkedGoal.title : '独立项目（未关联目标）'}
              </span>
              {project.due_date && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-0.5 rounded-full">
                  <Calendar
                    className="w-3.5 h-3.5 text-teal-700"
                    aria-hidden="true"
                  />
                  项目截止：{project.due_date}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 break-words">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                {project.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <select
              aria-label="项目状态"
              value={project.status}
              onChange={(e) =>
                updateProject(project.id, {
                  status: e.target.value as ProjectStatus,
                })
              }
              className="min-h-[40px] text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-slate-800 cursor-pointer"
            >
              <option value="active">项目状态：进行中</option>
              <option value="completed">项目状态：已完成</option>
              <option value="on_hold">项目状态：已搁置</option>
            </select>
          </div>
        </div>

        {/* Highlighted Project Completion Rate Bar (AC-06) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950 to-teal-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-teal-200 uppercase tracking-wider">
                项目实时完成率 (AC-06)
              </span>
              <div className="text-xs text-teal-100/80 mt-0.5">
                {progress.totalTasks === 0
                  ? '当前尚无子任务，添加并完成任务后自动计算百分比'
                  : `已完成 ${progress.completedTasks} 项 / 共 ${progress.totalTasks} 项子任务`}
              </div>
            </div>
            <span
              data-testid="project-detail-progress"
              className="text-2xl font-black text-orange-400"
            >
              {progress.label}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.percentage === 100
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-teal-300 to-orange-400'
              }`}
              style={{ width: `${progress.percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Subtask Bento Form */}
      <div className="bento-card p-5 sm:p-6 space-y-3.5">
        <h2 className="text-sm font-extrabold text-slate-900">
          为当前项目拆解新任务
        </h2>
        {taskError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold"
          >
            {taskError}
          </div>
        )}
        <form
          onSubmit={handleQuickAddTask}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
          noValidate
        >
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="输入子任务标题，例如：完成接口异常处理联调..."
            className="sm:col-span-5 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
            className="sm:col-span-2 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <input
            type="date"
            value={taskPlannedDate}
            onChange={(e) => setTaskPlannedDate(e.target.value)}
            title="计划执行日期"
            className="sm:col-span-2 px-2.5 py-2.5 text-xs rounded-xl border border-slate-300"
          />
          <input
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            title="截止日期"
            className="sm:col-span-2 px-2.5 py-2.5 text-xs rounded-xl border border-slate-300"
          />
          <button
            type="submit"
            className="min-h-[42px] sm:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="sm:hidden">添加任务</span>
          </button>
        </form>
      </div>

      {/* Project Tasks List */}
      <div className="bento-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">
            项目所属子任务 ({projectTasks.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: '全部' },
                { key: 'todo', label: '待办' },
                { key: 'doing', label: '进行中' },
                { key: 'done', label: '已完成' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  statusFilter === t.key
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            当前筛选下暂无子任务，可在上方输入框快速拆解添加。
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task, todayStr);
              const pri = priorityBadge[task.priority];
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    overdue
                      ? 'bg-red-50/40 border-red-200'
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
                      className="mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center text-slate-400 hover:text-teal-600 shrink-0 cursor-pointer"
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

                    <div className="space-y-1 min-w-0">
                      <div
                        className={`text-sm font-bold break-words ${
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
                        {task.planned_date && (
                          <span className="text-slate-500 font-medium">
                            计划：{task.planned_date}
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

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <select
                      aria-label={`任务 ${task.title} 状态`}
                      value={task.status}
                      onChange={(e) =>
                        updateTask(task.id, {
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="min-h-[36px] text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 cursor-pointer"
                    >
                      <option value="todo">待办 (todo)</option>
                      <option value="doing">进行中 (doing)</option>
                      <option value="done">已完成 (done)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      title="删除任务"
                      aria-label={`删除任务 ${task.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
