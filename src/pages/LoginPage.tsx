import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Compass,
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
    <div className="min-h-screen bg-canvas-pattern flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Hero & Bento Feature Showcase */}
      <div className="lg:w-[55%] bg-mesh-teal text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div className="space-y-6 relative z-10">
          {/* Brand Pill */}
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-xs font-bold text-teal-200">
            <Compass className="w-4 h-4 text-teal-300" aria-hidden="true" />
            <span>StudyFlow · 学程 —— 大学生学习与项目管理平台</span>
          </div>

          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight leading-[1.18]">
              从算法竞赛到软件工程，
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-orange-300">
                让每一次努力都汇聚成可见的成长。
              </span>
            </h1>
            <p className="text-sm sm:text-base text-teal-100/80 leading-relaxed">
              面向大学生专业学习、程序设计竞赛与个人工程项目开发，打造
              <strong className="text-white font-semibold mx-1">
                “目标制定 → 项目规划 → 任务执行 → 进度统计 → 周期复盘”
              </strong>
              全链路个人工程管理工作台。
            </p>
          </div>

          {/* Bento Grid Visual Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2 max-w-2xl">
            {/* Bento Tile 1: Live Project Progress Preview (7 cols) */}
            <div className="sm:col-span-7 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
                    Bento Progress Engine · AC-06
                  </span>
                  <h2 className="text-base font-bold text-white mt-1">
                    StudyFlow 平台 MVP 研发进度
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-orange-500 text-slate-950 font-black text-xs shrink-0">
                  60% 已完成
                </span>
              </div>

              <div className="space-y-2">
                <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-300 to-orange-400"
                    style={{ width: '60%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-teal-200/85">
                  <span>子任务自动核算：3 / 5 项已完成</span>
                  <span>删项目自动保留任务 (AC-04)</span>
                </div>
              </div>
            </div>

            {/* Bento Tile 2: Security & RLS Isolation (5 cols) */}
            <div className="sm:col-span-5 rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 p-5 flex flex-col justify-between gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-400/20 border border-teal-300/30 flex items-center justify-center text-teal-300">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  PostgreSQL RLS 安全隔离
                </h2>
                <p className="text-xs text-teal-100/75 mt-1 leading-relaxed">
                  行级安全策略严格隔离多用户数据，自动拦截跨用户读取与外键越权关联（AC-10）。
                </p>
              </div>
            </div>

            {/* Bento Tile 3: 4 Core Pillars Row (12 cols) */}
            <div className="sm:col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  icon: Target,
                  title: '目标管理',
                  desc: '长期方向拆解',
                },
                {
                  icon: FolderKanban,
                  title: '项目里程碑',
                  desc: '实时进度百分比',
                },
                {
                  icon: Sparkles,
                  title: '逾期督办',
                  desc: '计划与截止预警',
                },
                {
                  icon: BookOpenCheck,
                  title: '自然周复盘',
                  desc: '同周 Upsert 防重',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl bg-white/6 border border-white/10 p-3.5 space-y-1"
                  >
                    <Icon
                      className="w-4 h-4 text-teal-300"
                      aria-hidden="true"
                    />
                    <div className="text-xs font-bold text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-teal-200/70">
                      {item.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Badges */}
        <div className="mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-200/75 relative z-10">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400" aria-hidden="true" />
            <span>成长主线：码蹄杯省赛银奖 / 蓝桥杯省三 → 软件开发工程师工程实践</span>
          </div>
          <span className="font-semibold text-teal-300">
            React 19 + TypeScript + Supabase RLS
          </span>
        </div>
      </div>

      {/* Right Authentication & Quick Demo Switcher Panel */}
      <div className="lg:w-[45%] flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bento-card p-6 sm:p-8 space-y-6 bg-white">
          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`min-h-[42px] py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-teal-700 text-white shadow-sm'
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
              className={`min-h-[42px] py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              注册新账号
            </button>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {tab === 'login'
                ? '欢迎回到 StudyFlow 工作台'
                : '创建你的个人学习空间'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {tab === 'login'
                ? '登录以管理你的学习目标、开发项目与每周成长复盘。'
                : '注册后系统将为你分配独立隔离的个人学习数据库。'}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {tab === 'register' && (
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  姓名 / 昵称（选填）
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="register-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="例如：杜同学"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                邮箱地址 <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coder@studyflow.edu.cn"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                登录密码（至少 6 位） <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入至少 6 位密码"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-teal-900/10 transition-all cursor-pointer"
            >
              <span>{tab === 'login' ? '进入学习工作台' : '立即注册并登录'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* One-Click Demo Passkeys */}
          {mode === 'local' && (
            <div className="pt-5 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">
                  比赛答辩一键体验通道（免输密码）
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  预置真实案例
                </span>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('A')}
                  className="w-full text-left p-3.5 rounded-2xl border-2 border-teal-600/30 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-teal-950 flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-teal-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span>一键进入：竞赛生主账号 (User A)</span>
                    </span>
                    <span className="text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                      推荐演示 →
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                    内置“算法竞赛 → 软件开发工程师转型”目标、StudyFlow 项目（3/5 完成度 60%）、逾期警示与双周复盘。
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('B')}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Users
                        className="w-4 h-4 text-orange-600 shrink-0"
                        aria-hidden="true"
                      />
                      <span>一键进入：隔离测试账号 (User B)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      验证 AC-10 隔离
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    独立账户（{DEMO_USER_B.email}），用于现场对比演示多用户 RLS 数据完全隔离。
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
