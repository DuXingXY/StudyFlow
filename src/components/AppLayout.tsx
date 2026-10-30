import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  CheckSquare,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { DEMO_USER_A } from '../services/seedData';
import {
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
} from '../utils/dateUtils';

const navItems = [
  {
    to: '/dashboard',
    label: '学习总览',
    sub: 'Dashboard & KPI',
    icon: LayoutDashboard,
  },
  {
    to: '/goals',
    label: '学习目标',
    sub: 'Long-term Goals',
    icon: Target,
  },
  {
    to: '/projects',
    label: '我的项目',
    sub: 'Project Milestones',
    icon: FolderKanban,
  },
  {
    to: '/tasks',
    label: '任务中心',
    sub: 'Daily Execution',
    icon: CheckSquare,
  },
  {
    to: '/reviews',
    label: '每周复盘',
    sub: 'Weekly Reflection',
    icon: BookOpenCheck,
  },
];

export const AppLayout: React.FC = () => {
  const {
    user,
    mode,
    tasks,
    projects,
    toast,
    clearToast,
    signOut,
    quickSwitchDemoUser,
    resetDemoData,
  } = useStudyFlow();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const todayStr = getLocalDateString();
  const overallProgress = useMemo(
    () => calculateProjectProgress(tasks),
    [tasks]
  );
  const overdueCount = useMemo(
    () => tasks.filter((t) => isTaskOverdue(t, todayStr)).length,
    [tasks, todayStr]
  );
  const activeProjectsCount = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects]
  );

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleQuickSwitch = async (which: 'A' | 'B') => {
    setMobileMenuOpen(false);
    await quickSwitchDemoUser(which);
  };

  const isUserA = user?.id === DEMO_USER_A.id;

  const currentNavMeta = useMemo(() => {
    if (location.pathname.startsWith('/projects/')) {
      return { label: '项目详情与子任务看板', sub: 'Project Detail & Subtasks' };
    }
    return (
      navItems.find((item) => location.pathname.startsWith(item.to)) ??
      navItems[0]
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas-pattern text-slate-900 flex flex-col md:flex-row overflow-x-hidden">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-50 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md transition-all duration-200 ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-700 text-red-100'
              : toast.type === 'success'
              ? 'bg-teal-950/95 border-teal-600 text-teal-50'
              : 'bg-slate-900/95 border-slate-700 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'error'
                  ? 'bg-red-400'
                  : toast.type === 'success'
                  ? 'bg-teal-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="break-words leading-snug">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={clearToast}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-white/10 shrink-0 cursor-pointer transition-colors"
            aria-label="关闭通知"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Mobile Top Header (< md, 390px optimized with >=44px touch targets) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="truncate">
            <div className="font-extrabold text-slate-900 text-sm leading-tight">
              StudyFlow · 学程
            </div>
            <div className="text-[11px] text-teal-700 font-medium truncate">
              {currentNavMeta.label}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-teal-200/80 bg-teal-50/50 text-teal-900 hover:bg-teal-100/70 cursor-pointer transition-colors"
          aria-label="展开或收起导航菜单"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile Slide Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] z-40 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white border-b border-teal-100 p-4 space-y-4 max-h-[calc(100vh-61px)] overflow-y-auto shadow-2xl">
            <nav className="space-y-1.5" aria-label="移动端主导航">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-teal-50/80 hover:text-teal-900'
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] opacity-75">{item.sub}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/60 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-teal-950 truncate">
                    {user?.displayName || user?.email}
                  </div>
                  <div className="text-[11px] text-teal-700 truncate">
                    {user?.email}
                  </div>
                </div>
                <span className="text-xs font-extrabold text-teal-700 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                  {overallProgress.label}
                </span>
              </div>

              {mode === 'local' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>切换用户 {isUserA ? 'B' : 'A'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      resetDemoData();
                    }}
                    className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重置演示数据</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>退出当前账号</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar (Refined Dark Teal / Glassmorphic Dock) */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-mesh-teal text-white border-r border-teal-900/60 z-20 select-none">
        {/* Brand Identity Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-lg shadow-lg shadow-teal-950/50 ring-2 ring-white/15 shrink-0">
              <Compass className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  StudyFlow
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  学程
                </span>
              </div>
              <div className="text-xs text-teal-200/75 mt-0.5 truncate">
                大学生学习与项目管理平台
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-4 pt-5 pb-2">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-teal-300/60">
            Core Workspace · 核心模块
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/25 to-teal-400/10 text-white border border-teal-400/35 shadow-sm'
                      : 'text-teal-100/75 hover:bg-white/8 hover:text-white border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      {isActive && (
                        <span
                          className="w-1.5 h-6 rounded-full bg-orange-500 absolute left-1.5"
                          aria-hidden="true"
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                          isActive
                            ? 'bg-teal-400 text-slate-950 font-bold'
                            : 'bg-white/5 text-teal-200 group-hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="truncate">
                        <div className="leading-tight">{item.label}</div>
                        <div className="text-[10px] text-teal-200/55 font-normal">
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    {item.to === '/tasks' && overdueCount > 0 && (
                      <span
                        title={`${overdueCount} 项逾期任务待处理`}
                        className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500 text-white shrink-0"
                      >
                        {overdueCount}
                      </span>
                    )}
                    {item.to === '/projects' && activeProjectsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-teal-200 shrink-0">
                        {activeProjectsCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Mini Progress & Security Card in Sidebar */}
        <div className="p-4 space-y-3 border-t border-white/10 bg-black/20">
          {/* Overall Completion Mini Bar */}
          <div className="p-3.5 rounded-2xl bg-white/6 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-200/90 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
                总任务完成度
              </span>
              <span className="font-extrabold text-teal-300">
                {overallProgress.label}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${overallProgress.percentage ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-teal-200/65">
              <span>
                已完成 {overallProgress.completedTasks}/{overallProgress.totalTasks}
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                RLS 已启用
              </span>
            </div>
          </div>

          {/* Active User Card */}
          <div className="p-3 rounded-2xl bg-white/8 border border-white/10 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white truncate">
                {user?.displayName || '当前学生用户'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 font-semibold shrink-0">
                {isUserA ? 'User A' : 'User B'}
              </span>
            </div>
            <div className="text-[11px] text-teal-200/70 truncate">
              {user?.email}
            </div>
          </div>

          {/* Quick Demo Switcher & Reset */}
          {mode === 'local' && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 border border-orange-400/30 transition-colors cursor-pointer"
                title="一键切换账号以验证 AC-10 跨用户数据隔离"
              >
                <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>切至{isUserA ? '用户 B' : '用户 A'}</span>
              </button>
              <button
                type="button"
                onClick={resetDemoData}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-white/8 hover:bg-white/15 text-teal-100 border border-white/10 transition-colors cursor-pointer"
                title="恢复初始竞赛生演示数据"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>重置数据</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-100 border border-transparent hover:border-red-400/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>安全退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 min-w-0 flex flex-col">
        {/* Desktop Top Utility Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-teal-100/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-slate-900">
              {currentNavMeta.label}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/70">
              {currentNavMeta.sub}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                {overdueCount} 项逾期任务待处理
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              当前日期：{todayStr}
            </span>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
