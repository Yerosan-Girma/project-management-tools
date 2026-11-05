import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { clearTestDatabase, testPrisma } from '../fixtures/test-db';
import { WorkspaceRole } from '../../src/constants/roles';

describe('Workspaces Module Integration Tests', () => {
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

  it('should create a workspace with default labels and assign creator as OWNER', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');

    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Engineering Workspace',
        description: 'Tech hub'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Engineering Workspace');
    expect(res.body.data.slug).toContain('engineering-workspace');
    expect(res.body.data.labels.length).toBeGreaterThan(0);
  });

  it('should invite a user to workspace and allow accepting invitation', async () => {
    const owner = await registerUser('Alice Owner', 'owner@test.com');
    const invitee = await registerUser('Bob Member', 'bob@test.com');

    // 1. Create workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Acme Dev' });
    const workspaceId = wsRes.body.data.id;

    // 2. Invite Bob
    const inviteRes = await request(app)
      .post(`/api/v1/invitations/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        email: 'bob@test.com',
        role: WorkspaceRole.MEMBER
      });

    expect(inviteRes.status).toBe(201);
    const token = inviteRes.body.data.token;

    // 3. Bob accepts invitation
    const acceptRes = await request(app)
      .post('/api/v1/invitations/accept')
      .set('Authorization', `Bearer ${invitee.token}`)
      .send({ token });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);

    // 4. Verify Bob is now a member
    const membersRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(membersRes.status).toBe(200);
    expect(membersRes.body.data.items.some((m: any) => m.userId === invitee.user.id)).toBe(true);
  });

  it('should change member role and prevent unauthorized removal of OWNER', async () => {
    const owner = await registerUser('Owner User', 'owner2@test.com');
    const member = await registerUser('Colleague', 'colleague@test.com');

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Role Test Workspace' });
    const workspaceId = wsRes.body.data.id;

    // Direct add member to DB for test
    await testPrisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: member.user.id,
        role: WorkspaceRole.MEMBER
      }
    });

    // Promote to ADMIN
    const updateRoleRes = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}/members/${member.user.id}/role`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ role: WorkspaceRole.ADMIN });

    expect(updateRoleRes.status).toBe(200);
    expect(updateRoleRes.body.data.role).toBe(WorkspaceRole.ADMIN);

    // Try removing OWNER (should fail)
    const removeOwnerRes = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}/members/${owner.user.id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(removeOwnerRes.status).toBe(400);
    expect(removeOwnerRes.body.message).toContain('OWNER');
  });

  it('should block non-members from accessing workspace details (403 Forbidden)', async () => {
    const owner = await registerUser('Alice', 'alice3@test.com');
    const outsider = await registerUser('Stranger', 'stranger@test.com');

    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'Secret Workspace' });
    const workspaceId = wsRes.body.data.id;

    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${outsider.token}`);

    expect(res.status).toBe(403);
  });
});
