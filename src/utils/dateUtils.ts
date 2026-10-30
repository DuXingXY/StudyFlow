import type { ProjectProgressSummary, Task } from '../types/models';

/**
 * 获取本地日期的 YYYY-MM-DD 字符串
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 在指定 YYYY-MM-DD 日期上偏移天数
 */
export function addDays(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  return getLocalDateString(dt);
}

/**
 * 将任意日期字符串 (YYYY-MM-DD) 归一化为所在自然周的周一 (YYYY-MM-DD)
 * 对应 AC-08：每位用户每个自然周只能有一条周复盘
 */
export function normalizeToWeekMonday(dateStr: string): string {
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error('日期格式无效，请使用 YYYY-MM-DD');
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    throw new Error('日期不存在，请检查输入');
  }
  const dayOfWeek = dt.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  dt.setDate(dt.getDate() + diffToMonday);
  return getLocalDateString(dt);
}

/**
 * 根据周一日期生成自然周区间展示文案，如 "2026-10-26 ~ 2026-11-01"
 */
export function formatWeekRange(weekStartMonday: string): string {
  try {
    const monday = normalizeToWeekMonday(weekStartMonday);
    const sunday = addDays(monday, 6);
    return `${monday} ~ ${sunday}`;
  } catch {
    return weekStartMonday;
  }
}

/**
 * 判断任务是否已逾期（对应 AC-05）
 * 规则：status !== 'done' 且 due_date 存在且早于 today (YYYY-MM-DD)
 */
export function isTaskOverdue(
  task: Pick<Task, 'status' | 'due_date'>,
  todayStr: string = getLocalDateString()
): boolean {
  if (task.status === 'done') return false;
  if (!task.due_date) return false;
  return task.due_date < todayStr;
}

/**
 * 判断任务是否属于“今日聚焦任务”（计划日期是今天、截止日期是今天、或已逾期未完成）
 */
export function isTaskTodayOrOverdue(
  task: Pick<Task, 'status' | 'planned_date' | 'due_date'>,
  todayStr: string = getLocalDateString()
): boolean {
  if (isTaskOverdue(task, todayStr)) return true;
  return task.planned_date === todayStr || task.due_date === todayStr;
}

/**
 * 计算项目完成率（对应 AC-06）
 * 规则：已完成任务数 / 项目总任务数。没有任务时显示“暂无任务”，5个完成3个显示“60%”
 */
export function calculateProjectProgress(
  projectTasks: Pick<Task, 'status'>[]
): ProjectProgressSummary {
  const totalTasks = projectTasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      percentage: null,
      label: '暂无任务',
    };
  }
  const completedTasks = projectTasks.filter((t) => t.status === 'done').length;
  const percentage = Math.round((completedTasks / totalTasks) * 100);
  return {
    totalTasks,
    completedTasks,
    percentage,
    label: `${percentage}%`,
  };
}
