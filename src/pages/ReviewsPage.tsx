import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import {
  addDays,
  formatWeekRange,
  getLocalDateString,
  normalizeToWeekMonday,
} from '../utils/dateUtils';
import {
  Button,
  EmptyState,
  FormError,
  PageHeader,
  Section,
  Tag,
  cx,
  inputClass,
  textareaClass,
} from '../components/ui';

const fields = [
  {
    key: 'achievements',
    idx: '01',
    label: '本周成果与收获',
    placeholder: '完成的竞赛训练专题、项目功能模块或技术突破',
  },
  {
    key: 'problems',
    idx: '02',
    label: '遇到的问题与反思',
    placeholder: '开发调试中的卡点、知识盲区或时间安排上的问题',
  },
  {
    key: 'next_plan',
    idx: '03',
    label: '下周计划与重点行动',
    placeholder: '下一周明确、可执行的目标与改进措施',
  },
] as const;

type FieldKey = (typeof fields)[number]['key'];

export const ReviewsPage: React.FC = () => {
  const { reviews, tasks, upsertWeeklyReview } = useStudyFlow();
  const currentMonday = useMemo(() => normalizeToWeekMonday(getLocalDateString()), []);

  const [selectedDateInput, setSelectedDateInput] = useState(currentMonday);
  const weekStart = useMemo(() => {
    try {
      return normalizeToWeekMonday(selectedDateInput);
    } catch {
      return currentMonday;
    }
  }, [selectedDateInput, currentMonday]);

  const existing = useMemo(() => reviews.find((r) => r.week_start === weekStart), [reviews, weekStart]);

  const [values, setValues] = useState<Record<FieldKey, string>>({
    achievements: '',
    problems: '',
    next_plan: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormError(null);
    setValues({
      achievements: existing?.achievements ?? '',
      problems: existing?.problems ?? '',
      next_plan: existing?.next_plan ?? '',
    });
  }, [existing, weekStart]);

  // 所选自然周内完成的任务数，按本地日期比较 completed_at
  const doneThisWeek = useMemo(() => {
    const weekEnd = addDays(weekStart, 6);
    return tasks.filter((t) => {
      if (t.status !== 'done' || !t.completed_at) return false;
      const day = getLocalDateString(new Date(t.completed_at));
      return day >= weekStart && day <= weekEnd;
    }).length;
  }, [tasks, weekStart]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!values.achievements.trim() && !values.problems.trim() && !values.next_plan.trim()) {
      setFormError('请至少填写本周成果、遇到的问题或下周计划中的一项');
      return;
    }
    setSaving(true);
    try {
      await upsertWeeklyReview({ week_start: weekStart, ...values });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存复盘失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        index="05"
        title="每周复盘"
        description="以周一为起点，每个自然周只保存一条复盘，重复保存会更新原记录（AC-08）。"
        actions={
          <div className="w-full sm:w-56">
            <label htmlFor="review-week-picker" className="block mb-1.5 text-xs font-semibold">
              选择这一周中的任意一天
            </label>
            <input
              id="review-week-picker"
              type="date"
              value={selectedDateInput}
              onChange={(e) => setSelectedDateInput(e.target.value)}
              className={inputClass}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-14">
        <section className="lg:col-span-7 border-t-2 border-ink">
          <div className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tabular-nums">{formatWeekRange(weekStart)}</h2>
              <p className="mt-1 text-xs text-muted tabular-nums">已自动对齐到周一 {weekStart}</p>
            </div>
            {existing ? <Tag tone="ink">已归档 · 保存将更新</Tag> : <Tag tone="accent">本周首次填写</Tag>}
          </div>

          <form onSubmit={handleSave} noValidate>
            <FormError message={formError} />
            {fields.map((f) => (
              <div key={f.key} className="grid grid-cols-12 gap-x-4 py-5 border-t border-line">
                <span className="col-span-12 sm:col-span-1 text-sm font-bold tabular-nums">{f.idx}</span>
                <div className="col-span-12 sm:col-span-11 mt-1 sm:mt-0">
                  <label htmlFor={`review-${f.key}`} className="block mb-2 text-sm font-semibold">
                    {f.label}
                  </label>
                  <textarea
                    id={`review-${f.key}`}
                    rows={4}
                    value={values[f.key]}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className={textareaClass}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-ink">
              <p className="text-xs text-muted">
                这一周完成了 <span className="text-base font-bold text-ink tabular-nums">{doneThisWeek}</span> 项任务
              </p>
              <Button type="submit" variant="accent" size="lg" disabled={saving}>
                <Save className="w-4 h-4" aria-hidden="true" />
                {saving ? '保存中…' : existing ? '更新本周复盘' : '保存本周复盘'}
              </Button>
            </div>
          </form>
        </section>

        <Section className="lg:col-span-5" title="历史复盘" tag={`${reviews.length} 周`}>
          {reviews.length === 0 ? (
            <EmptyState title="还没有历史复盘" description="在左侧填写并保存后会出现在这里。" />
          ) : (
            <ol className="border-t border-line">
              {reviews.map((rev) => {
                const selected = rev.week_start === weekStart;
                return (
                  <li key={rev.id} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => setSelectedDateInput(rev.week_start)}
                      aria-current={selected ? 'true' : undefined}
                      className={cx(
                        'relative w-full text-left py-4 pl-4 pr-1 cursor-pointer transition-colors',
                        selected ? 'bg-canvas' : 'hover:bg-canvas'
                      )}
                    >
                      <span
                        className={cx('absolute left-0 top-0 bottom-0 w-1', selected && 'bg-accent')}
                        aria-hidden="true"
                      />
                      <span className="block text-sm font-bold tabular-nums">{formatWeekRange(rev.week_start)}</span>
                      {rev.achievements && (
                        <span className="mt-2 block text-xs text-ink leading-relaxed line-clamp-2 whitespace-pre-line">
                          <span className="font-semibold">成果　</span>
                          {rev.achievements}
                        </span>
                      )}
                      {rev.next_plan && (
                        <span className="mt-1 block text-xs text-muted leading-relaxed line-clamp-2 whitespace-pre-line">
                          <span className="font-semibold text-ink">计划　</span>
                          {rev.next_plan}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Section>
      </div>
    </div>
  );
};
