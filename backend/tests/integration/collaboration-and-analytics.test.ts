import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { clearTestDatabase, testPrisma } from '../fixtures/test-db';
import { PriorityLevel } from '../../src/constants/status';

describe('Collaboration and Analytics Integration Tests', () => {
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

  it('should support threaded task comments, notifications, and analytics calculation', async () => {
    const alice = await registerUser('Alice Lead', 'alice_collab@test.com');
    const bob = await registerUser('Bob Dev', 'bob_collab@test.com');

    // 1. Create Workspace & Project
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ name: 'Collab Workspace' });
    const workspaceId = wsRes.body.data.id;

    // Add Bob to workspace
    await testPrisma.workspaceMember.create({
      data: { workspaceId, userId: bob.user.id, role: 'MEMBER' }
    });

    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ workspaceId, name: 'Collab Project', key: 'COL' });
    const projectId = projRes.body.data.id;

    // Add Bob to project
    await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ userId: bob.user.id, role: 'MEMBER' });

    const projDetails = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${alice.token}`);
    const todoCol = projDetails.body.data.boards[0].columns[0];

    // 2. Create Task assigned to Bob
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({
        projectId,
        boardColumnId: todoCol.id,
        title: 'Review pull request',
        priority: PriorityLevel.URGENT,
        assigneeIds: [bob.user.id]
      });
    const taskId = taskRes.body.data.id;

    // Verify Bob received notification for task assignment
    const bobNotifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${bob.token}`);
    expect(bobNotifRes.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(bobNotifRes.body.data.items[0].type).toBe('TASK_ASSIGNED');

    // 3. Post a comment as Alice
    const commentRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'Please review the test suite before merging.' });

    expect(commentRes.status).toBe(201);
    const commentId = commentRes.body.data.id;

    // 4. Bob posts threaded reply
    const replyRes = await request(app)
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({
        content: 'Tests are passing, merging now.',
        parentId: commentId
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.parentId).toBe(commentId);

    // 5. Verify Bob cannot edit Alice's comment
    const unauthorizedEdit = await request(app)
      .patch(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({ content: 'Tampered comment' });

    expect(unauthorizedEdit.status).toBe(403);

    // 6. Alice can edit her own comment
    const authorizedEdit = await request(app)
      .patch(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ content: 'Updated instructions for review.' });

    expect(authorizedEdit.status).toBe(200);
    expect(authorizedEdit.body.data.isEdited).toBe(true);

    // 7. Verify Dashboard Analytics
    const analyticsRes = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${alice.token}`);

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data.workspacesCount).toBe(1);
    expect(analyticsRes.body.data.projects.total).toBe(1);
  });
});
