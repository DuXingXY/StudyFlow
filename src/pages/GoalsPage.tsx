import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useStudyFlow } from '../context/StudyFlowContext';
import type { Goal, GoalStatus } from '../types/models';
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
  inputClass,
  selectClass,
  selectSmClass,
  textareaClass,
} from '../components/ui';

const statusMeta: Record<GoalStatus, { label: string; tone: TagTone }> = {
  active: { label: '进行中', tone: 'ink' },
  completed: { label: '已完成', tone: 'outline' },
  paused: { label: '已暂停', tone: 'default' },
};

export const GoalsPage: React.FC = () => {
  const { goals, projects, tasks, createGoal, updateGoal, deleteGoal, runAction } = useStudyFlow();

  const [statusFilter, setStatusFilter] = useState<'all' | GoalStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredGoals = useMemo(
    () => (statusFilter === 'all' ? goals : goals.filter((g) => g.status === statusFilter)),
    [goals, statusFilter]
  );

  const openModal = (goal: Goal | null) => {
    setEditingGoal(goal);
    setTitle(goal?.title ?? '');
    setDescription(goal?.description ?? '');
    setTargetDate(goal?.target_date ?? '');
    setStatus(goal?.status ?? 'active');
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
    const payload = { title, description, target_date: targetDate || null, status };
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
      } else {
        await createGoal(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (goal: Goal) => {
    const linkedCount = projects.filter((p) => p.goal_id === goal.id).length;
    const msg =
      linkedCount > 0
        ? `确定删除学习目标“${goal.title}”吗？\n关联的 ${linkedCount} 个项目不会被删除，将转为独立项目。`
        : `确定删除学习目标“${goal.title}”吗？`;
    if (!window.confirm(msg)) return;
    void runAction(() => deleteGoal(goal.id));
  };

  return (
    <div>
      <PageHeader
        index="02"
        title="学习目标"
        description="确立中长期的职业发展、竞赛或课程方向，再通过具体项目一步步落地（AC-02）。"
        meta={
          <>
            <MetaItem label="全部">{goals.length}</MetaItem>
            <MetaItem label="进行中">{goals.filter((g) => g.status === 'active').length}</MetaItem>
          </>
        }
        actions={
          <Button variant="accent" onClick={() => openModal(null)}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            新建目标
          </Button>
        }
      />

      <Segmented
        label="按状态筛选目标"
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { key: 'all', label: '全部', count: goals.length },
          { key: 'active', label: '进行中', count: goals.filter((g) => g.status === 'active').length },
          { key: 'completed', label: '已完成', count: goals.filter((g) => g.status === 'completed').length },
          { key: 'paused', label: '已暂停', count: goals.filter((g) => g.status === 'paused').length },
        ]}
      />

      {filteredGoals.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="当前筛选下没有学习目标"
          description="先设立一个明确的阶段性目标，例如“冲刺程序设计竞赛省赛”，再围绕它建立项目。"
          action={
            <Button variant="primary" onClick={() => openModal(null)}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              创建第一个目标
            </Button>
          }
        />
      ) : (
        <ol className="mt-8">
          {filteredGoals.map((goal, idx) => {
            const linkedProjects = projects.filter((p) => p.goal_id === goal.id);
            const meta = statusMeta[goal.status];
            return (
              <li
                key={goal.id}
                className="grid grid-cols-12 gap-x-4 sm:gap-x-6 gap-y-4 py-7 sm:py-9 border-t-2 border-ink"
              >
                <div className="col-span-12 sm:col-span-1 text-2xl sm:text-3xl font-bold leading-none tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                <div className="col-span-12 sm:col-span-11 lg:col-span-8 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                    <Tag tone={meta.tone}>{meta.label}</Tag>
                    {goal.target_date && <MetaItem label="期望达成">{goal.target_date}</MetaItem>}
                    <MetaItem label="关联项目">{linkedProjects.length}</MetaItem>
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-bold leading-snug break-words">{goal.title}</h2>
                  {goal.description && (
                    <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed break-words">
                      {goal.description}
                    </p>
                  )}

                  <div className="mt-6">
                    {linkedProjects.length === 0 ? (
                      <p className="text-xs text-muted">
                        还没有关联项目。可在
                        <Link
                          to="/projects"
                          className="mx-1 font-semibold text-ink underline decoration-1 underline-offset-4 hover:text-accent"
                        >
                          我的项目
                        </Link>
                        中新建并绑定到这个目标。
                      </p>
                    ) : (
                      <ul className="border-t border-line">
                        {linkedProjects.map((proj) => {
                          const progress = calculateProjectProgress(tasks.filter((t) => t.project_id === proj.id));
                          return (
                            <li key={proj.id} className="border-b border-line">
                              <Link to={`/projects/${proj.id}`} className="group flex items-center gap-4 py-2.5 text-sm">
                                <span className="flex-1 min-w-0 truncate font-semibold group-hover:text-accent transition-colors">
                                  {proj.name}
                                </span>
                                <div className="w-16 sm:w-32 shrink-0">
                                  <ProgressBar value={progress.percentage} tone="accent" label={`${proj.name} 完成率`} />
                                </div>
                                <span className="w-14 text-right text-xs font-semibold tabular-nums shrink-0">
                                  {progress.label}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="col-span-12 sm:col-span-11 sm:col-start-2 lg:col-span-3 lg:col-start-10 flex flex-wrap lg:flex-col gap-2">
                  <select
                    aria-label={`修改目标 ${goal.title} 的状态`}
                    value={goal.status}
                    onChange={(e) => runAction(() => updateGoal(goal.id, { status: e.target.value as GoalStatus }))}
                    className={`${selectSmClass} w-full sm:w-36 lg:w-full`}
                  >
                    <option value="active">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="paused">已暂停</option>
                  </select>
                  <div className="flex gap-2 lg:[&>*]:flex-1">
                    <Button variant="outline" size="sm" onClick={() => openModal(goal)}>
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      编辑
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(goal)}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      删除
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editingGoal ? '编辑学习目标' : '新建学习目标'}
        title={editingGoal ? editingGoal.title : '设立一个新目标'}
      >
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Field label="目标名称" htmlFor="goal-title" required>
            <input
              id="goal-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：备战蓝桥杯省赛"
              className={inputClass}
            />
          </Field>
          <Field label="目标说明" htmlFor="goal-description" hint="选填">
            <textarea
              id="goal-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="为什么要定这个目标，怎样算达成"
              className={textareaClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="期望达成日" htmlFor="goal-target-date">
              <input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="当前状态" htmlFor="goal-status">
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className={selectClass}
              >
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="paused">已暂停</option>
              </select>
            </Field>
          </div>
          <ModalActions>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? '保存中…' : '保存目标'}
            </Button>
          </ModalActions>
        </form>
      </Modal>
    </div>
  );
};
