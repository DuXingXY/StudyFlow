import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, RefreshCw, Users, X } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { DEMO_USER_A, DEMO_USER_B } from '../services/seedData';
import { calculateProjectProgress, getLocalDateString, isTaskOverdue } from '../utils/dateUtils';
import { Button, ProgressBar, cx } from './ui';

const navItems = [
  { index: '01', to: '/dashboard', label: '学习总览' },
  { index: '02', to: '/goals', label: '学习目标' },
  { index: '03', to: '/projects', label: '我的项目' },
  { index: '04', to: '/tasks', label: '任务中心' },
  { index: '05', to: '/reviews', label: '每周复盘' },
];

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const AppLayout: React.FC = () => {
  const { user, mode, tasks, projects, toast, clearToast, runAction, signOut, quickSwitchDemoUser, resetDemoData } =
    useStudyFlow();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const todayStr = getLocalDateString();
  const progress = useMemo(() => calculateProjectProgress(tasks), [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => isTaskOverdue(t, todayStr)).length, [tasks, todayStr]);
  const activeProjectsCount = useMemo(() => projects.filter((p) => p.status === 'active').length, [projects]);

  // 只有两个预置演示账号才显示 A / B 身份；自行注册的本地账号不归入任何一方
  const demoSlot = user?.id === DEMO_USER_A.id ? 'A' : user?.id === DEMO_USER_B.id ? 'B' : null;
  const switchTarget: 'A' | 'B' = demoSlot === 'A' ? 'B' : 'A';
  const currentLabel = location.pathname.startsWith('/projects/')
    ? '项目详情'
    : (navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? '学习总览');

  const closeMenu = () => setMobileMenuOpen(false);
  const handleLogout = () =>
    runAction(async () => {
      closeMenu();
      await signOut();
      navigate('/login', { replace: true });
    });
  const handleSwitch = () =>
    runAction(async () => {
      closeMenu();
      await quickSwitchDemoUser(switchTarget);
    });
  const handleReset = () => {
    if (!window.confirm('重置会覆盖当前浏览器中的本地修改，恢复初始演示数据。确定继续？')) return;
    closeMenu();
    void runAction(resetDemoData);
  };

  const nav = (
    <nav aria-label="主导航">
      <ul>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                cx(
                  'relative flex items-center gap-4 h-12 px-6 text-[15px] transition-colors',
                  isActive ? 'font-bold text-ink' : 'text-muted hover:text-ink'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('absolute left-0 top-3 bottom-3 w-1', isActive && 'bg-accent')} aria-hidden="true" />
                  <span className="w-5 text-xs tabular-nums">{item.index}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/tasks' && overdueCount > 0 && (
                    <span className="text-xs font-bold text-accent tabular-nums">{overdueCount} 逾期</span>
                  )}
                  {item.to === '/projects' && activeProjectsCount > 0 && (
                    <span className="text-xs text-muted tabular-nums" title="进行中项目">{activeProjectsCount}</span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  const accountPanel = (
    <div className="px-6 py-5 space-y-5 border-t border-ink">
      <div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold">总完成率</span>
          <span className="text-muted tabular-nums">{progress.completedTasks} / {progress.totalTasks}</span>
        </div>
        <div className="mt-2 text-3xl font-bold leading-none tabular-nums">
          {progress.percentage === null ? '—' : `${progress.percentage}%`}
        </div>
        <ProgressBar value={progress.percentage} label="总任务完成率" className="mt-3" />
      </div>
      <div className="text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate">{user?.displayName || '当前用户'}</span>
          <span className="text-muted shrink-0">{mode === 'supabase' ? '云端 RLS' : '本地模式'}</span>
        </div>
        <div className="mt-0.5 text-muted truncate">{user?.email}</div>
      </div>
      {mode === 'local' && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleSwitch} title="切换账号，验证跨用户数据隔离（AC-10）">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            切换至用户 {switchTarget}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            重置数据
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 h-9 text-xs font-semibold text-muted hover:text-accent cursor-pointer transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
        退出登录
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-ink md:flex">
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cx(
            'fixed z-[60] top-3 inset-x-3 md:inset-x-auto md:top-6 md:right-6 md:w-96 flex items-start gap-2 pl-4 text-sm text-white',
            toast.type === 'error' ? 'bg-accent' : 'bg-ink'
          )}
        >
          <p className="flex-1 py-3 break-words">{toast.message}</p>
          <button type="button" onClick={clearToast} aria-label="关闭通知" className="w-11 h-11 shrink-0 flex items-center justify-center text-white/70 hover:text-white cursor-pointer">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <header className="md:hidden sticky top-0 z-30 h-14 px-4 bg-white border-b border-ink flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-3 h-3 bg-accent shrink-0" aria-hidden="true" />
          <span className="text-[17px] font-bold tracking-tight">StudyFlow</span>
          <span className="text-xs text-muted truncate">{currentLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? '收起导航菜单' : '展开导航菜单'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav"
          className="w-11 h-11 -mr-2 flex items-center justify-center cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div id="mobile-nav" className="md:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-white overflow-y-auto flex flex-col">
          <div className="flex-1 py-3">{nav}</div>
          {accountPanel}
        </div>
      )}

      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-line z-20">
        <div className="px-6 pt-7 pb-7">
          <span className="block w-4 h-4 bg-accent" aria-hidden="true" />
          <div className="mt-4 text-[26px] font-bold tracking-tight leading-none">StudyFlow</div>
          <div className="mt-2 text-xs text-muted">学程 · 大学生学习与项目管理</div>
          <div className="mt-6 text-xs tabular-nums">
            <span className="font-semibold">{todayStr}</span>
            <span className="ml-2 text-muted">{WEEKDAYS[new Date().getDay()]}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto border-t border-ink pt-3">{nav}</div>
        {accountPanel}
      </aside>

      <div className="flex-1 min-w-0 md:pl-64">
        <main className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-10 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
