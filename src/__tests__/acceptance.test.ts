import { beforeEach, describe, expect, it } from 'vitest';
import { studyFlowRepo } from '../services/repository';
import { DEMO_USER_A } from '../services/seedData';
import {
  addDays,
  calculateProjectProgress,
  getLocalDateString,
  isTaskOverdue,
  normalizeToWeekMonday,
} from '../utils/dateUtils';

describe('StudyFlow MVP 验收测试套件 (AC-01 ~ AC-11)', () => {
  beforeEach(async () => {
    await studyFlowRepo.resetLocalDemoData();
  });

  it('AC-01: 未登录时拒绝业务数据访问，支持注册、登录与退出', async () => {
    await studyFlowRepo.signOut();
    expect(await studyFlowRepo.getSessionUser()).toBeNull();
    await expect(studyFlowRepo.listGoals()).rejects.toThrow(/未登录/);

    const newUser = await studyFlowRepo.signUp(
      'new_student@studyflow.edu.cn',
      '654321',
      '新同学'
    );
    expect(newUser.email).toBe('new_student@studyflow.edu.cn');

    await studyFlowRepo.signOut();
    const loggedIn = await studyFlowRepo.signIn(
      'new_student@studyflow.edu.cn',
      '654321'
    );
    expect(loggedIn.id).toBe(newUser.id);
  });

  it('AC-02: 学习目标支持创建、修改、状态流转与删除（删除目标保留关联项目）', async () => {
    const goal = await studyFlowRepo.createGoal({
      title: '测试目标：冲刺算法国赛',
      description: '阶段性训练',
      status: 'active',
    });
    expect(goal.title).toBe('测试目标：冲刺算法国赛');

    const proj = await studyFlowRepo.createProject({
      name: '关联测试项目',
      goal_id: goal.id,
    });
    expect(proj.goal_id).toBe(goal.id);

    const updated = await studyFlowRepo.updateGoal(goal.id, {
      status: 'completed',
    });
    expect(updated.status).toBe('completed');

    await studyFlowRepo.deleteGoal(goal.id);
    const reloadedProj = await studyFlowRepo.getProjectById(proj.id);
    expect(reloadedProj.goal_id).toBeNull();
  });

  it('AC-03 & AC-04: 项目删除时保留原有任务并解除关联 (ON DELETE SET NULL)', async () => {
    const project = await studyFlowRepo.createProject({
      name: '待删除的测试项目',
    });
    const t1 = await studyFlowRepo.createTask({
      title: '保留任务 1',
      project_id: project.id,
    });
    const t2 = await studyFlowRepo.createTask({
      title: '保留任务 2',
      project_id: project.id,
    });

    const { unlinkedTaskCount } = await studyFlowRepo.deleteProject(project.id);
    expect(unlinkedTaskCount).toBe(2);

    const allTasks = await studyFlowRepo.listTasks();
    const found1 = allTasks.find((t) => t.id === t1.id);
    const found2 = allTasks.find((t) => t.id === t2.id);
    expect(found1).toBeDefined();
    expect(found2).toBeDefined();
    expect(found1?.project_id).toBeNull();
    expect(found2?.project_id).toBeNull();
  });

  it('AC-05: 计划日期与截止日期记录，逾期未完成任务准确触发逾期判定', async () => {
    const today = getLocalDateString();
    const yesterday = addDays(today, -1);

    const overdueTask = await studyFlowRepo.createTask({
      title: '昨日截止未完成任务',
      planned_date: yesterday,
      due_date: yesterday,
      status: 'todo',
    });
    expect(isTaskOverdue(overdueTask, today)).toBe(true);

    const completedTask = await studyFlowRepo.updateTask(overdueTask.id, {
      status: 'done',
    });
    expect(completedTask.completed_at).not.toBeNull();
    expect(isTaskOverdue(completedTask, today)).toBe(false);
  });

  it('AC-06: 项目进度计算 —— 5个任务完成3个准确显示60%，无任务显示“暂无任务”', async () => {
    const allProjects = await studyFlowRepo.listProjects();
    const allTasks = await studyFlowRepo.listTasks();

    // 预设项目 1：StudyFlow MVP 有 5 个任务，完成 3 个
    const studyFlowProj = allProjects.find((p) =>
      p.name.includes('StudyFlow')
    )!;
    const studyFlowTasks = allTasks.filter(
      (t) => t.project_id === studyFlowProj.id
    );
    const progress60 = calculateProjectProgress(studyFlowTasks);
    expect(progress60.totalTasks).toBe(5);
    expect(progress60.completedTasks).toBe(3);
    expect(progress60.percentage).toBe(60);
    expect(progress60.label).toBe('60%');

    // 无任务项目显示“暂无任务”
    const emptyProgress = calculateProjectProgress([]);
    expect(emptyProgress.percentage).toBeNull();
    expect(emptyProgress.label).toBe('暂无任务');
  });

  it('AC-08: 每周复盘同一用户同一自然周重复保存自动更新原记录，不产生重复周次记录', async () => {
    const today = getLocalDateString();
    const monday = normalizeToWeekMonday(today);

    const beforeCount = (await studyFlowRepo.listWeeklyReviews()).filter(
      (r) => r.week_start === monday
    ).length;
    expect(beforeCount).toBe(1);

    // 同一周内再次保存（传入周三日期也会归一化到同一周一）
    const wednesday = addDays(monday, 2);
    const res = await studyFlowRepo.upsertWeeklyReview({
      week_start: wednesday,
      achievements: '更新后的本周成果内容',
      problems: '更新后的问题分析',
      next_plan: '更新后的下周改进计划',
    });

    expect(res.isUpdated).toBe(true);
    expect(res.review.week_start).toBe(monday);

    const afterReviews = (await studyFlowRepo.listWeeklyReviews()).filter(
      (r) => r.week_start === monday
    );
    expect(afterReviews.length).toBe(1);
    expect(afterReviews[0].achievements).toBe('更新后的本周成果内容');
  });

  it('AC-10: 多用户数据严格隔离，且禁止跨用户外键关联 (RLS 策略验证)', async () => {
    // 1. User A 拥有自己的项目与目标
    const userAGoals = await studyFlowRepo.listGoals();
    const userAProjects = await studyFlowRepo.listProjects();
    expect(userAGoals.every((g) => g.user_id === DEMO_USER_A.id)).toBe(true);
    const userAProjectId = userAProjects[0].id;
    const userAGoalId = userAGoals[0].id;

    // 2. 切换至 User B
    await studyFlowRepo.quickLoginDemoUser('B');
    const userBProjects = await studyFlowRepo.listProjects();
    expect(userBProjects.some((p) => p.id === userAProjectId)).toBe(false);

    // 3. User B 尝试直接读取或修改 User A 的项目 -> 被 RLS 拦截
    await expect(studyFlowRepo.getProjectById(userAProjectId)).rejects.toThrow(
      /RLS/
    );
    await expect(
      studyFlowRepo.updateProject(userAProjectId, { name: '越权篡改' })
    ).rejects.toThrow(/RLS/);

    // 4. User B 尝试将自己的任务关联到 User A 的项目 -> 被 RLS WITH CHECK 拦截
    await expect(
      studyFlowRepo.createTask({
        title: '越权绑定任务',
        project_id: userAProjectId,
      })
    ).rejects.toThrow(/RLS/);

    // 5. User B 尝试将自己的项目关联到 User A 的目标 -> 被 RLS WITH CHECK 拦截
    await expect(
      studyFlowRepo.createProject({
        name: '越权绑定项目',
        goal_id: userAGoalId,
      })
    ).rejects.toThrow(/RLS/);
  });

  it('AC-11: 空输入与非法参数校验拦截', async () => {
    await expect(studyFlowRepo.createGoal({ title: '   ' })).rejects.toThrow(
      /不能为空/
    );
    await expect(studyFlowRepo.createProject({ name: '' })).rejects.toThrow(
      /不能为空/
    );
    await expect(studyFlowRepo.createTask({ title: '' })).rejects.toThrow(
      /不能为空/
    );
  });
});
