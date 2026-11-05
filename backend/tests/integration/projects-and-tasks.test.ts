import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { clearTestDatabase, testPrisma } from '../fixtures/test-db';
import { PriorityLevel } from '../../src/constants/status';

describe('Projects and Tasks Integration Tests', () => {
  const app = createApp();

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  async function registerUser(name: string, email: string) {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name, email, password: 'Password123!' });
    return {
      user: res.body.data.user,
      token: res.body.data.tokens.accessToken
    };
  }

  it('should automatically create default board and 4 columns when project is created in a transaction', async () => {
    const owner = await registerUser('Alice', 'alice_proj@test.com');

    // Create workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Dev Team' });
    const workspaceId = wsRes.body.data.id;

    // Create project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        workspaceId,
        name: 'Mobile App',
        key: 'MOB',
        priority: PriorityLevel.HIGH
      });

    expect(projRes.status).toBe(201);
    expect(projRes.body.success).toBe(true);

    const projectId = projRes.body.data.id;

    // Fetch project details to verify board & default columns
    const detailsRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.data.boards.length).toBe(1);
    expect(detailsRes.body.data.boards[0].name).toBe('Main Board');
    expect(detailsRes.body.data.boards[0].columns.length).toBe(4);

    const colNames = detailsRes.body.data.boards[0].columns.map((c: any) => c.name);
    expect(colNames).toEqual(['To Do', 'In Progress', 'In Review', 'Completed']);
  });

  it('should create, assign, and move tasks, maintaining project isolation and validation', async () => {
    const owner = await registerUser('Alice', 'alice_task@test.com');
    const member = await registerUser('Bob Member', 'bob_task@test.com');
    const outsider = await registerUser('Charlie Outsider', 'charlie_task@test.com');

    // 1. Workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Alpha Workspace' });
    const workspaceId = wsRes.body.data.id;

    // Add Bob to workspace
    await testPrisma.workspaceMember.create({
      data: { workspaceId, userId: member.user.id, role: 'MEMBER' }
    });

    // 2. Project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        workspaceId,
        name: 'Alpha Project',
        key: 'ALP'
      });
    const projectId = projRes.body.data.id;

    // Add Bob to project
    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: member.user.id, role: 'MEMBER' });

    // Fetch columns
    const projDetails = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    const columns = projDetails.body.data.boards[0].columns;
    const todoCol = columns.find((c: any) => c.name === 'To Do');
    const doneCol = columns.find((c: any) => c.name === 'Completed');

    // 3. Create Task with Bob assigned
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        projectId,
        boardColumnId: todoCol.id,
        title: 'Build Login UI',
        priority: PriorityLevel.HIGH,
        assigneeIds: [member.user.id]
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.data.title).toBe('Build Login UI');
    expect(taskRes.body.data.assignees.length).toBe(1);
    const taskId = taskRes.body.data.id;

    // 4. Reject assigning a non-project member (Charlie)
    const rejectAssignRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/assign`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userIds: [outsider.user.id] });

    expect(rejectAssignRes.status).toBe(400);

    // 5. Move task to "Completed" column
    const moveRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        destinationColumnId: doneCol.id,
        newPosition: 1000
      });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.boardColumnId).toBe(doneCol.id);
    expect(moveRes.body.data.completedAt).not.toBeNull(); // Completed column automatically marks completedAt!
  });

  it('should prevent moving task into a column belonging to a different project', async () => {
    const owner = await registerUser('Owner', 'owner_sec@test.com');

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Sec Workspace' });
    const workspaceId = wsRes.body.data.id;

    // Project 1
    const p1 = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ workspaceId, name: 'Project One', key: 'PONE' });

    // Project 2
    const p2 = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ workspaceId, name: 'Project Two', key: 'PTWO' });

    const p1Details = await request(app)
      .get(`/api/v1/projects/${p1.body.data.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    const p1Col = p1Details.body.data.boards[0].columns[0];

    const p2Details = await request(app)
      .get(`/api/v1/projects/${p2.body.data.id}`)
      .set('Authorization', `Bearer ${owner.token}`);
    const p2Col = p2Details.body.data.boards[0].columns[0];

    // Create task in P1
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        projectId: p1.body.data.id,
        boardColumnId: p1Col.id,
        title: 'Task in P1'
      });
    const taskId = taskRes.body.data.id;

    // Attempt to move task from P1 into P2 column
    const attackMove = await request(app)
      .post(`/api/v1/tasks/${taskId}/move`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        destinationColumnId: p2Col.id,
        newPosition: 1000
      });

    expect(attackMove.status).toBe(400);
    expect(attackMove.body.message).toContain('same project');
  });
});
