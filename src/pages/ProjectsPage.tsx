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
import type { Project, ProjectStatus } from '../types/models';
import { calculateProjectProgress } from '../utils/dateUtils';

const projectStatusMeta: Record<
  ProjectStatus,
  { label: string; code: string; badgeClass: string; stripClass: string }
> = {
  active: {
    label: '进行中',
    code: 'ACTIVE',
    badgeClass: 'bg-[#0A0A0A] text-white border-[#0A0A0A]',
    stripClass: 'bg-[#E61919]',
  },
  completed: {
    label: '已完成',
    code: 'DONE',
    badgeClass: 'bg-white text-[#15803D] border-[#15803D]',
    stripClass: 'bg-[#15803D]',
  },
  on_hold: {
    label: '已搁置',
    code: 'HOLD',
    badgeClass: 'bg-[#F6F5F2] text-[#525252] border-[#0A0A0A]',
    stripClass: 'bg-[#737373]',
  },
};

export const ProjectsPage: React.FC = () => {
  const {
    goals,
    projects,
    tasks,
    createProject,
    updateProject,
    deleteProject,
  } = useStudyFlow();

  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (goalFilter === 'unlinked' && p.goal_id !== null) return false;
      if (
        goalFilter !== 'all' &&
        goalFilter !== 'unlinked' &&
        p.goal_id !== goalFilter
      )
        return false;
      return true;
    });
  }, [projects, statusFilter, goalFilter]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setGoalId(goals[0]?.id ?? '');
    setDescription('');
    setDueDate('');
    setStatus('active');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setGoalId(project.goal_id ?? '');
    setDescription(project.description);
    setDueDate(project.due_date ?? '');
    setStatus(project.status);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('项目名称不能为空');
      return;
    }
    setSubmitting(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name,
          goal_id: goalId || null,
          description,
          due_date: dueDate || null,
          status,
        });
      } else {
        await createProject({
          name,
          goal_id: goalId || null,
          description,
          due_date: dueDate || null,
          status,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存项目失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (project: Project) => {
    const projectTasksCount = tasks.filter(
      (t) => t.project_id === project.id
    ).length;
    const confirmText =
      projectTasksCount > 0
        ? `确定删除项目“${project.name}”吗？\n\n【安全保护】该项目下的 ${projectTasksCount} 条任务将被保留，并自动解除与项目的关联（转为独立任务），不会误删学习记录。`
        : `确定删除项目“${project.name}”吗？`;
    if (!window.confirm(confirmText)) return;
    await deleteProject(project.id);
  };

  return (
    <div className="space-y-6">
      {/* Swiss Section Header */}
      <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_#0A0A0A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono-swiss font-bold uppercase tracking-[0.2em] text-[#E61919]">
            <span>03 // PROJECT PORTFOLIO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] mt-1 tracking-tight">
            我的项目看板 (Projects)
          </h1>
          <p className="text-xs sm:text-sm text-[#525252] mt-1 font-medium">
            将学习目标拆解为可执行的个人项目，根据子任务完成情况实时计算项目完成率（AC-03 / AC-06）。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="swiss-btn-accent min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>新建项目</span>
        </button>
      </div>

      {/* Swiss Filter Bar */}
      <div className="bg-white border-2 border-[#0A0A0A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: 'all', label: `ALL / 全部 (${projects.length})` },
              {
                key: 'active',
                label: `ACTIVE / 进行中 (${projects.filter((p) => p.status === 'active').length})`,
              },
              {
                key: 'completed',
                label: `DONE / 已完成 (${projects.filter((p) => p.status === 'completed').length})`,
              },
              {
                key: 'on_hold',
                label: `HOLD / 已搁置 (${projects.filter((p) => p.status === 'on_hold').length})`,
              },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-mono-swiss font-bold border transition-colors cursor-pointer ${
                statusFilter === item.key
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-[#F6F5F2] text-[#0A0A0A] border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono-swiss font-bold uppercase tracking-wider text-[#525252] shrink-0">
            GOAL FILTER:
          </label>
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="min-h-[38px] text-xs font-bold border-2 border-[#0A0A0A] bg-[#F6F5F2] px-3 py-1.5 text-[#0A0A0A] max-w-[230px] truncate cursor-pointer focus:outline-none"
          >
            <option value="all">全部学习目标</option>
            <option value="unlinked">独立项目（未关联目标）</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swiss Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#0A0A0A] text-white flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-base font-black text-[#0A0A0A]">
            暂无符合条件的项目
          </div>
          <p className="text-xs text-[#525252] max-w-md mx-auto">
            创建一个项目并将大任务拆解为可执行的小步骤，系统会自动为你追踪完成百分比。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="swiss-btn-primary min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            新建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project, index) => {
            const linkedGoal = goals.find((g) => g.id === project.goal_id);
            const projectTasks = tasks.filter(
              (t) => t.project_id === project.id
            );
            const progress = calculateProjectProgress(projectTasks);
            const meta = projectStatusMeta[project.status];

            return (
              <div
                key={project.id}
                className="bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] relative overflow-hidden p-5 sm:p-6 flex flex-col justify-between gap-4"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${meta.stripClass}`}
                  aria-hidden="true"
                />

                <div className="space-y-3 pl-2">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-swiss font-bold text-[#525252]">
                        PROJ.{String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-mono-swiss font-bold border ${meta.badgeClass}`}
                      >
                        {meta.code} · {meta.label}
                      </span>
                    </div>
                    {project.due_date && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono-swiss font-bold text-[#0A0A0A] bg-[#F6F5F2] border border-[#0A0A0A] px-2.5 py-0.5">
                        <Calendar
                          className="w-3.5 h-3.5 text-[#E61919]"
                          aria-hidden="true"
                        />
                        DUE {project.due_date}
                      </span>
                    )}
                  </div>

                  {/* Title & Goal Badge */}
                  <div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="group inline-flex items-center gap-1.5 text-base sm:text-lg font-black text-[#0A0A0A] hover:text-[#E61919] transition-colors break-words"
                    >
                      <span>{project.name}</span>
                      <ArrowUpRight
                        className="w-4 h-4 text-[#0A0A0A] group-hover:text-[#E61919] shrink-0"
                        aria-hidden="true"
                      />
                    </Link>

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#525252]">
                      <Target
                        className="w-3.5 h-3.5 text-[#E61919] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {linkedGoal
                          ? `关联目标：${linkedGoal.title}`
                          : '独立项目（未关联目标）'}
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed break-words">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar (AC-06) & Actions */}
                <div className="space-y-3.5 pt-3.5 border-t-2 border-[#0A0A0A] pl-2">
                  <div className="p-3 bg-[#F6F5F2] border border-[#0A0A0A] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono-swiss font-bold text-[#0A0A0A] uppercase">
                        PROGRESS{' '}
                        {progress.totalTasks > 0 && (
                          <span className="text-[#525252] font-normal">
                            ({progress.completedTasks}/{progress.totalTasks} 已完成)
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-mono-swiss font-black text-sm ${
                          progress.percentage === null
                            ? 'text-[#737373]'
                            : progress.percentage === 100
                            ? 'text-[#15803D]'
                            : 'text-[#E61919]'
                        }`}
                      >
                        {progress.label}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white border border-[#0A0A0A] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progress.percentage === 100
                            ? 'bg-[#0A0A0A]'
                            : 'bg-[#E61919]'
                        }`}
                        style={{
                          width: `${progress.percentage ?? 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="swiss-btn-outline min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono-swiss font-bold"
                    >
                      <span>进入详情与子任务</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(project)}
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] cursor-pointer transition-colors"
                        title="编辑项目"
                        aria-label={`编辑项目 ${project.name}`}
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] bg-white hover:bg-[#E61919] hover:text-white text-[#0A0A0A] cursor-pointer transition-colors"
                        title="删除项目（保留原有任务）"
                        aria-label={`删除项目 ${project.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-lg p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <div>
                <div className="text-[10px] font-mono-swiss font-bold uppercase tracking-widest text-[#E61919]">
                  PROJECT CONFIGURATION
                </div>
                <h3 className="text-lg font-black text-[#0A0A0A]">
                  {editingProject ? '编辑项目' : '新建个人项目'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-w-[38px] min-h-[38px] flex items-center justify-center border border-[#0A0A0A] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white cursor-pointer"
                aria-label="关闭弹窗"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 bg-[#E61919] text-white text-xs font-bold"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                  项目名称 <span className="text-[#E61919]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：StudyFlow 平台开发 / 蓝桥杯动态规划专题突破"
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                  关联学习目标（选填，支持独立项目）
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                >
                  <option value="">-- 不关联目标（作为独立项目） --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                  项目说明（选填）
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简述该项目的交付物、技术栈或核心计划..."
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    计划截止日期（选填）
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-swiss border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-swiss font-bold uppercase text-[#0A0A0A] mb-1.5">
                    项目状态
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-[#0A0A0A] bg-[#F6F5F2] focus:bg-white focus:outline-none"
                  >
                    <option value="active">进行中 (active)</option>
                    <option value="completed">已完成 (completed)</option>
                    <option value="on_hold">已搁置 (on_hold)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#0A0A0A]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="swiss-btn-outline min-h-[42px] px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="swiss-btn-accent min-h-[42px] px-5 py-2 disabled:opacity-50 text-xs font-bold cursor-pointer"
                >
                  {submitting ? '保存中...' : '保存项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
