import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { ProjectStatus, Task, TaskPriority, TaskStatus } from '../types/models';
import { calculateProjectProgress, getLocalDateString, isTaskOverdue } from '../utils/dateUtils';
import {
  Button,
  EmptyState,
  Field,
  FormError,
  MetaItem,
  ProgressBar,
  Section,
  Segmented,
  TaskRow,
  buttonClass,
  iconButtonDangerClass,
  inputClass,
  selectClass,
  selectSmClass,
} from '../components/ui';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, projects, tasks, updateProject, deleteProject, createTask, updateTask, deleteTask, runAction } =
    useStudyFlow();

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskPlannedDate, setTaskPlannedDate] = useState(getLocalDateString());
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  if (!project) {
    return (
      <div className="border-t-4 border-ink pt-6">
        <p className="text-5xl font-bold leading-none tabular-nums text-accent">404</p>
        <h1 className="mt-6 text-2xl font-bold">项目不存在或无权访问</h1>
        <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
          没有找到这个项目，或者它属于其他账户，已被行级安全策略拦截（AC-10）。
        </p>
        <Link to="/projects" className={`${buttonClass('primary')} mt-6`}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          返回我的项目
        </Link>
      </div>
    );
  }

  const linkedGoal = goals.find((g) => g.id === project.goal_id);
  const projectTasks = tasks.filter((t) => t.project_id === project.id);
  const filteredTasks = statusFilter === 'all' ? projectTasks : projectTasks.filter((t) => t.status === statusFilter);
  const progress = calculateProjectProgress(projectTasks);
  const todayStr = getLocalDateString();
  const countBy = (s: TaskStatus) => projectTasks.filter((t) => t.status === s).length;

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    if (!taskTitle.trim()) {
      setTaskError('请输入子任务标题');
      return;
    }
    setAdding(true);
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
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProject = () => {
    const msg = `确定删除项目“${project.name}”吗？\n其下 ${projectTasks.length} 个任务会保留下来，转为独立任务。`;
    if (!window.confirm(msg)) return;
    void runAction(async () => {
      await deleteProject(project.id);
      navigate('/projects', { replace: true });
    });
  };

  const handleDeleteTask = (task: Task) => {
    if (!window.confirm(`确定删除子任务“${task.title}”吗？`)) return;
    void runAction(() => deleteTask(task.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-6">
        <Link to="/projects" className={buttonClass('ghost', 'sm')}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          我的项目
        </Link>
        <Button variant="danger" size="sm" onClick={handleDeleteProject}>
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          删除项目（保留任务）
        </Button>
      </div>

      <header className="border-t-4 border-ink pt-5 sm:pt-6 pb-10 grid grid-cols-12 gap-x-4 sm:gap-x-6 gap-y-6">
        <div className="col-span-12 lg:col-span-8 min-w-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="tabular-nums font-semibold text-ink">03.1</span>
            <span className="truncate max-w-full">{linkedGoal ? `目标：${linkedGoal.title}` : '独立项目（未关联目标）'}</span>
            {project.due_date && <MetaItem label="截止">{project.due_date}</MetaItem>}
          </div>
          <h1 className="mt-4 text-3xl sm:text-[40px] font-bold leading-[1.15] tracking-tight break-words">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted leading-relaxed break-words">
              {project.description}
            </p>
          )}
          <div className="mt-5 w-full sm:w-56">
            <label htmlFor="project-status" className="block mb-1.5 text-xs font-semibold">
              项目状态
            </label>
            <select
              id="project-status"
              value={project.status}
              onChange={(e) => runAction(() => updateProject(project.id, { status: e.target.value as ProjectStatus }))}
              className={selectClass}
            >
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
              <option value="on_hold">已搁置</option>
            </select>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 lg:border-l lg:border-line lg:pl-6">
          <p className="text-xs font-semibold">
            实时完成率 <span className="font-normal text-muted">AC-06</span>
          </p>
          <p
            data-testid="project-detail-progress"
            className={
              progress.percentage === null
                ? 'mt-4 text-2xl font-bold text-muted'
                : 'mt-3 text-7xl sm:text-8xl font-bold leading-none tracking-tight tabular-nums'
            }
          >
            {progress.label}
          </p>
          <ProgressBar
            value={progress.percentage}
            tone={progress.percentage === 100 ? 'ink' : 'accent'}
            label="项目完成率"
            className="mt-5"
          />
          <p className="mt-2 text-xs text-muted tabular-nums">
            {progress.totalTasks === 0
              ? '添加并完成子任务后自动计算'
              : `已完成 ${progress.completedTasks} / ${progress.totalTasks} 项子任务`}
          </p>
        </div>
      </header>

      <Section index="A" title="拆解新任务">
        <form onSubmit={handleQuickAddTask} className="pt-1 pb-10 space-y-3" noValidate>
          <FormError message={taskError} />
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
            <Field label="子任务标题" htmlFor="quick-task-title" className="col-span-2 sm:col-span-5">
              <input
                id="quick-task-title"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="例如：完成接口异常处理联调"
                className={inputClass}
              />
            </Field>
            <Field label="优先级" htmlFor="quick-task-priority" className="col-span-2 sm:col-span-2">
              <select
                id="quick-task-priority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className={selectClass}
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </Field>
            <Field label="计划日" htmlFor="quick-task-planned" className="sm:col-span-2">
              <input
                id="quick-task-planned"
                type="date"
                value={taskPlannedDate}
                onChange={(e) => setTaskPlannedDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="截止日" htmlFor="quick-task-due" className="sm:col-span-2">
              <input
                id="quick-task-due"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Button type="submit" variant="primary" disabled={adding} className="col-span-2 sm:col-span-1" aria-label="添加子任务">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="sm:hidden">添加子任务</span>
            </Button>
          </div>
        </form>
      </Section>

      <Section index="B" title="子任务" tag={`${projectTasks.length} 项`}>
        <Segmented
          label="按状态筛选子任务"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { key: 'all', label: '全部', count: projectTasks.length },
            { key: 'todo', label: '待办', count: countBy('todo') },
            { key: 'doing', label: '进行中', count: countBy('doing') },
            { key: 'done', label: '已完成', count: countBy('done') },
          ]}
        />
        {filteredTasks.length === 0 ? (
          <EmptyState
            rule={false}
            title="当前筛选下没有子任务"
            description="在上方输入框里把项目拆成下一步可执行的小任务。"
          />
        ) : (
          <ul>
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                overdue={isTaskOverdue(task, todayStr)}
                onToggle={() =>
                  runAction(() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }))
                }
                actions={
                  <>
                    <select
                      aria-label={`修改任务 ${task.title} 的状态`}
                      value={task.status}
                      onChange={(e) => runAction(() => updateTask(task.id, { status: e.target.value as TaskStatus }))}
                      className={`${selectSmClass} w-[6.5rem]`}
                    >
                      <option value="todo">待办</option>
                      <option value="doing">进行中</option>
                      <option value="done">已完成</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className={iconButtonDangerClass}
                      aria-label={`删除任务 ${task.title}`}
                      title="删除任务"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
