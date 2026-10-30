export type GoalStatus = 'active' | 'completed' | 'paused';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  roleLabel?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  goal_id: string | null;
  name: string;
  description: string;
  due_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  planned_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReview {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  achievements: string;
  problems: string;
  next_plan: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectProgressSummary {
  totalTasks: number;
  completedTasks: number;
  percentage: number | null; // null when totalTasks === 0
  label: string; // e.g., "暂无任务" or "60%"
}

export interface GoalInput {
  title: string;
  description?: string;
  target_date?: string | null;
  status?: GoalStatus;
}

export interface ProjectInput {
  name: string;
  goal_id?: string | null;
  description?: string;
  due_date?: string | null;
  status?: ProjectStatus;
}

export interface TaskInput {
  title: string;
  project_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  planned_date?: string | null;
  due_date?: string | null;
}

export interface WeeklyReviewInput {
  week_start: string;
  achievements: string;
  problems: string;
  next_plan: string;
}
