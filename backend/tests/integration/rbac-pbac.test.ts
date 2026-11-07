import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { clearTestDatabase, testPrisma } from '../fixtures/test-db';
import { PlatformRole, WorkspaceRole, ProjectRole } from '../../src/constants/roles';

describe('RBAC and PBAC Comprehensive Security Test Suite', () => {
  const app = createApp();

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await testPrisma.$disconnect();
  });

  async function registerUser(name: string, email: string, extraPayload: Record<string, any> = {}) {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name, email, password: 'Password123!', ...extraPayload });
    return {
      user: res.body.data.user,
      token: res.body.data.tokens.accessToken,
    };
  }

  // ==========================================================================
  // LEVEL 1: PLATFORM ROLES & ESCALATION PREVENTION
  // ==========================================================================
  describe('Level 1: Platform Roles & Security', () => {
    it('should assign USER role by default and ignore client-supplied PLATFORM_ADMIN', async () => {
      const client = await registerUser('Sneaky User', 'sneaky@test.com', {
        platformRole: 'PLATFORM_ADMIN',
        role: 'PLATFORM_ADMIN',
      });

      expect(client.user.platformRole).toBe(PlatformRole.USER);

      // Verify directly in DB
      const userInDb = await testPrisma.user.findUnique({
        where: { id: client.user.id },
      });
      expect(userInDb?.platformRole).toBe(PlatformRole.USER);
    });

    it('should reject non-platform-admins from accessing platform user management', async () => {
      const normalUser = await registerUser('Normal User', 'normal@test.com');

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${normalUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow PLATFORM_ADMIN to view all users and promote a user', async () => {
      const admin = await registerUser('Admin User', 'admin@test.com');
      const targetUser = await registerUser('Promoted User', 'target@test.com');

      // Elevate admin user in DB directly
      await testPrisma.user.update({
        where: { id: admin.user.id },
        data: { platformRole: PlatformRole.PLATFORM_ADMIN },
      });

      // Admin creates a workspace so workspaceId is available for activity log
      await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ name: 'Admin Space' });

      // 1. Admin lists users
      const listRes = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.items.length).toBe(2);

      // 2. Admin promotes target user to PLATFORM_ADMIN
      const promoteRes = await request(app)
        .patch(`/api/v1/users/${targetUser.user.id}/platform-role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ platformRole: PlatformRole.PLATFORM_ADMIN });

      expect(promoteRes.status).toBe(200);
      expect(promoteRes.body.data.platformRole).toBe(PlatformRole.PLATFORM_ADMIN);

      // 3. Verify audit log was recorded
      const auditLog = await testPrisma.activityLog.findFirst({
        where: {
          action: 'PLATFORM_ROLE_UPDATED',
          resourceId: targetUser.user.id,
        },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.actorId).toBe(admin.user.id);
    });

    it('should protect against demoting the last active PLATFORM_ADMIN', async () => {
      const soloAdmin = await registerUser('Solo Admin', 'solo@test.com');

      await testPrisma.user.update({
        where: { id: soloAdmin.user.id },
        data: { platformRole: PlatformRole.PLATFORM_ADMIN },
      });

      // Solo admin attempts to demote themselves
      const res = await request(app)
        .patch(`/api/v1/users/${soloAdmin.user.id}/platform-role`)
        .set('Authorization', `Bearer ${soloAdmin.token}`)
        .send({ platformRole: PlatformRole.USER });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot demote the last active Platform Administrator');
    });
  });

  // ==========================================================================
  // LEVEL 2: WORKSPACE ROLES & INVITATION INTEGRITY
  // ==========================================================================
  describe('Level 2: Workspace Roles & Privilege Controls', () => {
    it('should assign OWNER to workspace creator', async () => {
      const owner = await registerUser('Workspace Founder', 'founder@test.com');

      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Acme Space' });

      expect(res.status).toBe(201);
      const workspaceId = res.body.data.id;

      const member = await testPrisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: owner.user.id,
          },
        },
      });
      expect(member?.role).toBe(WorkspaceRole.OWNER);
    });

    it('should prevent workspace ADMIN from inviting another ADMIN or OWNER', async () => {
      const owner = await registerUser('Alice Owner', 'alice_owner@test.com');
      const admin = await registerUser('Bob Admin', 'bob_admin@test.com');

      // Create workspace and add Bob as ADMIN
      const wsRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Security Workspace' });
      const workspaceId = wsRes.body.data.id;

      await testPrisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: admin.user.id,
          role: WorkspaceRole.ADMIN,
        },
      });

      // Admin tries to invite someone with role ADMIN
      const inviteAdminRes = await request(app)
        .post(`/api/v1/invitations/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          email: 'newadmin@test.com',
          role: WorkspaceRole.ADMIN,
        });

      expect(inviteAdminRes.status).toBe(403);
      expect(inviteAdminRes.body.message).toContain('Workspace Admins cannot invite new Admins');

      // Admin tries to invite someone with role OWNER (rejected by validation)
      const inviteOwnerRes = await request(app)
        .post(`/api/v1/invitations/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          email: 'newowner@test.com',
          role: WorkspaceRole.OWNER,
        });

      expect(inviteOwnerRes.status).toBe(400);
    });

    it('should reject invitation acceptance if the authenticated user email does not match invited email', async () => {
      const owner = await registerUser('Owner User', 'owner_invite@test.com');
      const legitimateInvitee = await registerUser('Invited User', 'legit@test.com');
      const attacker = await registerUser('Attacker', 'attacker@test.com');

      const wsRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Confidential Workspace' });
      const workspaceId = wsRes.body.data.id;

      // Send invitation to legit@test.com
      const inviteRes = await request(app)
        .post(`/api/v1/invitations/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          email: 'legit@test.com',
          role: WorkspaceRole.MEMBER,
        });

      const token = inviteRes.body.data.token;

      // Attacker intercepts token and tries to accept it
      const hijackRes = await request(app)
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${attacker.token}`)
        .send({ token });

      expect(hijackRes.status).toBe(403);
      expect(hijackRes.body.message).toContain('different email address');

      // Legit user accepts successfully
      const legitRes = await request(app)
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${legitimateInvitee.token}`)
        .send({ token });

      expect(legitRes.status).toBe(200);
      expect(legitRes.body.success).toBe(true);
    });

    it('should support ownership transfer and restrict non-owners from transferring', async () => {
      const owner = await registerUser('Alice OldOwner', 'alice_old@test.com');
      const member = await registerUser('Bob NewOwner', 'bob_new@test.com');

      const wsRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Transfer Test Space' });
      const workspaceId = wsRes.body.data.id;

      await testPrisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: member.user.id,
          role: WorkspaceRole.MEMBER,
        },
      });

      // Member attempts transfer (should be forbidden)
      const invalidTransferRes = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/transfer-ownership`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ newOwnerUserId: member.user.id });

      expect(invalidTransferRes.status).toBe(403);

      // Owner transfers to member
      const transferRes = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/transfer-ownership`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          newOwnerUserId: member.user.id,
        });

      expect(transferRes.status).toBe(200);

      // Verify roles in DB
      const oldOwnerMember = await testPrisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: owner.user.id } },
      });
      const newOwnerMember = await testPrisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: member.user.id } },
      });

      expect(oldOwnerMember?.role).toBe(WorkspaceRole.ADMIN);
      expect(newOwnerMember?.role).toBe(WorkspaceRole.OWNER);

      // Check audit log
      const auditLog = await testPrisma.activityLog.findFirst({
        where: {
          action: 'WORKSPACE_OWNERSHIP_TRANSFERRED',
          workspaceId,
        },
      });
      expect(auditLog).toBeDefined();
    });
  });

  // ==========================================================================
  // LEVEL 3: PROJECT ROLES & TASK PERMISSION ENFORCEMENT
  // ==========================================================================
  describe('Level 3: Project Roles & Task Permission Enforcement', () => {
    async function setupProjectWithRoles() {
      const owner = await registerUser('Project Owner', 'proj_owner@test.com');
      const manager = await registerUser('Project Manager', 'proj_mgr@test.com');
      const member = await registerUser('Project Member', 'proj_mbr@test.com');
      const viewer = await registerUser('Project Viewer', 'proj_view@test.com');

      // Create workspace
      const wsRes = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ name: 'Project Workspace' });
      const workspaceId = wsRes.body.data.id;

      // Add all to workspace
      for (const u of [manager, member, viewer]) {
        await testPrisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: u.user.id,
            role: WorkspaceRole.MEMBER,
          },
        });
      }

      // Owner creates project
      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({
          workspaceId,
          name: 'Core App',
          key: 'CORE',
        });
      const project = projRes.body.data;
      const projectId = project.id;
      const defaultColumnId = project.boards[0].columns[0].id;

      // Add project members with distinct roles
      await testPrisma.projectMember.createMany({
        data: [
          { projectId, userId: manager.user.id, role: ProjectRole.MANAGER },
          { projectId, userId: member.user.id, role: ProjectRole.MEMBER },
          { projectId, userId: viewer.user.id, role: ProjectRole.VIEWER },
        ],
      });

      return {
        workspaceId,
        projectId,
        defaultColumnId,
        owner,
        manager,
        member,
        viewer,
      };
    }

    it('should strictly block Project VIEWER from creating, modifying, or moving tasks', async () => {
      const { projectId, defaultColumnId, viewer, member } = await setupProjectWithRoles();

      // 1. Viewer attempts to create a task (Forbidden)
      const createTaskRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({
          projectId,
          boardColumnId: defaultColumnId,
          title: 'Unauthorized Task',
        });

      expect(createTaskRes.status).toBe(403);

      // 2. Member creates a valid task
      const memberCreateRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          projectId,
          boardColumnId: defaultColumnId,
          title: 'Legitimate Task',
        });

      expect(memberCreateRes.status).toBe(201);
      const taskId = memberCreateRes.body.data.id;

      // 3. Viewer attempts to update the task (Forbidden)
      const updateRes = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({ title: 'Hacked Title' });

      expect(updateRes.status).toBe(403);

      // 4. Viewer attempts to delete the task (Forbidden)
      const deleteRes = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${viewer.token}`);

      expect(deleteRes.status).toBe(403);

      // 5. Viewer attempts to comment on task (Forbidden)
      const commentRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({ content: 'Viewer comment attempt' });

      expect(commentRes.status).toBe(403);
    });

    it('should allow Project MEMBER to create and update tasks, but reject deleting projects', async () => {
      const { projectId, defaultColumnId, member } = await setupProjectWithRoles();

      // Member creates task
      const taskRes = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${member.token}`)
        .send({
          projectId,
          boardColumnId: defaultColumnId,
          title: 'Member Task',
        });

      expect(taskRes.status).toBe(201);
      const taskId = taskRes.body.data.id;

      // Member updates task
      const updateRes = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${member.token}`)
        .send({ title: 'Updated Member Task' });

      expect(updateRes.status).toBe(200);

      // Member attempts to delete project (Forbidden)
      const deleteProjRes = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${member.token}`);

      expect(deleteProjRes.status).toBe(403);
    });

    it('should allow Project MANAGER and Workspace OWNER to manage project members', async () => {
      const { workspaceId, projectId, manager, owner } = await setupProjectWithRoles();
      const candidate = await registerUser('New Dev', 'newdev@test.com');

      // Enroll candidate in workspace first
      await testPrisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: candidate.user.id,
          role: WorkspaceRole.MEMBER,
        },
      });

      // Manager adds candidate to project (as VIEWER)
      const addRes = await request(app)
        .post(`/api/v1/projects/${projectId}/members`)
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          userId: candidate.user.id,
          role: ProjectRole.VIEWER,
        });

      expect(addRes.status).toBe(201);

      // Owner promotes candidate to MEMBER
      const updateRes = await request(app)
        .patch(`/api/v1/projects/${projectId}/members/${candidate.user.id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ role: ProjectRole.MEMBER });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.role).toBe(ProjectRole.MEMBER);
    });
  });
});
