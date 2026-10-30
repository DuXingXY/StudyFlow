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
  { label: string; code: string; badgeClass: string; weight: number }
> = {
  high: {
    label: '高优先级',
    code: 'P0-HIGH',
    badgeClass: 'bg-[#E61919] text-white border-[#E61919]',
    weight: 3,
  },
  medium: {
    label: '中优先级',
    code: 'P1-MED',
    badgeClass: 'bg-[#0A0A0A] text-white border-[#0A0A0A]',
    weight: 2,
  },
  low: {
    label: '低优先级',
    code: 'P2-LOW',
    badgeClass: 'bg-[#F6F5F2] text-[#525252] border-[#0A0A0A]',
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
      {/* Swiss Header */}
      <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono-swiss font-bold uppercase tracking-[0.2em] text-[#E61919]">
            <span>04 // TASK EXECUTION MATRIX</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] mt-1 tracking-tight">
            任务执行中心 (Tasks)
          </h1>
          <p className="text-xs sm:text-sm text-[#525252] mt-1 font-medium">
            统一管理项目子任务与日常独立待办，记录计划日期与截止期，自动预警逾期任务（AC-04 / AC-05）。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="swiss-btn-accent min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>新增任务</span>
        </button>
      </div>

      {/* Multi-dimensional Swiss Filter Bar */}
      <div className="bg-white border-2 border-[#0A0A0A] p-4 space-y-3.5">
        {/* View Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: `ALL / 全部 (${tasks.length})` },
              {
                key: 'today',
                label: `TODAY / 今日与逾期 (${tasks.filter((t) => isTaskTodayOrOverdue(t, todayStr)).length})`,
              },
              {
                key: 'overdue',
                label: `OVERDUE / 已逾期 (${overdueCount})`,
                danger: overdueCount > 0,
              },
              {
                key: 'todo',
                label: `TODO / 待办 (${tasks.filter((t) => t.status === 'todo').length})`,
              },
              {
                key: 'doing',
                label: `DOING / 进行中 (${tasks.filter((t) => t.status === 'doing').length})`,
              },
              {
                key: 'done',
                label: `DONE / 已完成 (${tasks.filter((t) => t.status === 'done').length})`,
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
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-mono-swiss font-bold border transition-colors cursor-pointer ${
                viewFilter === tab.key
                  ? tab.danger
                    ? 'bg-[#E61919] text-white border-[#0A0A0A]'
                    : 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : tab.danger
                  ? 'bg-[#FFF5F5] text-[#E61919] border-[#E61919] hover:bg-[#E61919] hover:text-white'
                  : 'bg-[#F6F5F2] text-[#0A0A0A] border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t-2 border-[#0A0A0A]">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#0A0A0A] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务标题关键词..."
              className="w-full pl-9 pr-3 py-2 text-xs font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            aria-label="按所属项目筛选"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] text-[#0A0A0A] cursor-pointer focus:outline-none"
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
            className="w-full px-3 py-2 text-xs font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] text-[#0A0A0A] cursor-pointer focus:outline-none"
          >
            <option value="all">优先级筛选：全部优先级</option>
            <option value="high">仅看：高优先级 (high)</option>
            <option value="medium">仅看：中优先级 (medium)</option>
            <option value="low">仅看：低优先级 (low)</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-base font-black text-[#0A0A0A]">
            没有找到符合筛选条件的任务
          </div>
          <p className="text-xs text-[#525252] max-w-md mx-auto">
            你可以调整上方筛选条件，或者直接创建一条新的学习任务。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="swiss-btn-primary min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            新增任务
          </button>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] divide-y-2 divide-[#0A0A0A]">
          {filteredTasks.map((task) => {
            const linkedProject = projects.find((p) => p.id === task.project_id);
            const overdue = isTaskOverdue(task, todayStr);
            const pri = priorityMeta[task.priority];

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors ${
                  overdue
                    ? 'bg-[#FFF5F5]'
                    : task.status === 'done'
                    ? 'bg-[#F6F5F2] opacity-75'
                    : 'bg-white hover:bg-[#F6F5F2]'
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
                    className="mt-0.5 min-w-[30px] min-h-[30px] flex items-center justify-center text-[#0A0A0A] hover:text-[#E61919] shrink-0 cursor-pointer transition-colors"
                    aria-label={`切换任务 ${task.title} 状态`}
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

                  <div className="space-y-1.5 min-w-0">
                    <div
                      className={`text-sm sm:text-base font-black break-words ${
                        task.status === 'done'
                          ? 'line-through text-[#737373]'
                          : 'text-[#0A0A0A]'
                      }`}
                    >
                      {task.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 border text-[11px] font-mono-swiss font-bold ${pri.badgeClass}`}
                      >
                        {pri.code} · {pri.label}
                      </span>

                      {linkedProject ? (
                        <Link
                          to={`/projects/${linkedProject.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#F6F5F2] text-[#0A0A0A] border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white text-[11px] font-bold max-w-[240px] truncate transition-colors"
                        >
                          <FolderKanban
                            className="w-3 h-3 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{linkedProject.name}</span>
                        </Link>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-[#F6F5F2] border border-[#D4D4D0] text-[#525252] text-[11px] font-mono-swiss font-bold">
                          独立任务
                        </span>
                      )}

                      {task.planned_date && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono-swiss text-[#525252] font-bold">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          PLAN: {task.planned_date}
                        </span>
                      )}

                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono-swiss ${
                            overdue
                              ? 'text-[#E61919] font-black'
                              : 'text-[#525252] font-bold'
                          }`}
                        >
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          DUE: {task.due_date}
                        </span>
                      )}

                      {overdue && (
                        <span
                          data-testid="overdue-badge"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E61919] text-white text-[11px] font-mono-swiss font-bold"
                        >
                          <AlertTriangle
                            className="w-3 h-3"
                            aria-hidden="true"
                          />
                          OVERDUE · 已逾期提醒
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
                    className="min-h-[38px] text-xs font-mono-swiss font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] px-3 py-1.5 text-[#0A0A0A] cursor-pointer"
                  >
                    <option value="todo">待办</option>
                    <option value="doing">进行中</option>
                    <option value="done">已完成</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] cursor-pointer transition-colors"
                    title="编辑任务"
                    aria-label={`编辑任务 ${task.title}`}
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#E61919] hover:text-white text-[#0A0A0A] cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-lg p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <div>
                <div className="text-[10px] font-mono-swiss font-bold uppercase tracking-widest text-[#E61919]">
                  TASK SPECIFICATION
                </div>
                <h3 className="text-lg font-black text-[#0A0A0A]">
                  {editingTask ? '编辑任务' : '新增学习/开发任务'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white cursor-pointer"
                aria-label="关闭弹窗"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 bg-[#E61919] text-white text-xs font-bold"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                  任务标题 <span className="text-[#E61919]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：完成数据结构线段树专题练习 / 编写接口单元测试"
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                  所属项目（选填，支持独立任务）
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
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
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    任务状态
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2]"
                  >
                    <option value="todo">待办 (todo)</option>
                    <option value="doing">进行中 (doing)</option>
                    <option value="done">已完成 (done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    优先级
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as TaskPriority)
                    }
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2]"
                  >
                    <option value="high">高优先级 (high)</option>
                    <option value="medium">中优先级 (medium)</option>
                    <option value="low">低优先级 (low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    计划执行日期 (planned_date)
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-swiss border-2 border-[#0A0A0A] bg-[#F6F5F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    截止日期 (due_date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-swiss border-2 border-[#0A0A0A] bg-[#F6F5F2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#0A0A0A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="swiss-btn-outline min-h-[42px] px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="swiss-btn-accent min-h-[42px] px-5 py-2 disabled:opacity-50 text-xs font-bold cursor-pointer"
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
