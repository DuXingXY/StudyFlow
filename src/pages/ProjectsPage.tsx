import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Edit3, Plus, Trash2 } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { Project, ProjectStatus } from '../types/models';
import { calculateProjectProgress } from '../utils/dateUtils';
import {
  Button,
  EmptyState,
  Field,
  FormError,
  MetaItem,
  Modal,
  ModalActions,
  PageHeader,
  ProgressBar,
  Segmented,
  Tag,
  type TagTone,
  cx,
  iconButtonClass,
  iconButtonDangerClass,
  inputClass,
  selectClass,
  textareaClass,
} from '../components/ui';

const projectStatusMeta: Record<ProjectStatus, { label: string; tone: TagTone }> = {
  active: { label: '进行中', tone: 'ink' },
  completed: { label: '已完成', tone: 'outline' },
  on_hold: { label: '已搁置', tone: 'default' },
};

export const ProjectsPage: React.FC = () => {
  const { goals, projects, tasks, createProject, updateProject, deleteProject, runAction } = useStudyFlow();

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

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (goalFilter === 'unlinked' && p.goal_id !== null) return false;
        if (goalFilter !== 'all' && goalFilter !== 'unlinked' && p.goal_id !== goalFilter) return false;
        return true;
      }),
    [projects, statusFilter, goalFilter]
  );

  const countBy = (s: ProjectStatus) => projects.filter((p) => p.status === s).length;

  const openModal = (project: Project | null) => {
    setEditingProject(project);
    setName(project?.name ?? '');
    setGoalId(project ? (project.goal_id ?? '') : (goals[0]?.id ?? ''));
    setDescription(project?.description ?? '');
    setDueDate(project?.due_date ?? '');
    setStatus(project?.status ?? 'active');
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
    const payload = { name, goal_id: goalId || null, description, due_date: dueDate || null, status };
    try {
      if (editingProject) {
        await updateProject(editingProject.id, payload);
      } else {
        await createProject(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存项目失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (project: Project) => {
    const count = tasks.filter((t) => t.project_id === project.id).length;
    const msg =
      count > 0
        ? `确定删除项目“${project.name}”吗？\n其下 ${count} 条任务会保留下来，转为独立任务。`
        : `确定删除项目“${project.name}”吗？`;
    if (!window.confirm(msg)) return;
    void runAction(() => deleteProject(project.id));
  };

  return (
    <div>
      <PageHeader
        index="03"
        title="我的项目"
        description="把学习目标拆成可交付的项目，完成率按子任务实时计算（AC-03 / AC-06）。"
        meta={
          <>
            <MetaItem label="全部">{projects.length}</MetaItem>
            <MetaItem label="进行中">{countBy('active')}</MetaItem>
          </>
        }
        actions={
          <Button variant="accent" onClick={() => openModal(null)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            新建项目
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
        <Segmented
          className="flex-1"
          label="按状态筛选项目"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { key: 'all', label: '全部', count: projects.length },
            { key: 'active', label: '进行中', count: countBy('active') },
            { key: 'completed', label: '已完成', count: countBy('completed') },
            { key: 'on_hold', label: '已搁置', count: countBy('on_hold') },
          ]}
        />
        <select
          aria-label="按学习目标筛选项目"
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
          className={`${selectClass} sm:w-64!`}
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

      {filteredProjects.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="没有符合条件的项目"
          description="新建一个项目，把大任务拆成小步骤，完成率会自动计算。"
          action={
            <Button variant="primary" onClick={() => openModal(null)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              新建项目
            </Button>
          }
        />
      ) : (
        <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
          {filteredProjects.map((project, index) => {
            const goal = goals.find((g) => g.id === project.goal_id);
            const progress = calculateProjectProgress(tasks.filter((t) => t.project_id === project.id));
            const meta = projectStatusMeta[project.status];
            const complete = progress.percentage === 100;
            return (
              <li key={project.id} className="border-t-2 border-ink pt-4 flex flex-col">
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="flex items-center gap-3">
                    <span className="font-bold text-ink tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                    <Tag tone={meta.tone}>{meta.label}</Tag>
                  </span>
                  {project.due_date && <MetaItem label="截止">{project.due_date}</MetaItem>}
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="group mt-4 inline-flex items-start gap-2 text-xl font-bold leading-snug break-words hover:text-accent transition-colors"
                >
                  <span>{project.name}</span>
                  <ArrowUpRight className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
                </Link>
                <p className="mt-1.5 text-xs text-muted truncate">{goal ? `目标：${goal.title}` : '独立项目（未关联目标）'}</p>
                {project.description && (
                  <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-2 break-words">{project.description}</p>
                )}

                <div className="mt-auto pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <span
                      className={cx(
                        'font-bold leading-none tabular-nums',
                        progress.percentage === null ? 'text-base text-muted' : 'text-5xl tracking-tight'
                      )}
                    >
                      {progress.label}
                    </span>
                    <span className="text-xs text-muted tabular-nums">
                      {progress.completedTasks} / {progress.totalTasks} 项完成
                    </span>
                  </div>
                  <ProgressBar
                    value={progress.percentage}
                    tone={complete ? 'ink' : 'accent'}
                    label={`${project.name} 完成率`}
                    className="mt-3"
                  />
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Link to={`/projects/${project.id}`} className="text-sm font-semibold hover:text-accent transition-colors">
                      查看子任务 →
                    </Link>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(project)}
                        className={iconButtonClass}
                        aria-label={`编辑项目 ${project.name}`}
                        title="编辑项目"
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        className={iconButtonDangerClass}
                        aria-label={`删除项目 ${project.name}`}
                        title="删除项目（保留任务）"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editingProject ? '编辑项目' : '新建项目'}
        title={editingProject ? editingProject.name : '新建个人项目'}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Field label="项目名称" htmlFor="project-name" required>
            <input
              id="project-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：蓝桥杯动态规划专题突破"
              className={inputClass}
            />
          </Field>
          <Field label="关联学习目标" htmlFor="project-goal" hint="不选则为独立项目">
            <select id="project-goal" value={goalId} onChange={(e) => setGoalId(e.target.value)} className={selectClass}>
              <option value="">不关联目标</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="项目说明" htmlFor="project-description" hint="选填">
            <textarea
              id="project-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="交付物、技术栈或核心计划"
              className={textareaClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="计划截止日" htmlFor="project-due">
              <input
                id="project-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="项目状态" htmlFor="project-status">
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={selectClass}
              >
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="on_hold">已搁置</option>
              </select>
            </Field>
          </div>
          <ModalActions>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中…' : '保存项目'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
};
