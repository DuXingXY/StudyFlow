import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { studyFlowRepo } from '../services/repository';
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

export interface ToastNotice {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StudyFlowContextValue {
  user: UserProfile | null;
  authInitializing: boolean;
  dataLoading: boolean;
  mode: 'supabase' | 'local';
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  reviews: WeeklyReview[];
  toast: ToastNotice | null;
  showToast: (type: ToastNotice['type'], message: string) => void;
  clearToast: () => void;
  /** 执行不带表单的即时操作（勾选、删除、改状态），失败时以错误通知提示而不是静默失败 */
  runAction: (action: () => Promise<unknown>) => Promise<void>;
  refreshAllData: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  quickSwitchDemoUser: (which: 'A' | 'B') => Promise<void>;
  resetDemoData: () => Promise<void>;
  createGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, patch: Partial<GoalInput>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  createProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: string, patch: Partial<ProjectInput>) => Promise<Project>;
  deleteProject: (id: string) => Promise<{ unlinkedTaskCount: number }>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<TaskInput>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  upsertWeeklyReview: (
    input: WeeklyReviewInput
  ) => Promise<{ review: WeeklyReview; isUpdated: boolean }>;
}

const StudyFlowContext = createContext<StudyFlowContextValue | undefined>(undefined);

export const StudyFlowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const showToast = useCallback(
    (type: ToastNotice['type'], message: string) => {
      const id = Date.now();
      setToast({ id, type, message });
    },
    []
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const runAction = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : '操作失败，请重试');
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast((prev) => (prev?.id === toast.id ? null : prev));
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadDataForCurrentUser = useCallback(async () => {
    setDataLoading(true);
    try {
      const [g, p, t, r] = await Promise.all([
        studyFlowRepo.listGoals(),
        studyFlowRepo.listProjects(),
        studyFlowRepo.listTasks(),
        studyFlowRepo.listWeeklyReviews(),
      ]);
      setGoals(g);
      setProjects(p);
      setTasks(t);
      setReviews(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载数据失败';
      showToast('error', msg);
    } finally {
      setDataLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sessionUser = await studyFlowRepo.getSessionUser();
        if (!mounted) return;
        setUser(sessionUser);
        if (sessionUser) {
          await loadDataForCurrentUser();
        }
      } finally {
        if (mounted) {
          setAuthInitializing(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadDataForCurrentUser]);

  const signIn = async (email: string, password: string) => {
    const loggedIn = await studyFlowRepo.signIn(email, password);
    setUser(loggedIn);
    await loadDataForCurrentUser();
    showToast('success', `欢迎回来，${loggedIn.displayName || loggedIn.email}`);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const created = await studyFlowRepo.signUp(email, password, displayName);
    setUser(created);
    await loadDataForCurrentUser();
    showToast('success', `账号注册成功，欢迎使用 StudyFlow！`);
  };

  const signOut = async () => {
    await studyFlowRepo.signOut();
    setUser(null);
    setGoals([]);
    setProjects([]);
    setTasks([]);
    setReviews([]);
    showToast('info', '已安全退出登录');
  };

  const quickSwitchDemoUser = async (which: 'A' | 'B') => {
    const switched = await studyFlowRepo.quickLoginDemoUser(which);
    setUser(switched);
    await loadDataForCurrentUser();
    showToast(
      'info',
      `已切换至 ${switched.displayName}（各自数据严格隔离，对应 AC-10）`
    );
  };

  const resetDemoData = async () => {
    const defaultUser = await studyFlowRepo.resetLocalDemoData();
    setUser(defaultUser);
    await loadDataForCurrentUser();
    showToast('success', '已重置为初始竞赛生演示数据集');
  };

  const createGoal = async (input: GoalInput) => {
    const created = await studyFlowRepo.createGoal(input);
    await loadDataForCurrentUser();
    showToast('success', '已创建学习目标');
    return created;
  };

  const updateGoal = async (id: string, patch: Partial<GoalInput>) => {
    const updated = await studyFlowRepo.updateGoal(id, patch);
    await loadDataForCurrentUser();
    showToast('success', '学习目标已更新');
    return updated;
  };

  const deleteGoal = async (id: string) => {
    await studyFlowRepo.deleteGoal(id);
    await loadDataForCurrentUser();
    showToast('info', '学习目标已删除（原关联项目已自动转为独立项目）');
  };

  const createProject = async (input: ProjectInput) => {
    const created = await studyFlowRepo.createProject(input);
    await loadDataForCurrentUser();
    showToast('success', '项目创建成功');
    return created;
  };

  const updateProject = async (id: string, patch: Partial<ProjectInput>) => {
    const updated = await studyFlowRepo.updateProject(id, patch);
    await loadDataForCurrentUser();
    showToast('success', '项目信息已更新');
    return updated;
  };

  const deleteProject = async (id: string) => {
    const res = await studyFlowRepo.deleteProject(id);
    await loadDataForCurrentUser();
    showToast(
      'info',
      `项目已删除，其下原有的 ${res.unlinkedTaskCount} 个任务已保留并解除项目关联`
    );
    return res;
  };

  const createTask = async (input: TaskInput) => {
    const created = await studyFlowRepo.createTask(input);
    await loadDataForCurrentUser();
    showToast('success', '任务已添加');
    return created;
  };

  const updateTask = async (id: string, patch: Partial<TaskInput>) => {
    const updated = await studyFlowRepo.updateTask(id, patch);
    await loadDataForCurrentUser();
    return updated;
  };

  const deleteTask = async (id: string) => {
    await studyFlowRepo.deleteTask(id);
    await loadDataForCurrentUser();
    showToast('info', '任务已删除');
  };

  const upsertWeeklyReview = async (input: WeeklyReviewInput) => {
    const res = await studyFlowRepo.upsertWeeklyReview(input);
    await loadDataForCurrentUser();
    showToast(
      'success',
      res.isUpdated
        ? `已更新 ${res.review.week_start} 所在周的复盘记录（同周唯一，对应 AC-08）`
        : `已保存 ${res.review.week_start} 所在周的复盘记录`
    );
    return res;
  };

  return (
    <StudyFlowContext.Provider
      value={{
        user,
        authInitializing,
        dataLoading,
        mode: studyFlowRepo.getMode(),
        goals,
        projects,
        tasks,
        reviews,
        toast,
        showToast,
        clearToast,
        runAction,
        refreshAllData: loadDataForCurrentUser,
        signIn,
        signUp,
        signOut,
        quickSwitchDemoUser,
        resetDemoData,
        createGoal,
        updateGoal,
        deleteGoal,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        upsertWeeklyReview,
      }}
    >
      {children}
    </StudyFlowContext.Provider>
  );
};

export function useStudyFlow(): StudyFlowContextValue {
  const ctx = useContext(StudyFlowContext);
  if (!ctx) {
    throw new Error('useStudyFlow 必须在 StudyFlowProvider 内部使用');
  }
  return ctx;
}
