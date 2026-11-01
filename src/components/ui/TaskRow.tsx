import React from 'react';
import { Check } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../../types/models';
import { cx, Tag } from './primitives';

export const priorityMeta: Record<
  TaskPriority,
  { label: string; dot: string; weight: number }
> = {
  high: { label: '高优先级', dot: 'bg-accent', weight: 3 },
  medium: { label: '中优先级', dot: 'bg-ink', weight: 2 },
  low: { label: '低优先级', dot: 'bg-line-strong', weight: 1 },
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
};

export const PriorityMark: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const meta = priorityMeta[priority];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={cx('w-2 h-2 shrink-0', meta.dot)} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

/** 方形复选框：空心 = 待办，中心小方块 = 进行中，实心勾 = 已完成。点击区域 44px。 */
export const TaskCheck: React.FC<{
  status: TaskStatus;
  title: string;
  onToggle: () => void;
}> = ({ status, title, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={status === 'done'}
    aria-label={
      status === 'done' ? `将任务 ${title} 标记为未完成` : `将任务 ${title} 标记为已完成`
    }
    className="group w-11 h-11 -m-2.5 flex items-center justify-center shrink-0 cursor-pointer"
  >
    <span
      className={cx(
        'w-5 h-5 flex items-center justify-center border-[1.5px] transition-colors',
        status === 'done'
          ? 'bg-ink border-ink text-white'
          : 'bg-white border-ink group-hover:border-accent'
      )}
    >
      {status === 'done' && <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />}
      {status === 'doing' && <span className="w-2 h-2 bg-ink" aria-hidden="true" />}
    </span>
  </button>
);

/** 任务行：用细线分隔，不加背景色；逾期只用红色标签和红色截止日期提示。 */
export const TaskRow: React.FC<{
  task: Task;
  overdue: boolean;
  onToggle: () => void;
  /** 标题下方的附加信息，例如所属项目链接 */
  context?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ task, overdue, onToggle, context, actions }) => {
  const done = task.status === 'done';
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 border-b border-line">
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <div className="pt-0.5">
          <TaskCheck status={task.status} title={task.title} onToggle={onToggle} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cx(
              'text-[15px] leading-snug break-words',
              done ? 'line-through decoration-1 text-muted' : 'font-semibold'
            )}
          >
            {task.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <PriorityMark priority={task.priority} />
            {task.status === 'doing' && <span className="text-ink font-semibold">进行中</span>}
            {context}
            {task.planned_date && <span className="tabular-nums">计划 {task.planned_date}</span>}
            {task.due_date && (
              <span className={cx('tabular-nums', overdue && 'text-accent font-semibold')}>
                截止 {task.due_date}
              </span>
            )}
            {overdue && (
              <Tag tone="accent" data-testid="overdue-badge">
                已逾期
              </Tag>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 pl-10 sm:pl-0 shrink-0">{actions}</div>
      )}
    </li>
  );
};
