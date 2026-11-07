import { PrismaClient, PlatformRole, UserStatus, WorkspaceRole, ProjectRole, ProjectStatus, PriorityLevel, NotificationType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for TeamFlow...');

  // 1. Clean existing records in reverse dependency order
  await prisma.taskDependency.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.boardColumn.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.label.deleteMany();
  await prisma.workspaceInvitation.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Hash common password
  const defaultPasswordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id
  });

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@teamflow.local',
      passwordHash: defaultPasswordHash,
      platformRole: PlatformRole.PLATFORM_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    }
  });

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@teamflow.local',
      passwordHash: defaultPasswordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    }
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@teamflow.local',
      passwordHash: defaultPasswordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    }
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Davis',
      email: 'charlie@teamflow.local',
      passwordHash: defaultPasswordHash,
      platformRole: PlatformRole.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date()
    }
  });

  console.log('👤 Created test users: admin, alice, bob, charlie (Password: Password123!)');

  // 4. Create Workspace: Acme Corp Engineering
  const acmeWorkspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp Engineering',
      slug: 'acme-corp-engineering',
      description: 'Primary product development workspace for Acme Corp.',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: WorkspaceRole.OWNER },
          { userId: adminUser.id, role: WorkspaceRole.ADMIN },
          { userId: bob.id, role: WorkspaceRole.ADMIN },
          { userId: charlie.id, role: WorkspaceRole.MEMBER }
        ]
      },
      labels: {
        create: [
          { name: 'Bug', color: '#EF4444' },
          { name: 'Feature', color: '#3B82F6' },
          { name: 'Enhancement', color: '#10B981' },
          { name: 'Backend', color: '#8B5CF6' },
          { name: 'Frontend', color: '#EC4899' },
          { name: 'DevOps', color: '#F59E0B' }
        ]
      }
    },
    include: {
      labels: true
    }
  });

  console.log('🏢 Created Workspace: Acme Corp Engineering');

  // 5. Create Project: TeamFlow Core Engine
  const teamflowProject = await prisma.project.create({
    data: {
      workspaceId: acmeWorkspace.id,
      name: 'TeamFlow Core Engine',
      key: 'TF',
      description: 'Backend platform architecture, real-time collaboration, and data APIs.',
      status: ProjectStatus.ACTIVE,
      priority: PriorityLevel.HIGH,
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: ProjectRole.MANAGER },
          { userId: bob.id, role: ProjectRole.MEMBER },
          { userId: charlie.id, role: ProjectRole.VIEWER }
        ]
      },
      boards: {
        create: {
          name: 'Main Board',
          isDefault: true,
          position: 1,
          columns: {
            create: [
              { name: 'To Do', position: 1000, color: '#94A3B8' },
              { name: 'In Progress', position: 2000, color: '#3B82F6' },
              { name: 'In Review', position: 3000, color: '#F59E0B' },
              { name: 'Completed', position: 4000, color: '#10B981', isCompletedColumn: true }
            ]
          }
        }
      }
    },
    include: {
      boards: {
        include: {
          columns: true
        }
      }
    }
  });

  const columns = teamflowProject.boards[0].columns;
  const todoCol = columns.find((c) => c.name === 'To Do')!;
  const inProgressCol = columns.find((c) => c.name === 'In Progress')!;
  const reviewCol = columns.find((c) => c.name === 'In Review')!;
  const completedCol = columns.find((c) => c.name === 'Completed')!;

  const bugLabel = acmeWorkspace.labels.find((l) => l.name === 'Bug')!;
  const backendLabel = acmeWorkspace.labels.find((l) => l.name === 'Backend')!;
  const featureLabel = acmeWorkspace.labels.find((l) => l.name === 'Feature')!;

  // 6. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      projectId: teamflowProject.id,
      boardColumnId: todoCol.id,
      title: 'Design database schema & relations',
      description: 'Map out PostgreSQL tables, constraints, foreign keys, and indexes.',
      priority: PriorityLevel.URGENT,
      position: 1000,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: alice.id,
      assignees: {
        create: [{ userId: bob.id, assignedById: alice.id }]
      },
      labels: {
        create: [{ labelId: backendLabel.id }]
      }
    }
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: teamflowProject.id,
      boardColumnId: inProgressCol.id,
      title: 'Implement JWT authentication & refresh rotation',
      description: 'Integrate Argon2id password hashing, HTTP-only cookie support, and refresh tokens.',
      priority: PriorityLevel.HIGH,
      position: 1000,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdById: alice.id,
      assignees: {
        create: [{ userId: alice.id, assignedById: alice.id }, { userId: bob.id, assignedById: alice.id }]
      },
      labels: {
        create: [{ labelId: featureLabel.id }, { labelId: backendLabel.id }]
      }
    }
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: teamflowProject.id,
      boardColumnId: completedCol.id,
      title: 'Project architecture setup',
      description: 'Configure TypeScript, Express, Pino logger, and directory structure.',
      priority: PriorityLevel.MEDIUM,
      position: 1000,
      completedAt: new Date(),
      createdById: alice.id,
      assignees: {
        create: [{ userId: alice.id, assignedById: alice.id }]
      }
    }
  });

  // 7. Add Comments & Replies
  const comment1 = await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: alice.id,
      content: 'Make sure refresh tokens use family detection to revoke compromised token lineages.'
    }
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: bob.id,
      parentId: comment1.id,
      content: 'Agreed! Implemented token family rotation in the auth service.'
    }
  });

  // 8. Add Notifications
  await prisma.notification.create({
    data: {
      recipientId: bob.id,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assignment',
      message: 'Alice Johnson assigned you to "Design database schema & relations".',
      resourceType: 'task',
      resourceId: task1.id,
      isRead: false
    }
  });

  // 9. Add Activity Logs
  await prisma.activityLog.create({
    data: {
      actorId: alice.id,
      workspaceId: acmeWorkspace.id,
      projectId: teamflowProject.id,
      resourceType: 'project',
      resourceId: teamflowProject.id,
      action: 'PROJECT_CREATED',
      metadata: { name: teamflowProject.name }
    }
  });

  console.log('✅ Database seeded successfully with full test suite data.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
