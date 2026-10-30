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
  high: { label: 'HIGH / 高优', cls: 'bg-[#E61919] text-white border-[#E61919]' },
  medium: { label: 'MED / 中优', cls: 'bg-[#0A0A0A] text-white border-[#0A0A0A]' },
  low: { label: 'LOW / 低优', cls: 'bg-[#F6F5F2] text-[#525252] border-[#0A0A0A]' },
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
      <div className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-10 text-center space-y-4">
        <div className="w-12 h-12 bg-[#E61919] text-white flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-black text-[#0A0A0A]">
          项目不存在或无权访问 (AC-10 安全隔离)
        </h2>
        <p className="text-xs text-[#525252] max-w-md mx-auto">
          未找到该项目，或该项目归属于其他用户账户，已被 Row Level Security (RLS) 安全策略拦截。
        </p>
        <Link
          to="/projects"
          className="swiss-btn-primary min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold"
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
          className="swiss-btn-outline min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono-swiss font-bold"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>BACK // 返回我的项目</span>
        </Link>

        <button
          type="button"
          onClick={handleDeleteCurrentProject}
          className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#0A0A0A] bg-white text-xs font-mono-swiss font-bold text-[#E61919] hover:bg-[#E61919] hover:text-white cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>删除项目（保留任务）</span>
        </button>
      </div>

      {/* Hero Project Overview Frame */}
      <div className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-swiss font-bold text-[#0A0A0A] bg-[#F6F5F2] border border-[#0A0A0A] px-3 py-0.5">
                <Target className="w-3.5 h-3.5 text-[#E61919]" aria-hidden="true" />
                {linkedGoal ? linkedGoal.title : '独立项目（未关联目标）'}
              </span>
              {project.due_date && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono-swiss font-bold text-[#0A0A0A] bg-[#F6F5F2] border border-[#0A0A0A] px-3 py-0.5">
                  <Calendar
                    className="w-3.5 h-3.5 text-[#E61919]"
                    aria-hidden="true"
                  />
                  DUE: {project.due_date}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] break-words tracking-tight">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-[#525252] leading-relaxed break-words">
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
              className="min-h-[40px] text-xs font-mono-swiss font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] px-3.5 py-2 text-[#0A0A0A] cursor-pointer focus:outline-none"
            >
              <option value="active">STATUS: 进行中 (ACTIVE)</option>
              <option value="completed">STATUS: 已完成 (DONE)</option>
              <option value="on_hold">STATUS: 已搁置 (HOLD)</option>
            </select>
          </div>
        </div>

        {/* Highlighted Project Completion Rate Bar (AC-06) */}
        <div className="p-4 sm:p-5 bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono-swiss font-bold text-[#E61919] uppercase tracking-[0.2em]">
                REAL-TIME COMPLETION RATE // 项目实时完成率 (AC-06)
              </span>
              <div className="text-xs text-[#A3A3A3] mt-0.5 font-mono-swiss">
                {progress.totalTasks === 0
                  ? '当前尚无子任务，添加并完成任务后自动计算百分比'
                  : `已完成 ${progress.completedTasks} 项 / 共 ${progress.totalTasks} 项子任务`}
              </div>
            </div>
            <span
              data-testid="project-detail-progress"
              className="text-3xl font-mono-swiss font-black text-white"
            >
              {progress.label}
            </span>
          </div>

          <div className="w-full h-3 bg-[#262626] border border-white/25 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress.percentage === 100 ? 'bg-white' : 'bg-[#E61919]'
              }`}
              style={{ width: `${progress.percentage ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Add Subtask Swiss Form */}
      <div className="bg-white border-2 border-[#0A0A0A] p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#0A0A0A] uppercase tracking-wider">
            QUICK SUBTASK BREAKDOWN // 为当前项目拆解新任务
          </h2>
          <span className="text-[10px] font-mono-swiss font-bold text-[#525252]">
            AC-04 / AC-06
          </span>
        </div>
        {taskError && (
          <div
            role="alert"
            className="p-3 bg-[#E61919] text-white text-xs font-bold"
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
            className="sm:col-span-5 px-3.5 py-2.5 text-xs sm:text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
            className="sm:col-span-2 px-3 py-2.5 text-xs font-mono-swiss font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2]"
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
            className="sm:col-span-2 px-2.5 py-2.5 text-xs font-mono-swiss border-2 border-[#0A0A0A] bg-[#F6F5F2]"
          />
          <input
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            title="截止日期"
            className="sm:col-span-2 px-2.5 py-2.5 text-xs font-mono-swiss border-2 border-[#0A0A0A] bg-[#F6F5F2]"
          />
          <button
            type="submit"
            className="swiss-btn-accent min-h-[42px] sm:col-span-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="sm:hidden">添加任务</span>
          </button>
        </form>
      </div>

      {/* Project Tasks List */}
      <div className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#0A0A0A]">
          <h2 className="text-base font-black text-[#0A0A0A]">
            项目所属子任务 ({projectTasks.length})
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: 'ALL / 全部' },
                { key: 'todo', label: 'TODO / 待办' },
                { key: 'doing', label: 'DOING / 进行中' },
                { key: 'done', label: 'DONE / 已完成' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key)}
                className={`min-h-[34px] px-3 py-1 text-xs font-mono-swiss font-bold border cursor-pointer transition-colors ${
                  statusFilter === t.key
                    ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                    : 'bg-[#F6F5F2] text-[#0A0A0A] border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono-swiss text-[#525252]">
            当前筛选下暂无子任务，可在上方输入框快速拆解添加。
          </div>
        ) : (
          <div className="divide-y divide-[#0A0A0A] border border-[#0A0A0A]">
            {filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task, todayStr);
              const pri = priorityBadge[task.priority];
              return (
                <div
                  key={task.id}
                  className={`p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    overdue
                      ? 'bg-[#FFF5F5]'
                      : task.status === 'done'
                      ? 'bg-[#F6F5F2] opacity-75'
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
                      className="mt-0.5 min-w-[28px] min-h-[28px] flex items-center justify-center text-[#0A0A0A] hover:text-[#E61919] shrink-0 cursor-pointer"
                      aria-label={`切换任务 ${task.title} 完成状态`}
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2
                          className="w-5 h-5 text-[#15803D]"
                          aria-hidden="true"
                        />
                      ) : task.status === 'doing' ? (
                        <Clock
                          className="w-5 h-5 text-[#0A0A0A]"
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
                            ? 'line-through text-[#737373]'
                            : 'text-[#0A0A0A]'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-swiss">
                        <span
                          className={`px-2 py-0.5 border font-bold ${pri.cls}`}
                        >
                          {pri.label}
                        </span>
                        {task.planned_date && (
                          <span className="text-[#525252] font-bold">
                            PLAN: {task.planned_date}
                          </span>
                        )}
                        {task.due_date && (
                          <span
                            className={
                              overdue
                                ? 'text-[#E61919] font-black'
                                : 'text-[#525252] font-bold'
                            }
                          >
                            DUE: {task.due_date}
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E61919] text-white font-bold">
                            <AlertTriangle
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            OVERDUE
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
                      className="min-h-[36px] text-xs font-mono-swiss font-bold border border-[#0A0A0A] bg-[#F6F5F2] px-2.5 py-1 text-[#0A0A0A] cursor-pointer"
                    >
                      <option value="todo">待办 (todo)</option>
                      <option value="doing">进行中 (doing)</option>
                      <option value="done">已完成 (done)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center border border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#E61919] hover:text-white cursor-pointer transition-colors"
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
