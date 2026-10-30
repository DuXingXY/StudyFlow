import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Goal,
  GoalInput,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  UserProfile,
  WeeklyReview,
  WeeklyReviewInput,
} from '../types/models';
import { normalizeToWeekMonday } from '../utils/dateUtils';
import {
  buildInitialSeedDataset,
  DEMO_USER_A,
  DEMO_USER_B,
  type SeedDataset,
} from './seedData';

const STORAGE_DB_KEY = 'studyflow_db_v1';
const STORAGE_SESSION_KEY = 'studyflow_session_v1';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabaseClient: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Memory fallback for test environments without window.localStorage
const memoryStore = new Map<string, string>();

function readStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return memoryStore.get(key) ?? null;
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
      return;
    }
  } catch {
    // ignore
  }
  if (value === null) {
    memoryStore.delete(key);
  } else {
    memoryStore.set(key, value);
  }
}

function loadLocalDb(): SeedDataset {
  const raw = readStorage(STORAGE_DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SeedDataset;
      if (
        Array.isArray(parsed.users) &&
        Array.isArray(parsed.goals) &&
        Array.isArray(parsed.projects) &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.weekly_reviews)
      ) {
        return parsed;
      }
    } catch {
      // fall through to re-seed
    }
  }
  const initial = buildInitialSeedDataset();
  writeStorage(STORAGE_DB_KEY, JSON.stringify(initial));
  return initial;
}

function saveLocalDb(db: SeedDataset): void {
  writeStorage(STORAGE_DB_KEY, JSON.stringify(db));
}

function requireActiveUserSync(): UserProfile {
  const raw = readStorage(STORAGE_SESSION_KEY);
  if (!raw) {
    throw new Error('未登录或会话已过期，请先登录账号 (AC-01)');
  }
  try {
    const user = JSON.parse(raw) as UserProfile;
    if (!user?.id || !user?.email) {
      throw new Error('会话数据无效，请重新登录');
    }
    return user;
  } catch {
    throw new Error('未登录或会话已过期，请先登录账号 (AC-01)');
  }
}

export const studyFlowRepo = {
  getMode(): 'supabase' | 'local' {
    return isSupabaseConfigured ? 'supabase' : 'local';
  },

  // =========================
  // Auth & Session Management
  // =========================

  async getSessionUser(): Promise<UserProfile | null> {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getUser();
      if (!data.user) return null;
      return {
        id: data.user.id,
        email: data.user.email ?? 'user@studyflow.edu.cn',
        displayName:
          (data.user.user_metadata?.display_name as string) ||
          data.user.email?.split('@')[0] ||
          'StudyFlow 用户',
      };
    }
    const raw = readStorage(STORAGE_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('请输入有效的邮箱地址');
    }
    if (!password || password.length < 6) {
      throw new Error('密码长度不能少于 6 位');
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error || !data.user) {
        throw new Error(error?.message || '登录失败，请检查账号或密码');
      }
      return {
        id: data.user.id,
        email: data.user.email ?? cleanEmail,
        displayName:
          (data.user.user_metadata?.display_name as string) ||
          cleanEmail.split('@')[0],
      };
    }

    const db = loadLocalDb();
    const found = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.passwordHash === password
    );
    if (!found) {
      throw new Error('邮箱或密码错误（演示账号密码均为 123456，也可直接点击上方“注册新账号”）');
    }
    const profile: UserProfile = {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      roleLabel: found.roleLabel,
    };
    writeStorage(STORAGE_SESSION_KEY, JSON.stringify(profile));
    return profile;
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('请输入有效的邮箱地址');
    }
    if (!password || password.length < 6) {
      throw new Error('注册密码长度不能少于 6 位');
    }

    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: displayName?.trim() || cleanEmail.split('@')[0],
          },
        },
      });
      if (error || !data.user) {
        throw new Error(error?.message || '注册失败，请稍后重试');
      }
      return {
        id: data.user.id,
        email: data.user.email ?? cleanEmail,
        displayName: displayName?.trim() || cleanEmail.split('@')[0],
      };
    }

    const db = loadLocalDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      throw new Error('该邮箱已被注册，请直接登录');
    }
    const newUser: UserProfile & { passwordHash: string } = {
      id: generateUuid(),
      email: cleanEmail,
      displayName: displayName?.trim() || cleanEmail.split('@')[0],
      roleLabel: '个人学习空间',
      passwordHash: password,
    };
    db.users.push(newUser);
    saveLocalDb(db);

    const profile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      roleLabel: newUser.roleLabel,
    };
    writeStorage(STORAGE_SESSION_KEY, JSON.stringify(profile));
    return profile;
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    writeStorage(STORAGE_SESSION_KEY, null);
  },

  async quickLoginDemoUser(which: 'A' | 'B'): Promise<UserProfile> {
    loadLocalDb(); // Ensure seed DB exists
    const target = which === 'A' ? DEMO_USER_A : DEMO_USER_B;
    writeStorage(STORAGE_SESSION_KEY, JSON.stringify(target));
    return target;
  },

  async resetLocalDemoData(): Promise<UserProfile> {
    const fresh = buildInitialSeedDataset();
    saveLocalDb(fresh);
    writeStorage(STORAGE_SESSION_KEY, JSON.stringify(DEMO_USER_A));
    return DEMO_USER_A;
  },

  // =========================
  // Goals CRUD
  // =========================

  async listGoals(): Promise<Goal[]> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法读取学习目标');
      const { data, error } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Goal[];
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    return db.goals
      .filter((g) => g.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createGoal(input: GoalInput): Promise<Goal> {
    const title = input.title?.trim();
    if (!title) {
      throw new Error('学习目标名称不能为空');
    }
    if (title.length > 100) {
      throw new Error('学习目标名称不能超过 100 个字符');
    }

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法创建学习目标');
      const { data, error } = await supabaseClient
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          description: input.description?.trim() ?? '',
          target_date: input.target_date || null,
          status: input.status ?? 'active',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Goal;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const goal: Goal = {
      id: generateUuid(),
      user_id: user.id,
      title,
      description: input.description?.trim() ?? '',
      target_date: input.target_date || null,
      status: input.status ?? 'active',
      created_at: now,
      updated_at: now,
    };
    db.goals.unshift(goal);
    saveLocalDb(db);
    return goal;
  },

  async updateGoal(id: string, patch: Partial<GoalInput>): Promise<Goal> {
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error('学习目标名称不能为空');
    }

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法修改学习目标');
      const updatePayload: Record<string, unknown> = {};
      if (patch.title !== undefined) updatePayload.title = patch.title.trim();
      if (patch.description !== undefined)
        updatePayload.description = patch.description.trim();
      if (patch.target_date !== undefined)
        updatePayload.target_date = patch.target_date || null;
      if (patch.status !== undefined) updatePayload.status = patch.status;

      const { data, error } = await supabaseClient
        .from('goals')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (error || !data) {
        throw new Error(error?.message || 'RLS 权限拒绝：无法修改不存在或属于他人的学习目标');
      }
      return data as Goal;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const idx = db.goals.findIndex((g) => g.id === id);
    if (idx === -1 || db.goals[idx].user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权修改不存在或属于其他用户的学习目标 (AC-10)');
    }
    const existing = db.goals[idx];
    const updated: Goal = {
      ...existing,
      title: patch.title !== undefined ? patch.title.trim() : existing.title,
      description:
        patch.description !== undefined
          ? patch.description.trim()
          : existing.description,
      target_date:
        patch.target_date !== undefined
          ? patch.target_date || null
          : existing.target_date,
      status: patch.status !== undefined ? patch.status : existing.status,
      updated_at: new Date().toISOString(),
    };
    db.goals[idx] = updated;
    saveLocalDb(db);
    return updated;
  },

  async deleteGoal(id: string): Promise<void> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法删除学习目标');
      const { error } = await supabaseClient
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const target = db.goals.find((g) => g.id === id);
    if (!target || target.user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权删除不存在或属于其他用户的学习目标 (AC-10)');
    }
    db.goals = db.goals.filter((g) => g.id !== id);
    // ON DELETE SET NULL for projects.goal_id
    const now = new Date().toISOString();
    db.projects = db.projects.map((p) =>
      p.goal_id === id ? { ...p, goal_id: null, updated_at: now } : p
    );
    saveLocalDb(db);
  },

  // =========================
  // Projects CRUD
  // =========================

  async listProjects(): Promise<Project[]> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法读取项目列表');
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Project[];
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    return db.projects
      .filter((p) => p.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getProjectById(id: string): Promise<Project> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法读取项目详情');
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (error || !data) {
        throw new Error('项目不存在或无权访问该项目 (AC-10)');
      }
      return data as Project;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const found = db.projects.find((p) => p.id === id);
    if (!found || found.user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：项目不存在或无权访问其他用户的项目 (AC-10)');
    }
    return found;
  },

  async createProject(input: ProjectInput): Promise<Project> {
    const name = input.name?.trim();
    if (!name) {
      throw new Error('项目名称不能为空');
    }
    if (name.length > 100) {
      throw new Error('项目名称不能超过 100 个字符');
    }

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法创建项目');
      const { data, error } = await supabaseClient
        .from('projects')
        .insert({
          user_id: user.id,
          goal_id: input.goal_id || null,
          name,
          description: input.description?.trim() ?? '',
          due_date: input.due_date || null,
          status: input.status ?? 'active',
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Project;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();

    // RLS WITH CHECK: Verify goal_id belongs to current user if provided
    const goalId = input.goal_id || null;
    if (goalId) {
      const goal = db.goals.find((g) => g.id === goalId);
      if (!goal || goal.user_id !== user.id) {
        throw new Error('RLS 安全策略拦截：禁止将项目关联到其他用户的学习目标 (AC-10)');
      }
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: generateUuid(),
      user_id: user.id,
      goal_id: goalId,
      name,
      description: input.description?.trim() ?? '',
      due_date: input.due_date || null,
      status: input.status ?? 'active',
      created_at: now,
      updated_at: now,
    };
    db.projects.unshift(project);
    saveLocalDb(db);
    return project;
  },

  async updateProject(id: string, patch: Partial<ProjectInput>): Promise<Project> {
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new Error('项目名称不能为空');
    }

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法更新项目');
      const updatePayload: Record<string, unknown> = {};
      if (patch.name !== undefined) updatePayload.name = patch.name.trim();
      if (patch.goal_id !== undefined) updatePayload.goal_id = patch.goal_id || null;
      if (patch.description !== undefined)
        updatePayload.description = patch.description.trim();
      if (patch.due_date !== undefined)
        updatePayload.due_date = patch.due_date || null;
      if (patch.status !== undefined) updatePayload.status = patch.status;

      const { data, error } = await supabaseClient
        .from('projects')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (error || !data) {
        throw new Error(error?.message || 'RLS 权限拒绝：无法修改该项目');
      }
      return data as Project;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1 || db.projects[idx].user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权修改不存在或属于其他用户的项目 (AC-10)');
    }

    const nextGoalId =
      patch.goal_id !== undefined ? patch.goal_id || null : db.projects[idx].goal_id;
    if (nextGoalId) {
      const goal = db.goals.find((g) => g.id === nextGoalId);
      if (!goal || goal.user_id !== user.id) {
        throw new Error('RLS 安全策略拦截：禁止将项目关联到其他用户的学习目标 (AC-10)');
      }
    }

    const existing = db.projects[idx];
    const updated: Project = {
      ...existing,
      name: patch.name !== undefined ? patch.name.trim() : existing.name,
      goal_id: nextGoalId,
      description:
        patch.description !== undefined
          ? patch.description.trim()
          : existing.description,
      due_date:
        patch.due_date !== undefined ? patch.due_date || null : existing.due_date,
      status: patch.status !== undefined ? patch.status : existing.status,
      updated_at: new Date().toISOString(),
    };
    db.projects[idx] = updated;
    saveLocalDb(db);
    return updated;
  },

  /**
   * 删除项目：保留原有任务并解除任务与该项目的关联 (ON DELETE SET NULL)
   * 对应数据库设计约定与 AC-04
   */
  async deleteProject(id: string): Promise<{ unlinkedTaskCount: number }> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法删除项目');
      const { count } = await supabaseClient
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .eq('user_id', user.id);
      const { error } = await supabaseClient
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return { unlinkedTaskCount: count ?? 0 };
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const target = db.projects.find((p) => p.id === id);
    if (!target || target.user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权删除不存在或属于其他用户的项目 (AC-10)');
    }

    let unlinkedTaskCount = 0;
    const now = new Date().toISOString();
    db.tasks = db.tasks.map((t) => {
      if (t.project_id === id && t.user_id === user.id) {
        unlinkedTaskCount += 1;
        return { ...t, project_id: null, updated_at: now };
      }
      return t;
    });
    db.projects = db.projects.filter((p) => p.id !== id);
    saveLocalDb(db);
    return { unlinkedTaskCount };
  },

  // =========================
  // Tasks CRUD
  // =========================

  async listTasks(): Promise<Task[]> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法读取任务列表');
      const { data, error } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Task[];
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    return db.tasks
      .filter((t) => t.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async createTask(input: TaskInput): Promise<Task> {
    const title = input.title?.trim();
    if (!title) {
      throw new Error('任务标题不能为空');
    }
    if (title.length > 150) {
      throw new Error('任务标题不能超过 150 个字符');
    }

    const status = input.status ?? 'todo';
    const priority = input.priority ?? 'medium';
    const now = new Date().toISOString();
    const completedAt = status === 'done' ? now : null;

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法创建任务');
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert({
          user_id: user.id,
          project_id: input.project_id || null,
          title,
          status,
          priority,
          planned_date: input.planned_date || null,
          due_date: input.due_date || null,
          completed_at: completedAt,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data as Task;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();

    // RLS WITH CHECK: prevent linking task to another user's project (AC-10)
    const projectId = input.project_id || null;
    if (projectId) {
      const proj = db.projects.find((p) => p.id === projectId);
      if (!proj || proj.user_id !== user.id) {
        throw new Error('RLS 安全策略拦截：禁止将任务关联到其他用户的项目 (AC-10)');
      }
    }

    const task: Task = {
      id: generateUuid(),
      user_id: user.id,
      project_id: projectId,
      title,
      status,
      priority,
      planned_date: input.planned_date || null,
      due_date: input.due_date || null,
      completed_at: completedAt,
      created_at: now,
      updated_at: now,
    };
    db.tasks.unshift(task);
    saveLocalDb(db);
    return task;
  },

  async updateTask(id: string, patch: Partial<TaskInput>): Promise<Task> {
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error('任务标题不能为空');
    }

    const now = new Date().toISOString();

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法更新任务');
      const updatePayload: Record<string, unknown> = {};
      if (patch.title !== undefined) updatePayload.title = patch.title.trim();
      if (patch.project_id !== undefined)
        updatePayload.project_id = patch.project_id || null;
      if (patch.priority !== undefined) updatePayload.priority = patch.priority;
      if (patch.planned_date !== undefined)
        updatePayload.planned_date = patch.planned_date || null;
      if (patch.due_date !== undefined)
        updatePayload.due_date = patch.due_date || null;
      if (patch.status !== undefined) {
        updatePayload.status = patch.status;
        updatePayload.completed_at = patch.status === 'done' ? now : null;
      }

      const { data, error } = await supabaseClient
        .from('tasks')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (error || !data) {
        throw new Error(error?.message || 'RLS 权限拒绝：无法修改该任务');
      }
      return data as Task;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1 || db.tasks[idx].user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权修改不存在或属于其他用户的任务 (AC-10)');
    }

    const existing = db.tasks[idx];
    const nextProjectId =
      patch.project_id !== undefined
        ? patch.project_id || null
        : existing.project_id;

    if (nextProjectId) {
      const proj = db.projects.find((p) => p.id === nextProjectId);
      if (!proj || proj.user_id !== user.id) {
        throw new Error('RLS 安全策略拦截：禁止将任务关联到其他用户的项目 (AC-10)');
      }
    }

    const nextStatus = patch.status !== undefined ? patch.status : existing.status;
    const nextCompletedAt =
      patch.status !== undefined
        ? nextStatus === 'done'
          ? existing.completed_at || now
          : null
        : existing.completed_at;

    const updated: Task = {
      ...existing,
      title: patch.title !== undefined ? patch.title.trim() : existing.title,
      project_id: nextProjectId,
      status: nextStatus,
      priority: patch.priority !== undefined ? patch.priority : existing.priority,
      planned_date:
        patch.planned_date !== undefined
          ? patch.planned_date || null
          : existing.planned_date,
      due_date:
        patch.due_date !== undefined ? patch.due_date || null : existing.due_date,
      completed_at: nextCompletedAt,
      updated_at: now,
    };
    db.tasks[idx] = updated;
    saveLocalDb(db);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法删除任务');
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return;
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const target = db.tasks.find((t) => t.id === id);
    if (!target || target.user_id !== user.id) {
      throw new Error('RLS 安全策略拦截：无权删除不存在或属于其他用户的任务 (AC-10)');
    }
    db.tasks = db.tasks.filter((t) => t.id !== id);
    saveLocalDb(db);
  },

  // =========================
  // Weekly Reviews (Upsert by user_id + week_start)
  // =========================

  async listWeeklyReviews(): Promise<WeeklyReview[]> {
    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法读取每周复盘');
      const { data, error } = await supabaseClient
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as WeeklyReview[];
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    return db.weekly_reviews
      .filter((r) => r.user_id === user.id)
      .sort((a, b) => b.week_start.localeCompare(a.week_start));
  },

  /**
   * 保存每周复盘：同一用户同一自然周 (user_id, week_start) 只能有一条记录，重复保存自动更新原记录 (AC-08)
   */
  async upsertWeeklyReview(
    input: WeeklyReviewInput
  ): Promise<{ review: WeeklyReview; isUpdated: boolean }> {
    const normalizedMonday = normalizeToWeekMonday(input.week_start);
    const achievements = input.achievements?.trim() ?? '';
    const problems = input.problems?.trim() ?? '';
    const next_plan = input.next_plan?.trim() ?? '';

    if (!achievements && !problems && !next_plan) {
      throw new Error('请至少填写本周成果、遇到的问题或下周计划中的一项内容');
    }

    if (supabaseClient) {
      const user = await this.getSessionUser();
      if (!user) throw new Error('未登录，无法保存每周复盘');

      const { data: existing } = await supabaseClient
        .from('weekly_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', normalizedMonday)
        .maybeSingle();

      const { data, error } = await supabaseClient
        .from('weekly_reviews')
        .upsert(
          {
            user_id: user.id,
            week_start: normalizedMonday,
            achievements,
            problems,
            next_plan,
          },
          { onConflict: 'user_id,week_start' }
        )
        .select('*')
        .single();
      if (error || !data) throw new Error(error?.message || '保存周复盘失败');
      return { review: data as WeeklyReview, isUpdated: Boolean(existing) };
    }

    const user = requireActiveUserSync();
    const db = loadLocalDb();
    const now = new Date().toISOString();
    const existingIdx = db.weekly_reviews.findIndex(
      (r) => r.user_id === user.id && r.week_start === normalizedMonday
    );

    if (existingIdx !== -1) {
      const updated: WeeklyReview = {
        ...db.weekly_reviews[existingIdx],
        achievements,
        problems,
        next_plan,
        updated_at: now,
      };
      db.weekly_reviews[existingIdx] = updated;
      saveLocalDb(db);
      return { review: updated, isUpdated: true };
    }

    const created: WeeklyReview = {
      id: generateUuid(),
      user_id: user.id,
      week_start: normalizedMonday,
      achievements,
      problems,
      next_plan,
      created_at: now,
      updated_at: now,
    };
    db.weekly_reviews.push(created);
    saveLocalDb(db);
    return { review: created, isUpdated: false };
  },
};
