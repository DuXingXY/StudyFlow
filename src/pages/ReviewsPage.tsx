import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  History,
  Save,
  Sparkles,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  formatWeekRange,
  getLocalDateString,
  normalizeToWeekMonday,
} from '../utils/dateUtils';

export const ReviewsPage: React.FC = () => {
  const { reviews, tasks, upsertWeeklyReview } = useStudyFlow();
  const currentMonday = useMemo(
    () => normalizeToWeekMonday(getLocalDateString()),
    []
  );

  const [selectedDateInput, setSelectedDateInput] = useState(currentMonday);
  const normalizedWeekStart = useMemo(() => {
    try {
      return normalizeToWeekMonday(selectedDateInput);
    } catch {
      return currentMonday;
    }
  }, [selectedDateInput, currentMonday]);

  const existingReviewForWeek = useMemo(
    () => reviews.find((r) => r.week_start === normalizedWeekStart),
    [reviews, normalizedWeekStart]
  );

  const [achievements, setAchievements] = useState('');
  const [problems, setProblems] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync form fields whenever selected week changes or reviews list updates
  useEffect(() => {
    setFormError(null);
    if (existingReviewForWeek) {
      setAchievements(existingReviewForWeek.achievements);
      setProblems(existingReviewForWeek.problems);
      setNextPlan(existingReviewForWeek.next_plan);
    } else {
      setAchievements('');
      setProblems('');
      setNextPlan('');
    }
  }, [existingReviewForWeek, normalizedWeekStart]);

  const doneTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!achievements.trim() && !problems.trim() && !nextPlan.trim()) {
      setFormError('请至少填写本周成果、遇到的问题或下周计划中的一项');
      return;
    }
    setSaving(true);
    try {
      await upsertWeeklyReview({
        week_start: normalizedWeekStart,
        achievements,
        problems,
        next_plan: nextPlan,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存复盘失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>每周复盘 (Weekly Reviews)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            每位用户在每个自然周（周一为起点）仅保存唯一一条复盘，重复保存自动更新原记录（AC-08）。
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <label className="text-xs font-semibold text-slate-600 shrink-0">
            选择周内任意日期：
          </label>
          <input
            type="date"
            value={selectedDateInput}
            onChange={(e) => setSelectedDateInput(e.target.value)}
            className="text-xs font-semibold text-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Weekly Review Editor Form (Upsert) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-900">
                当前复盘自然周：{formatWeekRange(normalizedWeekStart)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                已自动对齐至所在周周一（`week_start = {normalizedWeekStart}`）
              </div>
            </div>

            {existingReviewForWeek ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                该周已有记录（保存将更新原记录）
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                该周首次填写
              </span>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. 本周成果与收获 (achievements)
              </label>
              <textarea
                rows={4}
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                placeholder="记录本周完成的竞赛训练专题、项目功能模块或技术突破..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                2. 遇到的问题与反思不足 (problems)
              </label>
              <textarea
                rows={4}
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                placeholder="记录开发调试中遇到的卡点、发现的知识盲区或时间安排上的问题..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                3. 下周改进计划与重点行动 (next_plan)
              </label>
              <textarea
                rows={4}
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
                placeholder="制定下一周明确可执行的目标与改进措施..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                当前累计已完成任务：{doneTasksCount} 项
              </span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? '保存中...'
                    : existingReviewForWeek
                    ? '更新本周复盘记录'
                    : '保存本周复盘记录'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Historical Reviews Timeline */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>历史周复盘归档 ({reviews.length})</span>
            </h2>
            <span className="text-[11px] text-slate-400">点击卡片可回填编辑</span>
          </div>

          {reviews.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              暂无历史周复盘记录，在左侧填写并保存后将自动归档于此。
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => {
                const isSelected = rev.week_start === normalizedWeekStart;
                return (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => setSelectedDateInput(rev.week_start)}
                    className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-700">
                        周次：{formatWeekRange(rev.week_start)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        周一 {rev.week_start}
                      </span>
                    </div>

                    {rev.achievements && (
                      <div className="text-xs text-slate-700 line-clamp-2 whitespace-pre-line">
                        <strong className="text-slate-900">成果：</strong>
                        {rev.achievements}
                      </div>
                    )}

                    {rev.problems && (
                      <div className="text-xs text-slate-600 line-clamp-2 whitespace-pre-line">
                        <strong className="text-slate-900">问题：</strong>
                        {rev.problems}
                      </div>
                    )}

                    {rev.next_plan && (
                      <div className="text-xs text-slate-600 line-clamp-2 whitespace-pre-line">
                        <strong className="text-slate-900">下周计划：</strong>
                        {rev.next_plan}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
