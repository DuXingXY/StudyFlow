import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
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

const navItems = [
  { to: '/dashboard', label: '学习总览', icon: LayoutDashboard },
  { to: '/goals', label: '学习目标', icon: Target },
  { to: '/projects', label: '我的项目', icon: FolderKanban },
  { to: '/tasks', label: '任务中心', icon: CheckSquare },
  { to: '/reviews', label: '每周复盘', icon: BookOpenCheck },
];

export const AppLayout: React.FC = () => {
  const {
    user,
    mode,
    toast,
    clearToast,
    signOut,
    quickSwitchDemoUser,
    resetDemoData,
  } = useStudyFlow();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row overflow-x-hidden">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          className={`fixed top-3 right-3 left-3 md:left-auto md:max-w-md z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <span className="break-words">{toast.message}</span>
          <button
            type="button"
            onClick={clearToast}
            className="p-1 rounded-lg hover:bg-black/5 shrink-0"
            aria-label="关闭通知"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Top Header (visible < md, ensures 390px clean fit) */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            SF
          </div>
          <div className="truncate">
            <span className="font-bold text-slate-900 text-base">StudyFlow</span>
            <span className="ml-1.5 text-xs text-slate-500">学程</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          aria-label="展开或收起导航菜单"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Slide-Down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-40 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border-b border-slate-200 p-4 space-y-4 max-h-[calc(100vh-57px)] overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="text-xs text-slate-500">
                当前登录：
                <span className="font-semibold text-slate-800 ml-1 break-all">
                  {user?.displayName || user?.email}
                </span>
              </div>
              {mode === 'local' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                  >
                    <Users className="w-3.5 h-3.5" />
                    切换至 {isUserA ? '测试用户 B' : '竞赛生主账号 A'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      resetDemoData();
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重置演示数据
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-20">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              SF
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight">
                StudyFlow · 学程
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                大学生学习与项目管理
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User & Mode Status Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {mode === 'supabase' ? 'Supabase RLS 云端隔离' : '本地持久化 · RLS 隔离模式'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {user?.displayName || '当前用户'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            {user?.roleLabel && (
              <div className="text-[11px] text-indigo-600 font-medium pt-0.5 truncate">
                {user.roleLabel}
              </div>
            )}
          </div>

          {mode === 'local' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickSwitch(isUserA ? 'B' : 'A')}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                title="快速切换账号以验证 AC-10 多用户数据隔离"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>切换至{isUserA ? '测试用户 B (验证隔离)' : '竞赛生主账号 A'}</span>
              </button>
              <button
                type="button"
                onClick={resetDemoData}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>重置初始演示数据</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 min-w-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
