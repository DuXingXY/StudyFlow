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
  medium: { label: '中优', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          项目不存在或无权访问 (AC-10 安全隔离)
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          未找到该项目，或该项目归属于其他用户账户，已被 Row Level Security (RLS) 安全策略拦截。
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
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
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回我的项目</span>
        </Link>

        <button
          type="button"
          onClick={handleDeleteCurrentProject}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>删除项目（保留任务）</span>
        </button>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                <Target className="w-3.5 h-3.5" />
                {linkedGoal ? linkedGoal.title : '独立项目（未关联目标）'}
              </span>
              {project.due_date && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  项目截止：{project.due_date}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">
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
              className="text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">项目状态：进行中</option>
              <option value="completed">项目状态：已完成</option>
              <option value="on_hold">项目状态：已搁置</option>
            </select>
          </div>
        </div>

        {/* Highlighted Project Completion Rate Bar (AC-06) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">
                项目实时完成率
              </span>
              <span className="ml-2 text-xs text-slate-500">
                {progress.totalTasks === 0
                  ? '当前尚无子任务'
                  : `已完成 ${progress.completedTasks} / 共 ${progress.totalTasks} 个任务`}
              </span>
            </div>
            <span
              data-testid="project-detail-progress"
              className="text-lg font-extrabold text-indigo-600"
            >
              {progress.label}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress.percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Subtask Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          为当前项目拆解新任务
        </h2>
        {taskError && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
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
            className="sm:col-span-5 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
            className="sm:col-span-2 px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
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
            className="sm:col-span-2 px-2.5 py-2 text-xs rounded-xl border border-slate-300"
          />
          <input
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            title="截止日期"
            className="sm:col-span-2 px-2.5 py-2 text-xs rounded-xl border border-slate-300"
          />
          <button
            type="submit"
            className="sm:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:hidden">添加任务</span>
          </button>
        </form>
      </div>

      {/* Project Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            项目所属任务 ({projectTasks.length})
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  statusFilter === t.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            当前筛选下暂无子任务，可在上方输入框快速拆解添加。
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task, todayStr);
              const pri = priorityBadge[task.priority];
              return (
                <div
                  key={task.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                      aria-label={`切换任务 ${task.title} 完成状态`}
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
                        <span
                          className={`px-2 py-0.5 rounded-md border font-semibold ${pri.cls}`}
                        >
                          {pri.label}
                        </span>
                        {task.planned_date && (
                          <span className="text-slate-500">
                            计划：{task.planned_date}
                          </span>
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-bold">
                            <AlertTriangle className="w-3 h-3" />
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
                      className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700"
                    >
                      <option value="todo">待办 (todo)</option>
                      <option value="doing">进行中 (doing)</option>
                      <option value="done">已完成 (done)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="删除任务"
                    >
                      <Trash2 className="w-4 h-4" />
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
