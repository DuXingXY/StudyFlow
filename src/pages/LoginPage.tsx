import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import { DEMO_USER_A, DEMO_USER_B } from '../services/seedData';
import { Button, Field, FormError, Segmented, inputClass } from '../components/ui';

const loopSteps = [
  { idx: '01', name: '目标制定', desc: '确立中长期学习与职业方向' },
  { idx: '02', name: '项目规划', desc: '把目标拆成可交付的项目', ac: 'AC-03' },
  { idx: '03', name: '任务执行', desc: '计划日期、截止日期与逾期提醒', ac: 'AC-05' },
  { idx: '04', name: '进度统计', desc: '按子任务自动计算完成率', ac: 'AC-06' },
  { idx: '05', name: '周期复盘', desc: '每个自然周唯一一条复盘', ac: 'AC-08' },
];

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

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setErrorMsg(null);
    if (next === 'register') {
      setEmail('');
      setPassword('');
    }
  };

  const run = async (action: () => Promise<void>, fallback: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await action();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : fallback);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(
      () => (tab === 'login' ? signIn(email, password) : signUp(email, password, displayName)),
      '操作失败，请检查输入'
    );
  };

  return (
    <div className="min-h-screen bg-white text-ink lg:grid lg:grid-cols-12">
      {/* 左：海报式排版 */}
      <section className="lg:col-span-7 px-5 sm:px-10 lg:px-14 pt-6 sm:pt-10 pb-12 lg:pb-14 flex flex-col bg-canvas">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 font-semibold">
            <span className="w-3 h-3 bg-accent" aria-hidden="true" />
            StudyFlow 学程
          </span>
          <span className="text-muted">MVP v1.0</span>
        </div>

        <div className="mt-14 sm:mt-24 lg:mt-auto">
          <h1 className="text-[44px] sm:text-7xl xl:text-[88px] font-bold leading-[1.02] tracking-tight">
            把长期目标
            <br />
            拆成<span className="text-accent">每天</span>
            <br />
            可验证的进度。
          </h1>
          <p className="mt-6 sm:mt-8 max-w-lg text-sm sm:text-base text-muted leading-relaxed">
            面向大学生课程学习、程序设计竞赛训练（蓝桥杯 / 码蹄杯 / 天梯赛）与个人软件开发，
            用一条闭环串起每一步。
          </p>
        </div>

        <ol className="mt-10 sm:mt-14 lg:mt-16 border-t-2 border-ink">
          {loopSteps.map((step) => (
            <li
              key={step.idx}
              className="grid grid-cols-12 gap-x-4 items-baseline py-3 border-b border-line-strong text-sm"
            >
              <span className="col-span-2 sm:col-span-1 tabular-nums font-bold">{step.idx}</span>
              <span className="col-span-10 sm:col-span-3 font-bold">{step.name}</span>
              <span className="col-span-10 col-start-3 sm:col-span-6 sm:col-start-auto text-muted">
                {step.desc}
              </span>
              <span className="hidden sm:block sm:col-span-2 text-right text-[11px] text-muted">
                {step.ac}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">每个账号的数据严格隔离，无法读取或关联他人记录（AC-10）。</p>
      </section>

      {/* 右：登录表单 */}
      <section className="lg:col-span-5 px-5 sm:px-10 lg:px-14 py-12 lg:py-14 flex items-center">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <Segmented
            label="登录或注册"
            value={tab}
            onChange={switchTab}
            options={[
              { key: 'login', label: '登录' },
              { key: 'register', label: '注册' },
            ]}
          />

          <h2 className="mt-8 text-2xl font-bold">
            {tab === 'login' ? '进入你的学习工作台' : '创建新的学生账户'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {tab === 'login'
              ? '登录后载入个人专属的目标、项目、任务与周复盘。'
              : '新账户的数据与其他账户完全隔离。'}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <FormError message={errorMsg} />
            {tab === 'register' && (
              <Field label="姓名或昵称" htmlFor="register-name" hint="选填">
                <input
                  id="register-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例如：杜同学"
                  autoComplete="nickname"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="邮箱" htmlFor="auth-email" required>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coder@studyflow.edu.cn"
                autoComplete="email"
                className={inputClass}
              />
            </Field>
            <Field label="密码" htmlFor="auth-password" required hint="至少 6 位">
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                className={inputClass}
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full">
              {submitting ? '请稍候…' : tab === 'login' ? '进入工作台' : '创建账户'}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>

          {mode === 'local' && (
            <div className="mt-10">
              <div className="flex items-baseline justify-between border-t-2 border-ink pt-3 text-xs">
                <span className="font-bold">演示账号</span>
                <span className="text-muted">免密直接进入</span>
              </div>
              {[
                {
                  which: 'A' as const,
                  title: '一键进入：竞赛生主账号 (User A)',
                  desc: '预置转型目标、StudyFlow 项目（3/5 = 60%）、逾期任务与周复盘。',
                },
                {
                  which: 'B' as const,
                  title: '一键进入：隔离测试账号 (User B)',
                  desc: `独立账户 ${DEMO_USER_B.email}，用于对比验证多用户数据隔离。`,
                },
              ].map((item) => (
                <button
                  key={item.which}
                  type="button"
                  disabled={submitting}
                  onClick={() => void run(() => quickSwitchDemoUser(item.which), '演示登录失败')}
                  className="group w-full flex items-start gap-4 py-4 border-b border-line text-left cursor-pointer disabled:opacity-40"
                >
                  <span className="w-6 text-sm font-bold tabular-nums">{item.which}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold group-hover:text-accent transition-colors">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted leading-relaxed">{item.desc}</span>
                  </span>
                  <ArrowRight
                    className="w-4 h-4 mt-0.5 shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
