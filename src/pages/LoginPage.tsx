import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
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
    <div className="min-h-screen bg-[#F6F5F2] text-[#0A0A0A] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Column: Swiss International Typographic Poster Grid */}
      <div className="lg:w-[56%] border-b-2 lg:border-b-0 lg:border-r-2 border-[#0A0A0A] flex flex-col justify-between bg-white">
        {/* Top Meta Strip */}
        <div className="grid grid-cols-3 border-b-2 border-[#0A0A0A] font-mono-swiss text-[11px] font-bold">
          <div className="p-3 sm:p-4 border-r border-[#0A0A0A] flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#E61919] inline-block shrink-0" />
            <span>STUDYFLOW // 学程</span>
          </div>
          <div className="p-3 sm:p-4 border-r border-[#0A0A0A] text-[#525252] truncate">
            SWISS GRID SYSTEM
          </div>
          <div className="p-3 sm:p-4 text-right">SPEC // MVP v1.0</div>
        </div>

        {/* Hero Typographic Statement */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-6">
          <div className="inline-block px-2.5 py-1 bg-[#0A0A0A] text-white font-mono-swiss text-xs font-bold uppercase tracking-widest">
            UNIVERSITY LEARNING & PROJECT ARCHITECTURE
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tighter leading-[1.06] uppercase">
            不止记录待办，
            <br />
            <span className="text-[#E61919]">构建目标与工程</span>
            <br />
            的精确闭环。
          </h1>

          <p className="text-sm sm:text-base text-[#525252] max-w-xl leading-relaxed font-medium">
            面向大学生课程学习、程序设计竞赛训练（蓝桥杯 / 码蹄杯 / 天梯赛）与个人软件工程开发，以瑞士网格秩序串联
            <strong className="text-[#0A0A0A] font-extrabold mx-1">
              目标制定 → 项目规划 → 任务执行 → 进度统计 → 周期复盘
            </strong>
            全流程。
          </p>
        </div>

        {/* 4-Cell Swiss Specification Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-[#0A0A0A]">
          <div className="p-5 sm:p-6 border-b sm:border-r border-[#0A0A0A] space-y-2">
            <div className="flex items-center justify-between font-mono-swiss text-xs font-bold">
              <span className="text-[#E61919]">01 / GOALS & PROJECTS</span>
              <span>[AC-06]</span>
            </div>
            <div className="text-base font-extrabold">
              目标拆解与 60% 实时完成率
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              项目进度由子任务自动核算（如 5 项任务完成 3 项即精确输出 60%），删除项目自动保留历史任务并解除关联（AC-04）。
            </p>
          </div>

          <div className="p-5 sm:p-6 border-b border-[#0A0A0A] space-y-2">
            <div className="flex items-center justify-between font-mono-swiss text-xs font-bold">
              <span className="text-[#E61919]">02 / OVERDUE CONTROL</span>
              <span>[AC-05]</span>
            </div>
            <div className="text-base font-extrabold">
              计划日期与逾期高亮督办
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              区分计划执行日（planned_date）与最后截止日（due_date），未完成且逾期的任务自动触发瑞士红高对比警示。
            </p>
          </div>

          <div className="p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-[#0A0A0A] space-y-2">
            <div className="flex items-center justify-between font-mono-swiss text-xs font-bold">
              <span className="text-[#E61919]">03 / WEEKLY UPSERT</span>
              <span>[AC-08]</span>
            </div>
            <div className="text-base font-extrabold">
              自然周唯一复盘归档
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              自动将所选日期归一化至所在周周一（week_start），同一自然周重复保存自动覆盖更新原记录，杜绝重复归档。
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-2 bg-[#F6F5F2]">
            <div className="flex items-center justify-between font-mono-swiss text-xs font-bold">
              <span className="text-[#E61919]">04 / POSTGRESQL RLS</span>
              <span>[AC-10]</span>
            </div>
            <div className="text-base font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>行级安全与多用户隔离</span>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              严格校验 user_id 所有权与外键归属，彻底阻断跨用户读取、篡改或将任务绑定至他人项目的越权行为。
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Sharp Swiss Authentication Console */}
      <div className="lg:w-[44%] flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A]">
          {/* Mode Switch Header */}
          <div className="grid grid-cols-2 border-b-2 border-[#0A0A0A]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              className={`min-h-[48px] font-mono-swiss text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-colors ${
                tab === 'login'
                  ? 'bg-[#0A0A0A] text-white'
                  : 'bg-[#F6F5F2] text-[#0A0A0A] hover:bg-neutral-200'
              }`}
            >
              01 // 登录 LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setEmail('');
                setPassword('');
                setErrorMsg(null);
              }}
              className={`min-h-[48px] font-mono-swiss text-xs font-extrabold uppercase tracking-wider border-l-2 border-[#0A0A0A] cursor-pointer transition-colors ${
                tab === 'register'
                  ? 'bg-[#0A0A0A] text-white'
                  : 'bg-[#F6F5F2] text-[#0A0A0A] hover:bg-neutral-200'
              }`}
            >
              02 // 注册 REGISTER
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-l-4 border-[#E61919] pl-3.5">
              <h2 className="text-xl font-black tracking-tight">
                {tab === 'login' ? '身份认证与工作台入口' : '注册新学生账户'}
              </h2>
              <p className="text-xs text-[#525252] mt-0.5">
                {tab === 'login'
                  ? '验证身份以载入个人专属目标、项目与周复盘数据。'
                  : '创建全新隔离账户，支持完整 CRUD 与持久化验证。'}
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 bg-[#E61919] text-white border border-[#0A0A0A] text-xs font-bold"
              >
                ERROR // {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {tab === 'register' && (
                <div>
                  <label
                    htmlFor="register-name"
                    className="block font-mono-swiss text-[11px] font-bold uppercase text-[#0A0A0A] mb-1.5"
                  >
                    DISPLAY NAME / 姓名昵称
                  </label>
                  <div className="relative">
                    <User
                      className="w-4 h-4 text-[#525252] absolute left-3.5 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      id="register-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="例如：杜同学"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#0A0A0A] bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block font-mono-swiss text-[11px] font-bold uppercase text-[#0A0A0A] mb-1.5"
                >
                  EMAIL ADDRESS / 邮箱 <span className="text-[#E61919]">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-[#525252] absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coder@studyflow.edu.cn"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono-swiss border border-[#0A0A0A] bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block font-mono-swiss text-[11px] font-bold uppercase text-[#0A0A0A] mb-1.5"
                >
                  PASSWORD / 密码（&gt;=6位）{' '}
                  <span className="text-[#E61919]">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-[#525252] absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono-swiss border border-[#0A0A0A] bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[46px] w-full swiss-btn-accent py-2.5 px-5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {tab === 'login'
                    ? '进入工作台 // ENTER WORKSPACE'
                    : '创建账户 // CREATE ACCOUNT'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            {/* Quick Demo Passkeys */}
            {mode === 'local' && (
              <div className="pt-5 border-t-2 border-[#0A0A0A] space-y-3">
                <div className="flex items-center justify-between font-mono-swiss text-[11px] font-bold">
                  <span>QUICK ACCESS // 答辩免密通道</span>
                  <span className="px-1.5 py-0.5 bg-[#0A0A0A] text-white">
                    SEED READY
                  </span>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('A')}
                    className="w-full text-left p-3.5 border border-[#0A0A0A] bg-[#F6F5F2] hover:bg-[#0A0A0A] hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-2">
                        <CheckCircle2
                          className="w-4 h-4 text-[#E61919] shrink-0"
                          aria-hidden="true"
                        />
                        <span>一键进入：竞赛生主账号 (User A)</span>
                      </span>
                      <span className="font-mono-swiss text-[11px] font-bold text-[#E61919] group-hover:text-white">
                        [ENTER →]
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#525252] group-hover:text-neutral-300 leading-relaxed">
                      预置“算法竞赛 → 软件开发工程师转型”目标、StudyFlow 项目（3/5 完成率 60%）、逾期警示与周复盘。
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('B')}
                    className="w-full text-left p-3.5 border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-2">
                        <Users
                          className="w-4 h-4 text-[#0A0A0A] group-hover:text-white shrink-0"
                          aria-hidden="true"
                        />
                        <span>一键进入：隔离测试账号 (User B)</span>
                      </span>
                      <span className="font-mono-swiss text-[11px] text-[#525252] group-hover:text-neutral-300">
                        [AC-10 隔离]
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#525252] group-hover:text-neutral-300">
                      独立账户（{DEMO_USER_B.email}），用于现场对比验证多用户数据隔离。
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
