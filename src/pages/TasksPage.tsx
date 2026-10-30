import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  Edit3,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { Task, TaskPriority, TaskStatus } from '../types/models';
import {
  getLocalDateString,
  isTaskOverdue,
  isTaskTodayOrOverdue,
} from '../utils/dateUtils';

type TaskViewFilter = 'all' | 'today' | 'overdue' | 'todo' | 'doing' | 'done';

const priorityMeta: Record<
  TaskPriority,
  { label: string; badgeClass: string; weight: number }
> = {
  high: {
    label: '高优先级',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    weight: 3,
  },
  medium: {
    label: '中优先级',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    weight: 2,
  },
  low: {
    label: '低优先级',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    weight: 1,
  },
};

export const TasksPage: React.FC = () => {
  const { projects, tasks, createTask, updateTask, deleteTask } = useStudyFlow();
  const todayStr = getLocalDateString();

  const [viewFilter, setViewFilter] = useState<TaskViewFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [plannedDate, setPlannedDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (viewFilter === 'today' && !isTaskTodayOrOverdue(t, todayStr))
          return false;
        if (viewFilter === 'overdue' && !isTaskOverdue(t, todayStr))
          return false;
        if (
          (viewFilter === 'todo' ||
            viewFilter === 'doing' ||
            viewFilter === 'done') &&
          t.status !== viewFilter
        ) {
          return false;
        }
        if (projectFilter === 'unlinked' && t.project_id !== null) return false;
        if (
          projectFilter !== 'all' &&
          projectFilter !== 'unlinked' &&
          t.project_id !== projectFilter
        ) {
          return false;
        }
        if (priorityFilter !== 'all' && t.priority !== priorityFilter)
          return false;
        if (
          searchQuery.trim() &&
          !t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aOver = isTaskOverdue(a, todayStr) ? 1 : 0;
        const bOver = isTaskOverdue(b, todayStr) ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return priorityMeta[b.priority].weight - priorityMeta[a.priority].weight;
      });
  }, [tasks, viewFilter, projectFilter, priorityFilter, searchQuery, todayStr]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setProjectId(projects[0]?.id ?? '');
    setStatus('todo');
    setPriority('medium');
    setPlannedDate(todayStr);
    setDueDate('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setProjectId(task.project_id ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setPlannedDate(task.planned_date ?? '');
    setDueDate(task.due_date ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('任务标题不能为空');
      return;
    }
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title,
          project_id: projectId || null,
          status,
          priority,
          planned_date: plannedDate || null,
          due_date: dueDate || null,
        });
      } else {
        await createTask({
          title,
          project_id: projectId || null,
          status,
          priority,
          planned_date: plannedDate || null,
          due_date: dueDate || null,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const overdueCount = tasks.filter((t) => isTaskOverdue(t, todayStr)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>任务执行中心 (Tasks)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            统一管理项目子任务与日常独立待办，记录计划日期与截止期，自动预警逾期任务（AC-04 / AC-05）。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>新增任务</span>
        </button>
      </div>

      {/* Multi-dimensional Bento Filter Bar */}
      <div className="bento-card p-4 space-y-3.5">
        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: `全部 (${tasks.length})` },
              {
                key: 'today',
                label: `今日与逾期 (${tasks.filter((t) => isTaskTodayOrOverdue(t, todayStr)).length})`,
              },
              {
                key: 'overdue',
                label: `已逾期 (${overdueCount})`,
                danger: overdueCount > 0,
              },
              {
                key: 'todo',
                label: `待办 (${tasks.filter((t) => t.status === 'todo').length})`,
              },
              {
                key: 'doing',
                label: `进行中 (${tasks.filter((t) => t.status === 'doing').length})`,
              },
              {
                key: 'done',
                label: `已完成 (${tasks.filter((t) => t.status === 'done').length})`,
              },
            ] as Array<{
              key: TaskViewFilter;
              label: string;
              danger?: boolean;
            }>
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setViewFilter(tab.key)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                viewFilter === tab.key
                  ? tab.danger
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-teal-700 text-white shadow-xs'
                  : tab.danger
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'text-slate-600 hover:bg-teal-50/80 hover:text-teal-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务标题关键词..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <select
            aria-label="按所属项目筛选"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
          >
            <option value="all">项目筛选：全部项目与独立任务</option>
            <option value="unlinked">独立任务（未关联项目）</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                项目：{p.name}
              </option>
            ))}
          </select>

          <select
            aria-label="按优先级筛选"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as 'all' | TaskPriority)
            }
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer"
          >
            <option value="all">优先级筛选：全部优先级</option>
            <option value="high">仅看：高优先级 (high)</option>
            <option value="medium">仅看：中优先级 (medium)</option>
            <option value="low">仅看：低优先级 (low)</option>
          </select>
        </div>
      </div>

      {/* Tasks Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="bento-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-base font-extrabold text-slate-900">
            没有找到符合筛选条件的任务
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            你可以调整上方筛选条件，或者直接创建一条新的学习任务。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            新增任务
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const linkedProject = projects.find((p) => p.id === task.project_id);
            const overdue = isTaskOverdue(task, todayStr);
            const pri = priorityMeta[task.priority];

            return (
              <div
                key={task.id}
                className={`bento-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all ${
                  overdue
                    ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                    : task.status === 'done'
                    ? 'bg-slate-50/70 opacity-75'
                    : 'hover:border-teal-400'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(task.id, {
                        status: task.status === 'done' ? 'todo' : 'done',
                      })
                    }
                    className="mt-0.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-xl text-slate-400 hover:text-teal-600 shrink-0 cursor-pointer transition-colors"
                    aria-label={`切换任务 ${task.title} 状态`}
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
                      className={`text-sm sm:text-base font-bold break-words ${
                        task.status === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${pri.badgeClass}`}
                      >
                        {pri.label}
                      </span>

                      {linkedProject ? (
                        <Link
                          to={`/projects/${linkedProject.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/70 hover:bg-teal-100 text-[11px] font-bold max-w-[240px] truncate"
                        >
                          <FolderKanban
                            className="w-3 h-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{linkedProject.name}</span>
                        </Link>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                          独立任务
                        </span>
                      )}

                      {task.planned_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          计划：{task.planned_date}
                        </span>
                      )}

                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] ${
                            overdue
                              ? 'text-red-700 font-extrabold'
                              : 'text-slate-500 font-medium'
                          }`}
                        >
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          截止：{task.due_date}
                        </span>
                      )}

                      {overdue && (
                        <span
                          data-testid="overdue-badge"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-bold shadow-2xs"
                        >
                          <AlertTriangle
                            className="w-3 h-3"
                            aria-hidden="true"
                          />
                          已逾期提醒
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <select
                    aria-label={`修改任务 ${task.title} 的状态`}
                    value={task.status}
                    onChange={(e) =>
                      updateTask(task.id, {
                        status: e.target.value as TaskStatus,
                      })
                    }
                    className="min-h-[38px] text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 cursor-pointer"
                  >
                    <option value="todo">待办</option>
                    <option value="doing">进行中</option>
                    <option value="done">已完成</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
                    title="编辑任务"
                    aria-label={`编辑任务 ${task.title}`}
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
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

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-teal-200 shadow-2xl w-full max-w-lg p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingTask ? '编辑任务' : '新增学习/开发任务'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="关闭弹窗"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  任务标题 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：完成数据结构线段树专题练习 / 编写接口单元测试"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  所属项目（选填，支持独立任务）
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:border-teal-600 focus:outline-none"
                >
                  <option value="">-- 不绑定项目（作为日常独立任务） --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    任务状态
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="todo">待办 (todo)</option>
                    <option value="doing">进行中 (doing)</option>
                    <option value="done">已完成 (done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    优先级
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="high">高优先级 (high)</option>
                    <option value="medium">中优先级 (medium)</option>
                    <option value="low">低优先级 (low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    计划执行日期 (planned_date)
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    截止日期 (due_date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
                >
                  {submitting ? '保存中...' : '保存任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
