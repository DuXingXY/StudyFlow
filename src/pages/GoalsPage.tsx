import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Edit3,
  FolderKanban,
  Plus,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { Goal, GoalStatus } from '../types/models';
import { calculateProjectProgress } from '../utils/dateUtils';

const statusMeta: Record<
  GoalStatus,
  { label: string; code: string; badgeClass: string }
> = {
  active: {
    label: '进行中',
    code: 'ACTIVE',
    badgeClass: 'bg-[#0A0A0A] text-white border-[#0A0A0A]',
  },
  completed: {
    label: '已完成',
    code: 'DONE',
    badgeClass: 'bg-white text-[#0A0A0A] border-[#0A0A0A]',
  },
  paused: {
    label: '已暂停',
    code: 'PAUSED',
    badgeClass: 'bg-[#F6F5F2] text-[#525252] border-[#0A0A0A]',
  },
};

export const GoalsPage: React.FC = () => {
  const { goals, projects, tasks, createGoal, updateGoal, deleteGoal } =
    useStudyFlow();

  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredGoals = useMemo(() => {
    if (statusFilter === 'all') return goals;
    return goals.filter((g) => g.status === statusFilter);
  }, [goals, statusFilter]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setStatus('active');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description);
    setTargetDate(goal.target_date || '');
    setStatus(goal.status);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('请输入学习目标名称');
      return;
    }
    setSubmitting(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          title,
          description,
          target_date: targetDate || null,
          status,
        });
      } else {
        await createGoal({
          title,
          description,
          target_date: targetDate || null,
          status,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (goal: Goal) => {
    const linkedCount = projects.filter((p) => p.goal_id === goal.id).length;
    const msg =
      linkedCount > 0
        ? `确定删除学习目标“${goal.title}”吗？\n该目标下关联的 ${linkedCount} 个项目不会被删除，将自动转为独立项目。`
        : `确定删除学习目标“${goal.title}”吗？`;
    if (!window.confirm(msg)) return;
    await deleteGoal(goal.id);
  };

  return (
    <div className="space-y-6">
      {/* Swiss Section Header */}
      <div className="bg-white border-2 border-[#0A0A0A] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="font-mono-swiss text-xs font-bold text-[#E61919]">
            02 // LONG-TERM OBJECTIVES (AC-02)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
            学习目标管理 / GOALS
          </h1>
          <p className="text-xs sm:text-sm text-[#525252] font-medium">
            确立中长期职业发展、程序设计竞赛或专业课学习方向，并通过具体项目拆解落地。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[44px] swiss-btn-accent px-5 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>新建学习目标 / NEW GOAL</span>
        </button>
      </div>

      {/* Swiss Segmented Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-white border-2 border-[#0A0A0A] divide-y sm:divide-y-0 divide-x divide-[#0A0A0A]">
        {(
          [
            { key: 'all', label: '全部目标', count: goals.length },
            {
              key: 'active',
              label: '进行中',
              count: goals.filter((g) => g.status === 'active').length,
            },
            {
              key: 'completed',
              label: '已完成',
              count: goals.filter((g) => g.status === 'completed').length,
            },
            {
              key: 'paused',
              label: '已暂停',
              count: goals.filter((g) => g.status === 'paused').length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`min-h-[44px] px-4 py-2.5 flex items-center justify-between text-xs font-extrabold cursor-pointer transition-colors ${
              statusFilter === tab.key
                ? 'bg-[#0A0A0A] text-white'
                : 'bg-white text-[#0A0A0A] hover:bg-[#F6F5F2]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="font-mono-swiss">[{tab.count}]</span>
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center space-y-4">
          <Target className="w-8 h-8 mx-auto text-[#0A0A0A]" aria-hidden="true" />
          <div className="text-base font-black uppercase">
            当前筛选下暂无学习目标
          </div>
          <p className="text-xs text-[#525252] max-w-md mx-auto">
            建议先设立一个明确的阶段性目标（例如“冲刺程序设计竞赛省赛”或“完成软件开发工程师转型项目”），再围绕目标建立具体项目。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] swiss-btn-primary px-5 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            立即创建第一个目标
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal, idx) => {
            const linkedProjects = projects.filter((p) => p.goal_id === goal.id);
            const meta = statusMeta[goal.status];

            return (
              <div
                key={goal.id}
                className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]"
              >
                {/* Goal Header Row */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 font-mono-swiss text-xs">
                      <span className="font-extrabold text-[#E61919]">
                        GOAL.{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`px-2 py-0.5 border font-bold ${meta.badgeClass}`}
                      >
                        {meta.label} // {meta.code}
                      </span>
                      {goal.target_date && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#0A0A0A] bg-[#F6F5F2] font-bold">
                          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                          TARGET: {goal.target_date}
                        </span>
                      )}
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-[#0A0A0A] break-words">
                      {goal.title}
                    </h2>

                    {goal.description && (
                      <p className="text-xs sm:text-sm text-[#525252] leading-relaxed break-words">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      aria-label={`修改目标 ${goal.title} 的状态`}
                      value={goal.status}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          status: e.target.value as GoalStatus,
                        })
                      }
                      className="min-h-[38px] font-mono-swiss text-xs font-bold border border-[#0A0A0A] bg-[#F6F5F2] px-3 py-1.5 cursor-pointer"
                    >
                      <option value="active">状态：进行中</option>
                      <option value="completed">状态：已完成</option>
                      <option value="paused">状态：已暂停</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditModal(goal)}
                      className="min-h-[38px] swiss-btn-outline px-3 py-1.5 text-xs inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>编辑</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(goal)}
                      className="min-h-[38px] px-3 py-1.5 border border-[#0A0A0A] bg-white hover:bg-[#E61919] hover:text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>

                {/* Linked Projects Sub-Grid */}
                <div className="border-t-2 border-[#0A0A0A] bg-[#F6F5F2] p-4 sm:px-6 space-y-3">
                  <div className="flex items-center justify-between font-mono-swiss text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5" aria-hidden="true" />
                      LINKED PROJECTS [{linkedProjects.length}]
                    </span>
                    <Link
                      to="/projects"
                      className="font-bold underline hover:text-[#E61919]"
                    >
                      MANAGE PROJECTS →
                    </Link>
                  </div>

                  {linkedProjects.length === 0 ? (
                    <p className="text-xs text-[#525252]">
                      暂未关联具体项目，可在“我的项目”中新建项目并绑定到此目标。
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {linkedProjects.map((proj) => {
                        const projTasks = tasks.filter(
                          (t) => t.project_id === proj.id
                        );
                        const progress = calculateProjectProgress(projTasks);
                        return (
                          <Link
                            key={proj.id}
                            to={`/projects/${proj.id}`}
                            className="p-3 bg-white border border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-colors flex items-center justify-between gap-2 group"
                          >
                            <span className="text-xs font-extrabold truncate flex items-center gap-1">
                              <span className="truncate">{proj.name}</span>
                              <ArrowUpRight
                                className="w-3.5 h-3.5 shrink-0"
                                aria-hidden="true"
                              />
                            </span>
                            <span className="font-mono-swiss text-xs font-black text-[#E61919] group-hover:text-white shrink-0">
                              {progress.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-[#0A0A0A] text-white flex items-center justify-between">
              <h3 className="font-mono-swiss text-sm font-bold uppercase">
                {editingGoal ? 'EDIT GOAL // 编辑学习目标' : 'NEW GOAL // 新建学习目标'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center border border-white/40 hover:bg-[#E61919] cursor-pointer"
                aria-label="关闭弹窗"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4" noValidate>
              {formError && (
                <div
                  role="alert"
                  className="p-3 bg-[#E61919] text-white text-xs font-bold"
                >
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-mono-swiss text-xs font-bold uppercase mb-1.5">
                  GOAL TITLE / 目标名称 <span className="text-[#E61919]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：备战蓝桥杯省赛 / 完成 Web 全栈项目交付"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono-swiss text-xs font-bold uppercase mb-1.5">
                  DESCRIPTION / 目标说明（选填）
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="说明为什么要制定这个目标，以及如何衡量目标达成..."
                  className="w-full px-3.5 py-2.5 text-sm border border-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-mono-swiss text-xs font-bold uppercase mb-1.5">
                    TARGET DATE / 期望达成日
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-swiss border border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="block font-mono-swiss text-xs font-bold uppercase mb-1.5">
                    STATUS / 当前状态
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GoalStatus)}
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#0A0A0A] bg-white"
                  >
                    <option value="active">进行中 (ACTIVE)</option>
                    <option value="completed">已完成 (COMPLETED)</option>
                    <option value="paused">已暂停 (PAUSED)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#0A0A0A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[42px] swiss-btn-outline px-4 py-2 text-xs"
                >
                  取消 / CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[42px] swiss-btn-accent px-5 py-2 text-xs"
                >
                  {submitting ? '保存中...' : '保存目标 / SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
