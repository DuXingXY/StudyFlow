import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpenCheck,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
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
    index: '01',
    to: '/dashboard',
    label: '学习总览',
    en: 'OVERVIEW',
    icon: LayoutDashboard,
  },
  {
    index: '02',
    to: '/goals',
    label: '学习目标',
    en: 'GOALS',
    icon: Target,
  },
  {
    index: '03',
    to: '/projects',
    label: '我的项目',
    en: 'PROJECTS',
    icon: FolderKanban,
  },
  {
    index: '04',
    to: '/tasks',
    label: '任务中心',
    en: 'TASKS',
    icon: CheckSquare,
  },
  {
    index: '05',
    to: '/reviews',
    label: '每周复盘',
    en: 'REVIEWS',
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
      return {
        index: '03.1',
        label: '项目详情与子任务',
        en: 'PROJECT SPECIFICATION',
      };
    }
    return (
      navItems.find((item) => location.pathname.startsWith(item.to)) ??
      navItems[0]
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#0A0A0A] flex flex-col md:flex-row overflow-x-hidden">
      {/* Swiss High-Contrast Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-50 flex items-center justify-between gap-3 px-4 py-3 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] text-xs font-bold tracking-wide ${
            toast.type === 'error'
              ? 'bg-[#E61919] text-white'
              : 'bg-[#0A0A0A] text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono-swiss uppercase px-1.5 py-0.5 bg-white text-[#0A0A0A] text-[10px] font-extrabold shrink-0">
              {toast.type === 'error' ? 'ERR' : 'SYS'}
            </span>
            <span className="break-words">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={clearToast}
            className="min-w-[32px] min-h-[32px] flex items-center justify-center border border-white/40 hover:bg-white hover:text-[#0A0A0A] shrink-0 cursor-pointer transition-colors"
            aria-label="关闭通知"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Mobile Top Header (< md, 390px strict Swiss grid bar) */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b-2 border-[#0A0A0A] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-4 h-4 bg-[#E61919] border border-[#0A0A0A] shrink-0"
            aria-hidden="true"
          />
          <div className="truncate">
            <span className="font-black tracking-tighter text-base uppercase">
              STUDYFLOW
            </span>
            <span className="ml-2 font-mono-swiss text-[11px] text-[#525252]">
              // {currentNavMeta.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white cursor-pointer transition-colors"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-40 bg-[#0A0A0A]/60">
          <div className="bg-white border-b-2 border-[#0A0A0A] divide-y divide-[#0A0A0A] max-h-[calc(100vh-65px)] overflow-y-auto">
            <nav className="divide-y divide-[#D4D4D0]" aria-label="移动端主导航">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `min-h-[48px] flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white'
                        : 'bg-white text-[#0A0A0A] hover:bg-[#F6F5F2]'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono-swiss text-xs text-[#E61919] font-bold">
                      {item.index}
                    </span>
                    <span>{item.label}</span>
                  </span>
                  <span className="font-mono-swiss text-[10px] tracking-widest opacity-60">
                    {item.en}
                  </span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 space-y-3 bg-[#F6F5F2]">
              <div className="flex items-center justify-between text-xs font-mono-swiss">
                <span className="truncate font-bold">
                  {user?.displayName || user?.email}
                </span>
                <span className="px-2 py-0.5 border border-[#0A0A0A] bg-white font-bold">
                  {overallProgress.label}
                </span>
              </div>

              {mode === 'local' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                    className="min-h-[44px] swiss-btn-outline text-xs px-3 py-2 flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>切至用户 {isUserA ? 'B' : 'A'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      resetDemoData();
                    }}
                    className="min-h-[44px] swiss-btn-outline text-xs px-3 py-2 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重置数据</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] w-full swiss-btn-primary text-xs px-3 py-2 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>退出当前账户 / LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Architectural Grid Sidebar */}
      <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-white border-r-2 border-[#0A0A0A] z-20 select-none">
        {/* Swiss Masthead */}
        <div className="p-6 border-b-2 border-[#0A0A0A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono-swiss text-[10px] font-bold tracking-widest uppercase text-[#525252]">
              SYS // 2026.V1
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono-swiss text-[10px] font-bold uppercase text-[#E61919]">
              <span className="w-2 h-2 bg-[#E61919] inline-block" />
              SWISS GRID
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black tracking-tighter uppercase leading-none">
              STUDYFLOW
            </span>
            <span className="text-xs font-extrabold border border-[#0A0A0A] px-1.5 py-0.5">
              学程
            </span>
          </div>
          <p className="text-[11px] text-[#525252] font-medium">
            大学生学习与项目管理平台
          </p>
        </div>

        {/* Section Index Header */}
        <div className="px-5 py-2.5 bg-[#F6F5F2] border-b border-[#0A0A0A] flex items-center justify-between font-mono-swiss text-[10px] font-bold uppercase tracking-wider text-[#525252]">
          <span>INDEX / MODULE</span>
          <span>STATUS</span>
        </div>

        {/* Exposed Grid Navigation */}
        <nav className="flex-1 divide-y divide-[#D4D4D0] overflow-y-auto" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center justify-between px-5 py-4 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#0A0A0A] text-white font-extrabold'
                      : 'bg-white text-[#0A0A0A] hover:bg-[#F6F5F2] font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E61919]"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`font-mono-swiss text-xs font-bold ${
                          isActive ? 'text-[#E61919]' : 'text-[#525252]'
                        }`}
                      >
                        {item.index}
                      </span>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-[#0A0A0A]'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="truncate">
                        <div className="leading-none">{item.label}</div>
                        <div
                          className={`font-mono-swiss text-[10px] tracking-widest mt-1 ${
                            isActive ? 'text-neutral-400' : 'text-[#525252]'
                          }`}
                        >
                          {item.en}
                        </div>
                      </div>
                    </div>

                    {item.to === '/tasks' && overdueCount > 0 && (
                      <span
                        title={`${overdueCount} 项逾期任务`}
                        className="font-mono-swiss px-1.5 py-0.5 text-[11px] font-extrabold bg-[#E61919] text-white shrink-0"
                      >
                        !{overdueCount}
                      </span>
                    )}
                    {item.to === '/projects' && activeProjectsCount > 0 && (
                      <span
                        className={`font-mono-swiss px-1.5 py-0.5 text-[11px] font-bold border ${
                          isActive
                            ? 'border-white/40 text-white'
                            : 'border-[#0A0A0A] text-[#0A0A0A]'
                        }`}
                      >
                        {activeProjectsCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Specification & User Control Block */}
        <div className="border-t-2 border-[#0A0A0A] divide-y divide-[#0A0A0A] bg-white">
          {/* Metric Bar */}
          <div className="p-4 space-y-2 bg-[#F6F5F2]">
            <div className="flex items-center justify-between font-mono-swiss text-xs">
              <span className="font-bold uppercase">TOTAL COMPLETION</span>
              <span className="font-extrabold text-[#E61919]">
                {overallProgress.label}
              </span>
            </div>
            <div className="w-full h-2.5 border border-[#0A0A0A] bg-white">
              <div
                className="h-full bg-[#0A0A0A] transition-all duration-200"
                style={{ width: `${overallProgress.percentage ?? 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between font-mono-swiss text-[10px] text-[#525252]">
              <span>
                DONE: {overallProgress.completedTasks}/{overallProgress.totalTasks}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0A0A0A]">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                {mode === 'supabase' ? 'CLOUD RLS' : 'LOCAL RLS'}
              </span>
            </div>
          </div>

          {/* Active User Block */}
          <div className="p-4 space-y-3">
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold truncate">
                  {user?.displayName || '当前用户'}
                </span>
                <span className="font-mono-swiss text-[10px] font-bold px-1.5 py-0.5 bg-[#0A0A0A] text-white shrink-0">
                  {isUserA ? 'USER_A' : 'USER_B'}
                </span>
              </div>
              <div className="font-mono-swiss text-[11px] text-[#525252] truncate">
                {user?.email}
              </div>
            </div>

            {mode === 'local' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                  className="swiss-btn-outline py-1.5 px-2 text-[11px] flex items-center justify-center gap-1"
                  title="切换账户验证 AC-10 跨用户隔离"
                >
                  <Users className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>切至{isUserA ? '用户 B' : '用户 A'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="swiss-btn-outline py-1.5 px-2 text-[11px] flex items-center justify-center gap-1"
                  title="重置初始竞赛生数据"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>重置数据</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full swiss-btn-primary py-2 px-3 text-xs flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>退出登录 / SIGN OUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 min-w-0 flex flex-col">
        {/* Top Architectural Specification Strip */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b-2 border-[#0A0A0A] sticky top-0 z-10">
          <div className="flex items-center gap-3 font-mono-swiss text-xs">
            <span className="px-2 py-0.5 bg-[#0A0A0A] text-white font-bold">
              {currentNavMeta.index}
            </span>
            <span className="font-extrabold text-[#0A0A0A] text-sm">
              {currentNavMeta.label}
            </span>
            <span className="text-[#525252]">// {currentNavMeta.en}</span>
          </div>

          <div className="flex items-center gap-4 font-mono-swiss text-xs">
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E61919] text-white font-bold">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                OVERDUE: {overdueCount}
              </span>
            )}
            <span className="px-2.5 py-1 border border-[#0A0A0A] bg-[#F6F5F2] font-bold">
              DATE // {todayStr}
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
