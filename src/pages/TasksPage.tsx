import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { Task, TaskPriority, TaskStatus } from '../types/models';
import { getLocalDateString, isTaskOverdue, isTaskTodayOrOverdue } from '../utils/dateUtils';
import {
  Button,
  EmptyState,
  Field,
  FormError,
  MetaItem,
  Modal,
  ModalActions,
  PageHeader,
  Segmented,
  TaskRow,
  iconButtonClass,
  iconButtonDangerClass,
  inputClass,
  priorityMeta,
  selectClass,
  selectSmClass,
} from '../components/ui';

type TaskViewFilter = 'all' | 'today' | 'overdue' | 'todo' | 'doing' | 'done';

export const TasksPage: React.FC = () => {
  const { projects, tasks, createTask, updateTask, deleteTask, runAction } = useStudyFlow();
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
    const query = searchQuery.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (viewFilter === 'today' && !isTaskTodayOrOverdue(t, todayStr)) return false;
        if (viewFilter === 'overdue' && !isTaskOverdue(t, todayStr)) return false;
        if ((viewFilter === 'todo' || viewFilter === 'doing' || viewFilter === 'done') && t.status !== viewFilter)
          return false;
        if (projectFilter === 'unlinked' && t.project_id !== null) return false;
        if (projectFilter !== 'all' && projectFilter !== 'unlinked' && t.project_id !== projectFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (query && !t.title.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => {
        const overdueDiff = Number(isTaskOverdue(b, todayStr)) - Number(isTaskOverdue(a, todayStr));
        if (overdueDiff !== 0) return overdueDiff;
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return priorityMeta[b.priority].weight - priorityMeta[a.priority].weight;
      });
  }, [tasks, viewFilter, projectFilter, priorityFilter, searchQuery, todayStr]);

  const counts = useMemo(
    () => ({
      today: tasks.filter((t) => isTaskTodayOrOverdue(t, todayStr)).length,
      overdue: tasks.filter((t) => isTaskOverdue(t, todayStr)).length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      doing: tasks.filter((t) => t.status === 'doing').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks, todayStr]
  );

  const openModal = (task: Task | null) => {
    setEditingTask(task);
    setTitle(task?.title ?? '');
    setProjectId(task ? (task.project_id ?? '') : (projects[0]?.id ?? ''));
    setStatus(task?.status ?? 'todo');
    setPriority(task?.priority ?? 'medium');
    setPlannedDate(task ? (task.planned_date ?? '') : todayStr);
    setDueDate(task?.due_date ?? '');
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
    const payload = {
      title,
      project_id: projectId || null,
      status,
      priority,
      planned_date: plannedDate || null,
      due_date: dueDate || null,
    };
    try {
      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (task: Task) => {
    if (!window.confirm(`确定删除任务“${task.title}”吗？删除后无法恢复。`)) return;
    void runAction(() => deleteTask(task.id));
  };

  const filtersActive =
    viewFilter !== 'all' || projectFilter !== 'all' || priorityFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div>
      <PageHeader
        index="04"
        title="任务中心"
        description="项目子任务与日常独立待办都在这里。记录计划日期与截止日期，逾期未完成的任务会标红（AC-04 / AC-05）。"
        meta={
          <>
            <MetaItem label="全部">{tasks.length}</MetaItem>
            <MetaItem label="进行中">{counts.doing}</MetaItem>
            {counts.overdue > 0 && (
              <span className="text-accent font-semibold tabular-nums">{counts.overdue} 项逾期</span>
            )}
          </>
        }
        actions={
          <Button variant="accent" onClick={() => openModal(null)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            新增任务
          </Button>
        }
      />

      <Segmented
        label="按状态查看任务"
        value={viewFilter}
        onChange={setViewFilter}
        options={[
          { key: 'all', label: '全部', count: tasks.length },
          { key: 'today', label: '今日与逾期', count: counts.today },
          { key: 'overdue', label: '已逾期', count: counts.overdue, alert: true },
          { key: 'todo', label: '待办', count: counts.todo },
          { key: 'doing', label: '进行中', count: counts.doing },
          { key: 'done', label: '已完成', count: counts.done },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            aria-label="搜索任务标题"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索任务标题"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          aria-label="按所属项目筛选"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className={`${selectClass} sm:col-span-3`}
        >
          <option value="all">全部项目</option>
          <option value="unlinked">独立任务</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="按优先级筛选"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
          className={`${selectClass} sm:col-span-3`}
        >
          <option value="all">全部优先级</option>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
      </div>

      <p className="mt-8 mb-2 text-xs text-muted tabular-nums" aria-live="polite">
        显示 {filteredTasks.length} / {tasks.length} 项
      </p>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={filtersActive ? '没有符合筛选条件的任务' : '还没有任务'}
          description={filtersActive ? '调整上方筛选条件，或直接新建一条任务。' : '从一条具体、今天就能开始的任务写起。'}
          action={
            <Button variant="primary" onClick={() => openModal(null)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              新增任务
            </Button>
          }
        />
      ) : (
        <ul className="border-t-2 border-ink">
          {filteredTasks.map((task) => {
            const linkedProject = projects.find((p) => p.id === task.project_id);
            return (
              <TaskRow
                key={task.id}
                task={task}
                overdue={isTaskOverdue(task, todayStr)}
                onToggle={() =>
                  runAction(() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }))
                }
                context={
                  linkedProject ? (
                    <Link
                      to={`/projects/${linkedProject.id}`}
                      className="text-ink hover:text-accent truncate max-w-[16rem]"
                    >
                      {linkedProject.name}
                    </Link>
                  ) : (
                    <span>独立任务</span>
                  )
                }
                actions={
                  <>
                    <select
                      aria-label={`修改任务 ${task.title} 的状态`}
                      value={task.status}
                      onChange={(e) =>
                        runAction(() => updateTask(task.id, { status: e.target.value as TaskStatus }))
                      }
                      className={`${selectSmClass} w-[6.5rem]`}
                    >
                      <option value="todo">待办</option>
                      <option value="doing">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => openModal(task)}
                      className={iconButtonClass}
                      aria-label={`编辑任务 ${task.title}`}
                      title="编辑任务"
                    >
                      <Edit3 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task)}
                      className={iconButtonDangerClass}
                      aria-label={`删除任务 ${task.title}`}
                      title="删除任务"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </>
                }
              />
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editingTask ? '编辑任务' : '新增任务'}
        title={editingTask ? editingTask.title : '新增学习或开发任务'}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Field label="任务标题" htmlFor="task-title" required>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：完成线段树专题练习"
              className={inputClass}
            />
          </Field>
          <Field label="所属项目" htmlFor="task-project" hint="不选则为独立任务">
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={selectClass}
            >
              <option value="">不关联项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="状态" htmlFor="task-status">
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={selectClass}
              >
                <option value="todo">待办</option>
                <option value="doing">进行中</option>
                <option value="done">已完成</option>
              </select>
            </Field>
            <Field label="优先级" htmlFor="task-priority">
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={selectClass}
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </Field>
            <Field label="计划执行日" htmlFor="task-planned">
              <input
                id="task-planned"
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="截止日期" htmlFor="task-due">
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <ModalActions>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中…' : '保存任务'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
};
