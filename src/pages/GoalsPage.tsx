import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
  { label: string; badgeClass: string }
> = {
  active: {
    label: '进行中',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  paused: {
    label: '已暂停',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>学习目标 (Goals)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            确立中长期职业发展、竞赛备赛或课程学习目标，并关联具体项目落地执行。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>新建学习目标</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
        {(
          [
            { key: 'all', label: `全部 (${goals.length})` },
            {
              key: 'active',
              label: `进行中 (${goals.filter((g) => g.status === 'active').length})`,
            },
            {
              key: 'completed',
              label: `已完成 (${goals.filter((g) => g.status === 'completed').length})`,
            },
            {
              key: 'paused',
              label: `已暂停 (${goals.filter((g) => g.status === 'paused').length})`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-slate-900">
            当前筛选下暂无学习目标
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            建议先设立一个明确的阶段性目标（例如“冲刺程序设计竞赛省赛”或“完成软件开发工程师转型项目”），再围绕目标建立具体项目。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            立即创建第一个目标
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredGoals.map((goal) => {
            const linkedProjects = projects.filter((p) => p.goal_id === goal.id);
            const meta = statusMeta[goal.status];

            return (
              <div
                key={goal.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      {goal.target_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          <Calendar className="w-3.5 h-3.5" />
                          目标日期：{goal.target_date}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 break-words">
                      {goal.title}
                    </h2>
                    {goal.description && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
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
                      className="text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">状态：进行中</option>
                      <option value="completed">状态：已完成</option>
                      <option value="paused">状态：已暂停</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditModal(goal)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>编辑</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(goal)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-medium text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>

                {/* Linked Projects Section */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                      关联支撑项目 ({linkedProjects.length})
                    </span>
                    <Link
                      to="/projects"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      去项目管理 →
                    </Link>
                  </div>

                  {linkedProjects.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      暂未关联具体项目，可在“我的项目”中创建项目并关联到此目标。
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {linkedProjects.map((proj) => {
                        const projTasks = tasks.filter(
                          (t) => t.project_id === proj.id
                        );
                        const progress = calculateProjectProgress(projTasks);
                        return (
                          <Link
                            key={proj.id}
                            to={`/projects/${proj.id}`}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 transition-colors"
                          >
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {proj.name}
                            </span>
                            <span className="text-xs font-bold text-indigo-600 shrink-0">
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGoal ? '编辑学习目标' : '新建学习目标'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  目标名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：备战蓝桥杯省赛 / 完成 Web 全栈项目交付"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  目标详细描述（选填）
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="说明为什么要制定这个目标，以及如何衡量目标达成..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    期望达成日期（选填）
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    当前状态
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as GoalStatus)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">进行中 (active)</option>
                    <option value="completed">已完成 (completed)</option>
                    <option value="paused">已暂停 (paused)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold text-white cursor-pointer"
                >
                  {submitting ? '保存中...' : '保存目标'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
