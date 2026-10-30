import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FolderKanban,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Users,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { DEMO_USER_A, DEMO_USER_B } from '../services/seedData';

export const LoginPage: React.FC = () => {
  const { user, mode, signIn, signUp, quickSwitchDemoUser } = useStudyFlow();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(DEMO_USER_A.email);
  const [password, setPassword] = useState('123456');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '操作失败，请检查输入');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (which: 'A' | 'B') => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await quickSwitchDemoUser(which);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '演示登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Brand & Workflow Story Panel */}
      <div className="lg:w-1/2 bg-indigo-950 text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2.5 bg-indigo-900/80 border border-indigo-700/60 px-3.5 py-1.5 rounded-full text-xs font-medium text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>StudyFlow · 学程 —— 大学生学习与项目管理平台</span>
          </div>

          <h1 className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
            不止记录今天要做什么，
            <br />
            <span className="text-indigo-300">更看见向长期目标迈进的每一步。</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-indigo-200/90 leading-relaxed max-w-xl">
            面向大学生课程学习、程序设计竞赛训练与个人软件工程开发，构建“目标制定 → 项目规划 → 任务执行 → 进度统计 → 每周复盘”完整成长闭环。
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
            <div className="bg-indigo-900/50 border border-indigo-800/80 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <Target className="w-4 h-4 text-indigo-300 shrink-0" />
                <span>1. 目标与项目拆解</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-200/80 leading-relaxed">
                将中长期职业或竞赛目标拆解为具体项目，根据子任务自动核算实时完成率（如 3/5 完成即显示 60%）。
              </p>
            </div>

            <div className="bg-indigo-900/50 border border-indigo-800/80 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <FolderKanban className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>2. 计划与逾期督办</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-200/80 leading-relaxed">
                区分计划日期与截止日期，未完成且逾期的任务自动高亮预警；删除项目保留历史任务记录不丢失。
              </p>
            </div>

            <div className="bg-indigo-900/50 border border-indigo-800/80 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <BookOpenCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>3. 自然周复盘沉淀</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-200/80 leading-relaxed">
                按自然周（周一为起点）唯一归档本周成果、问题与改进计划，重复保存自动更新原记录。
              </p>
            </div>

            <div className="bg-indigo-900/50 border border-indigo-800/80 rounded-xl p-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
                <span>4. 行级安全隔离 (RLS)</span>
              </div>
              <p className="mt-1.5 text-xs text-indigo-200/80 leading-relaxed">
                基于 PostgreSQL RLS 与会话鉴权，严格隔离多用户数据，拦截跨用户读取与外键越权绑定。
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-indigo-900/80 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-300/80">
          <span>工程实践主线：从程序设计竞赛积累走向规范化软件工程开发</span>
          <span>MVP v1.0 · React + TS + Supabase/PostgreSQL</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              登录账号
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setEmail('');
                setPassword('');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              注册新账号
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {tab === 'login' ? '登录你的学习工作台' : '创建 StudyFlow 个人账号'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {tab === 'login'
                ? '使用邮箱与密码登录，进入个人专属的目标与项目管理空间。'
                : '注册后将自动为你初始化独立的个人学习数据库空间。'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  昵称 / 姓名（选填）
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="例如：杜同学"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                邮箱地址 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@edu.cn"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                密码（至少 6 位） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入至少 6 位密码"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>{tab === 'login' ? '立即登录' : '注册并进入工作台'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Section (for instant evaluation & AC-10 user isolation testing) */}
          {mode === 'local' && (
            <div className="pt-5 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  比赛演示与验收快捷入口（免输入一键登录）
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  含预设数据
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('A')}
                  className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      一键登录：竞赛生主账号 (User A)
                    </span>
                    <span className="text-[11px] font-medium text-indigo-700">
                      推荐演示 →
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    内置“算法竞赛 → 软件开发工程师转型”目标、StudyFlow 项目（3/5 完成率 60%）、逾期提醒及周复盘记录。
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('B')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-600 shrink-0" />
                      一键登录：隔离测试账号 (User B)
                    </span>
                    <span className="text-[11px] text-slate-500">验证 AC-10</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    独立账户空间（账号：{DEMO_USER_B.email}），用于对比验证用户 A 与用户 B 的数据完全隔离。
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
