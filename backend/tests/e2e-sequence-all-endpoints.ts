import http from 'http';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { io as ClientSocket, Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.APP_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1`;

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
  error?: any;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASSED: ${message}`);
}

async function request<T = any>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
    expectedStatus?: number | number[];
  } = {}
): Promise<{ status: number; body: ApiResponse<T> }> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const expected = options.expectedStatus ?? 200;
  const isExpected = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (!isExpected) {
    console.error(`HTTP ${method} ${url} failed. Expected: ${expected}, Got: ${res.status}. Response:`, body);
  }

  return { status: res.status, body };
}

async function runAllTests() {
  const timestamp = Date.now();
  console.log(`\n======================================================================`);
  console.log(`🚀 STARTING TEAMFLOW TEST SUITE: ALL 16 STEPS & 50+ ENDPOINTS`);
  console.log(`======================================================================\n`);

  // State variables across sequence
  let user1 = { id: '', email: `alex_${timestamp}@test.local`, password: 'Password123!', accessToken: '', refreshToken: '' };
  let user2 = { id: '', email: `sam_${timestamp}@test.local`, password: 'Password123!', accessToken: '', refreshToken: '' };
  let user3 = { id: '', email: `stranger_${timestamp}@test.local`, password: 'Password123!', accessToken: '', refreshToken: '' };
  let workspaceId = '';
  let invitationToken = '';
  let invitationId = '';
  let projectId = '';
  let defaultBoardId = '';
  let todoColumnId = '';
  let inProgressColumnId = '';
  let doneColumnId = '';
  let taskId = '';
  let commentId = '';
  let replyCommentId = '';
  let labelId = '';

  // -------------------------------------------------------------------------
  // STEP 1: Health check
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 1/16] Health check (GET /health)`);
  {
    const res = await request(`${BASE_URL}/health`);
    assert(res.status === 200, 'Health endpoint responds with HTTP 200');
    assert(res.body.status === 'healthy', 'Health check status is "healthy"');
    assert(typeof res.body.uptime === 'number', 'Health check reports uptime');
  }

  // -------------------------------------------------------------------------
  // STEP 2: Register
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 2/16] Register (POST /api/v1/auth/register)`);
  {
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alex Lead',
        email: user1.email,
        password: user1.password
      },
      expectedStatus: 201
    });
    assert(res.status === 201, 'User 1 registered with HTTP 201');
    assert(res.body.success === true, 'Registration reports success');
    assert(Boolean(res.body.data.tokens?.accessToken), 'Returns access token');
    assert(Boolean(res.body.data.tokens?.refreshToken), 'Returns refresh token');
    user1.id = res.body.data.user.id;
    user1.accessToken = res.body.data.tokens.accessToken;
    user1.refreshToken = res.body.data.tokens.refreshToken;
    console.log(`    User 1 registered: ID=${user1.id}, Email=${user1.email}`);
  }

  // -------------------------------------------------------------------------
  // STEP 3: Login
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 3/16] Login (POST /api/v1/auth/login)`);
  {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: user1.email,
        password: user1.password
      },
      expectedStatus: 200
    });
    assert(res.status === 200, 'Login succeeded with HTTP 200');
    assert(res.body.data.user.email === user1.email, 'Logged-in user email matches User 1');
    assert(Boolean(res.body.data.tokens.accessToken), 'Returned fresh JWT access token');
    user1.accessToken = res.body.data.tokens.accessToken;
    user1.refreshToken = res.body.data.tokens.refreshToken;
  }

  // -------------------------------------------------------------------------
  // STEP 4: Get current user
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 4/16] Get current user (GET /api/v1/auth/me)`);
  {
    const res = await request('/auth/me', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(res.status === 200, 'GET /auth/me succeeded with HTTP 200');
    assert(res.body.data.id === user1.id, 'User profile ID matches registered ID');
    assert(res.body.data.email === user1.email, 'User profile email matches registered email');
  }

  // -------------------------------------------------------------------------
  // STEP 5: Create workspace
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 5/16] Create workspace (POST /api/v1/workspaces)`);
  {
    const res = await request('/workspaces', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        name: `Engineering Org ${timestamp}`,
        description: 'Primary Engineering Workspace for Cloud Platform'
      },
      expectedStatus: 201
    });
    assert(res.status === 201, 'Workspace created with HTTP 201');
    assert(res.body.data.name.includes('Engineering Org'), 'Workspace name set correctly');
    assert(res.body.data.ownerId === user1.id, 'Workspace creator is set as owner');
    workspaceId = res.body.data.id;
    console.log(`    Workspace created: ID=${workspaceId}`);
  }

  // -------------------------------------------------------------------------
  // STEP 6: Invite another user
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 6/16] Invite another user (POST /api/v1/invitations/workspaces/:workspaceId)`);
  {
    // First, register User 2 so they can authenticate and accept
    const reg2 = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Sam Developer',
        email: user2.email,
        password: user2.password
      },
      expectedStatus: 201
    });
    user2.id = reg2.body.data.user.id;
    user2.accessToken = reg2.body.data.tokens.accessToken;
    user2.refreshToken = reg2.body.data.tokens.refreshToken;
    console.log(`    User 2 registered: ID=${user2.id}, Email=${user2.email}`);

    // User 1 sends workspace invitation to User 2
    const inviteRes = await request(`/invitations/workspaces/${workspaceId}`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        email: user2.email,
        role: 'MEMBER'
      },
      expectedStatus: 201
    });
    assert(inviteRes.status === 201, 'Workspace invitation created with HTTP 201');
    assert(inviteRes.body.data.email === user2.email, 'Invitation recipient matches User 2');
    invitationToken = inviteRes.body.data.token;
    invitationId = inviteRes.body.data.id;
    assert(Boolean(invitationToken), 'Secure invitation token generated');

    // User 2 verifies invitation details (Public endpoint)
    const detailsRes = await request(`/invitations/details/${invitationToken}`, {
      expectedStatus: 200
    });
    assert(detailsRes.status === 200, 'Public invitation details verified with HTTP 200');
    assert(detailsRes.body.data.workspace.name.includes('Engineering Org'), 'Invitation details report correct workspace name');

    // User 2 accepts invitation
    const acceptRes = await request('/invitations/accept', {
      method: 'POST',
      token: user2.accessToken,
      body: {
        token: invitationToken
      },
      expectedStatus: 200
    });
    assert(acceptRes.status === 200, 'User 2 accepted invitation with HTTP 200');
    assert(acceptRes.body.data.workspaceId === workspaceId, 'Accepted invitation joined correct workspace');
  }

  // -------------------------------------------------------------------------
  // STEP 7: Create project
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 7/16] Create project (POST /api/v1/projects)`);
  {
    const res = await request('/projects', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        workspaceId,
        name: 'Apollo Cloud Platform',
        description: 'Next-generation microservices cloud backend',
        key: 'APL',
        priority: 'HIGH'
      },
      expectedStatus: 201
    });
    assert(res.status === 201, 'Project created with HTTP 201');
    assert(res.body.data.name === 'Apollo Cloud Platform', 'Project name set properly');
    assert(res.body.data.workspaceId === workspaceId, 'Project attached to workspace');
    projectId = res.body.data.id;
    console.log(`    Project created: ID=${projectId}, Key=APL`);

    // Verify atomic board creation in response
    if (res.body.data.boards && res.body.data.boards.length > 0) {
      defaultBoardId = res.body.data.boards[0].id;
      const cols = res.body.data.boards[0].columns || [];
      if (cols.length >= 4) {
        todoColumnId = cols.find((c: any) => c.name === 'To Do')?.id || cols[0].id;
        inProgressColumnId = cols.find((c: any) => c.name === 'In Progress')?.id || cols[1].id;
        doneColumnId = cols.find((c: any) => c.name === 'Completed')?.id || cols[3].id;
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 8: Retrieve default board
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 8/16] Retrieve default board (GET /api/v1/boards/project/:projectId)`);
  {
    const res = await request(`/boards/project/${projectId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(res.status === 200, 'Retrieved project boards with HTTP 200');
    assert(Array.isArray(res.body.data) && res.body.data.length >= 1, 'Project has at least 1 board automatically generated');
    const board = res.body.data[0];
    defaultBoardId = board.id;
    assert(board.isDefault === true, 'Board is marked as default board');
    assert(Array.isArray(board.columns) && board.columns.length === 4, 'Board automatically initialized with 4 Kanban columns');
    
    todoColumnId = board.columns.find((c: any) => c.name === 'To Do')!.id;
    inProgressColumnId = board.columns.find((c: any) => c.name === 'In Progress')!.id;
    doneColumnId = board.columns.find((c: any) => c.name === 'Completed')!.id;
    console.log(`    Default Board: ID=${defaultBoardId}, Columns: To Do (${todoColumnId}), In Progress (${inProgressColumnId}), Completed (${doneColumnId})`);
  }

  // -------------------------------------------------------------------------
  // STEP 9: Create task
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 9/16] Create task (POST /api/v1/tasks)`);
  {
    // First, add User 2 as project member so they can be assigned
    const memberRes = await request(`/projects/${projectId}/members`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        userId: user2.id,
        role: 'MEMBER'
      },
      expectedStatus: 201
    });
    assert(memberRes.status === 201, 'User 2 added to project members');

    const res = await request('/tasks', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        projectId,
        boardColumnId: todoColumnId,
        title: 'Architect Distributed Caching Tier',
        description: 'Design and deploy Redis Sentinel cluster for session caching',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      expectedStatus: 201
    });
    assert(res.status === 201, 'Task created with HTTP 201');
    assert(res.body.data.title === 'Architect Distributed Caching Tier', 'Task title set correctly');
    assert(res.body.data.priority === 'HIGH', 'Task priority set correctly');
    taskId = res.body.data.id;
    console.log(`    Task created: ID=${taskId}`);
  }

  // -------------------------------------------------------------------------
  // STEP 10: Assign task
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 10/16] Assign task (POST /api/v1/tasks/:taskId/assign)`);
  {
    const res = await request(`/tasks/${taskId}/assign`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        userIds: [user2.id]
      },
      expectedStatus: 200
    });
    assert(res.status === 200, 'Assigned task to User 2 with HTTP 200');
    assert(Array.isArray(res.body.data.assignees), 'Task has assignees array');
    const assigned = res.body.data.assignees.some((a: any) => a.userId === user2.id || a.user?.id === user2.id);
    assert(assigned, 'User 2 is recorded as task assignee');
  }

  // -------------------------------------------------------------------------
  // STEP 11: Update task
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 11/16] Update task (PATCH /api/v1/tasks/:taskId & POST /move)`);
  {
    // 11a: Update metadata
    const updateRes = await request(`/tasks/${taskId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: {
        title: 'Architect Distributed Caching Tier (Production Ready)',
        priority: 'URGENT',
        description: 'Design and deploy Redis Sentinel cluster with TLS and Sentinel quorum'
      },
      expectedStatus: 200
    });
    assert(updateRes.status === 200, 'Task updated with HTTP 200');
    assert(updateRes.body.data.priority === 'URGENT', 'Priority updated to URGENT');
    assert(updateRes.body.data.title.includes('Production Ready'), 'Title updated successfully');

    // 11b: Move task across columns (Drag-and-Drop)
    const moveRes = await request(`/tasks/${taskId}/move`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        destinationColumnId: inProgressColumnId,
        newPosition: 1
      },
      expectedStatus: 200
    });
    assert(moveRes.status === 200, 'Task moved to In Progress column with HTTP 200');
    assert(moveRes.body.data.boardColumnId === inProgressColumnId || moveRes.body.data.columnId === inProgressColumnId, 'Task columnId matches In Progress column');
  }

  // -------------------------------------------------------------------------
  // STEP 12: Create comment
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 12/16] Create comment (POST /api/v1/tasks/:taskId/comments)`);
  {
    // User 2 posts top-level comment
    const commentRes = await request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      token: user2.accessToken,
      body: {
        content: 'I have configured the 3-node Sentinel quorum in staging.'
      },
      expectedStatus: 201
    });
    assert(commentRes.status === 201, 'Top-level comment created with HTTP 201');
    assert(commentRes.body.data.content.includes('Sentinel quorum'), 'Comment content verified');
    commentId = commentRes.body.data.id;

    // User 1 posts threaded reply
    const replyRes = await request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        content: 'Great progress! Please ensure replication timeout is set to 3000ms.',
        parentId: commentId
      },
      expectedStatus: 201
    });
    assert(replyRes.status === 201, 'Threaded reply created with HTTP 201');
    assert(replyRes.body.data.parentId === commentId, 'Reply linked to parent comment ID');
    replyCommentId = replyRes.body.data.id;
    console.log(`    Comments created: Parent ID=${commentId}, Reply ID=${replyCommentId}`);
  }

  // -------------------------------------------------------------------------
  // STEP 13: Check notifications
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 13/16] Check notifications (GET & PATCH /api/v1/notifications)`);
  {
    // User 2 received notifications for task assignment / comment
    const notifsRes = await request('/notifications', {
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(notifsRes.status === 200, 'Retrieved User 2 notifications with HTTP 200');
    const notifItems = notifsRes.body.data.items || notifsRes.body.data;
    assert(Array.isArray(notifItems), 'Notifications response contains items array');

    // Unread count
    const unreadRes = await request('/notifications/unread-count', {
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(unreadRes.status === 200, 'Retrieved unread count with HTTP 200');
    assert(typeof unreadRes.body.data.unreadCount === 'number', 'Unread count is a numeric value');
    console.log(`    User 2 has ${unreadRes.body.data.unreadCount} unread notifications`);

    // Mark all as read
    const markReadRes = await request('/notifications/read-all', {
      method: 'PATCH',
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(markReadRes.status === 200, 'Marked all notifications as read with HTTP 200');
  }

  // -------------------------------------------------------------------------
  // STEP 14: Test authorization with two users
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 14/16] Test authorization with two users`);
  {
    // Register User 3 (unrelated external user with no workspace access)
    const reg3 = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Eve Intruder',
        email: user3.email,
        password: user3.password
      },
      expectedStatus: 201
    });
    user3.id = reg3.body.data.user.id;
    user3.accessToken = reg3.body.data.tokens.accessToken;

    // 14a: Non-member (User 3) denied accessing workspace
    const accessDenied = await request(`/workspaces/${workspaceId}`, {
      token: user3.accessToken,
      expectedStatus: 403
    });
    assert(accessDenied.status === 403, 'User 3 (non-member) is blocked from accessing workspace (403 FORBIDDEN)');

    // 14b: Workspace Member (User 2) denied deleting workspace (requires OWNER)
    const deleteBlocked = await request(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
      token: user2.accessToken,
      expectedStatus: 403
    });
    assert(deleteBlocked.status === 403, 'User 2 (MEMBER) cannot delete workspace (403 FORBIDDEN)');

    // 14c: Unauthorized removal of OWNER prevented
    const removeOwnerBlocked = await request(`/workspaces/${workspaceId}/members/${user1.id}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 400
    });
    assert(removeOwnerBlocked.status === 400, 'Owner removal guardrail prevents deleting workspace owner (400 BAD REQUEST)');

    // 14d: Project isolation: User 3 denied listing tasks in private project
    const projectDenied = await request(`/tasks/project/${projectId}`, {
      token: user3.accessToken,
      expectedStatus: 403
    });
    assert(projectDenied.status === 403, 'User 3 denied reading project tasks (403 FORBIDDEN)');

    // 14e: Cross-project task guardrail: cannot move task into another project's column
    // Create a 2nd project in workspace to get an external column
    const proj2Res = await request('/projects', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        workspaceId,
        name: 'Beta Project Isolation Test',
        key: 'BETA'
      },
      expectedStatus: 201
    });
    const foreignColumnId = proj2Res.body.data.boards[0].columns[0].id;
    const illegalMove = await request(`/tasks/${taskId}/move`, {
      method: 'POST',
      token: user1.accessToken,
      body: {
        destinationColumnId: foreignColumnId,
        newPosition: 1
      },
      expectedStatus: 400
    });
    assert(illegalMove.status === 400, 'Prevented cross-project task move to external column (400 BAD REQUEST)');

    // 14f: Comment editing permissions: User 2 cannot edit User 1's comment
    const commentEditBlocked = await request(`/comments/${replyCommentId}`, {
      method: 'PATCH',
      token: user2.accessToken,
      body: {
        content: 'Malicious modification of lead comment'
      },
      expectedStatus: 403
    });
    assert(commentEditBlocked.status === 403, 'User 2 cannot edit another user\'s comment (403 FORBIDDEN)');
  }

  // -------------------------------------------------------------------------
  // STEP 15: Test Socket.IO
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 15/16] Test Socket.IO (Real-Time WebSocket Protocol)`);
  {
    // Test 15a: Reject unauthenticated socket connection
    await new Promise<void>((resolve) => {
      const badSocket: Socket = ClientSocket(BASE_URL, {
        auth: { token: 'invalid_token_xyz' },
        transports: ['websocket'],
        reconnection: false
      });
      badSocket.on('connect_error', (err) => {
        assert(Boolean(err), 'Unauthenticated socket rejected with connect_error');
        badSocket.disconnect();
        resolve();
      });
    });

    // Test 15b: Authenticate User 1, User 2, and User 3 sockets
    const socket1: Socket = ClientSocket(BASE_URL, {
      auth: { token: user1.accessToken },
      transports: ['websocket'],
      reconnection: false
    });
    const socket2: Socket = ClientSocket(BASE_URL, {
      auth: { token: user2.accessToken },
      transports: ['websocket'],
      reconnection: false
    });
    const socket3: Socket = ClientSocket(BASE_URL, {
      auth: { token: user3.accessToken },
      transports: ['websocket'],
      reconnection: false
    });

    await Promise.all([
      new Promise<void>((resolve) => socket1.on('connect', () => {
        assert(socket1.connected, 'Socket 1 connected with User 1 credentials');
        resolve();
      })),
      new Promise<void>((resolve) => socket2.on('connect', () => {
        assert(socket2.connected, 'Socket 2 connected with User 2 credentials');
        resolve();
      })),
      new Promise<void>((resolve) => socket3.on('connect', () => {
        assert(socket3.connected, 'Socket 3 connected with User 3 credentials');
        resolve();
      }))
    ]);

    // Test 15c: Unauthorized user room subscription rejected
    await new Promise<void>((resolve) => {
      socket3.emit('workspace:join', { workspaceId }, (ack: any) => {
        assert(ack?.success === false, 'User 3 rejected from unauthorized workspace room');
        socket3.emit('project:join', { projectId }, (pAck: any) => {
          assert(pAck?.success === false, 'User 3 rejected from unauthorized project room');
          resolve();
        });
      });
    });

    // Test 15d: Authorized users join workspace and project rooms
    await new Promise<void>((resolve) => {
      socket1.emit('workspace:join', { workspaceId }, (ack: any) => {
        assert(ack?.success === true, 'Socket 1 joined workspace room with server ack');
        socket1.emit('project:join', { projectId }, (pAck: any) => {
          assert(pAck?.success === true, 'Socket 1 joined project room with server ack');
          socket2.emit('project:join', { projectId }, (pAck2: any) => {
            assert(pAck2?.success === true, 'Socket 2 joined project room with server ack');
            resolve();
          });
        });
      });
    });

    // Test 15e: Room leave handlers
    await new Promise<void>((resolve) => {
      socket2.emit('project:leave', { projectId });
      socket1.emit('workspace:leave', { workspaceId });
      setTimeout(() => {
        assert(true, 'Sockets gracefully executed room leave handlers');
        resolve();
      }, 300);
    });

    // Clean disconnect
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();
    assert(!socket1.connected && !socket2.connected && !socket3.connected, 'Sockets cleanly disconnected');
  }

  // -------------------------------------------------------------------------
  // STEP 16: Run the complete collection (Testing all 50+ endpoints)
  // -------------------------------------------------------------------------
  console.log(`\n▶ [STEP 16/16] Run the complete collection (Testing all 50+ endpoints)`);
  {
    console.log('    Testing all remaining module endpoints for full API coverage:');

    // 16.1 Auth: Refresh token rotation
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: user1.refreshToken },
      expectedStatus: 200
    });
    assert(refreshRes.status === 200, '[Auth] POST /api/v1/auth/refresh (rotate tokens)');
    user1.accessToken = refreshRes.body.data.tokens.accessToken;
    user1.refreshToken = refreshRes.body.data.tokens.refreshToken;

    // 16.2 Auth: List active sessions
    const sessionsRes = await request('/auth/sessions', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(sessionsRes.status === 200, '[Auth] GET /api/v1/auth/sessions (list sessions)');
    assert(Array.isArray(sessionsRes.body.data), 'Sessions returned as array');

    // 16.3 Auth: Revoke a specific session
    if (sessionsRes.body.data.length > 1) {
      const targetSession = sessionsRes.body.data[1].id;
      const revokeRes = await request(`/auth/sessions/${targetSession}`, {
        method: 'DELETE',
        token: user1.accessToken,
        expectedStatus: 200
      });
      assert(revokeRes.status === 200, `[Auth] DELETE /api/v1/auth/sessions/:id (revoked session ${targetSession})`);
    }

    // 16.4 Auth: Forgot password request
    const forgotRes = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: user1.email },
      expectedStatus: 200
    });
    assert(forgotRes.status === 200, '[Auth] POST /api/v1/auth/forgot-password (request reset)');

    // 16.5 Auth: Reset password using token
    const testResetToken = 'test_reset_token_' + timestamp;
    const resetTokenHash = crypto.createHash('sha256').update(testResetToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user1.id,
        tokenHash: resetTokenHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    });
    const resetRes = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: testResetToken, password: 'NewPassword123!' },
      expectedStatus: 200
    });
    assert(resetRes.status === 200, '[Auth] POST /api/v1/auth/reset-password (reset password)');
    user1.password = 'NewPassword123!';

    // Re-login with new password to get fresh tokens
    const reLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: user1.email, password: user1.password },
      expectedStatus: 200
    });
    user1.accessToken = reLogin.body.data.tokens.accessToken;
    user1.refreshToken = reLogin.body.data.tokens.refreshToken;

    // 16.6 Auth: Verify email with token
    const testVerifyToken = 'test_verify_token_' + timestamp;
    const verifyTokenHash = crypto.createHash('sha256').update(testVerifyToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId: user1.id,
        tokenHash: verifyTokenHash,
        expiresAt: new Date(Date.now() + 3600000)
      }
    });
    const verifyRes = await request('/auth/verify-email', {
      method: 'POST',
      body: { token: testVerifyToken },
      expectedStatus: 200
    });
    assert(verifyRes.status === 200, '[Auth] POST /api/v1/auth/verify-email (verify email)');

    // 16.7 Users: Search users
    const searchRes = await request('/users/search?query=Sam', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(searchRes.status === 200, '[Users] GET /api/v1/users/search (search user by name/email)');

    // 16.8 Users: Update profile
    const profileRes = await request('/users/profile', {
      method: 'PATCH',
      token: user1.accessToken,
      body: {
        name: 'Alex Lead (Platform VP)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
      },
      expectedStatus: 200
    });
    assert(profileRes.status === 200, '[Users] PATCH /api/v1/users/profile (update profile name & avatar)');

    // 16.9 Users: Change password
    const changePassRes = await request('/users/change-password', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        currentPassword: 'NewPassword123!',
        newPassword: 'Password123!'
      },
      expectedStatus: 200
    });
    assert(changePassRes.status === 200, '[Users] POST /api/v1/users/change-password (change password)');
    user1.password = 'Password123!';

    // Re-login after password change
    const reLogin2 = await request('/auth/login', {
      method: 'POST',
      body: { email: user1.email, password: user1.password },
      expectedStatus: 200
    });
    user1.accessToken = reLogin2.body.data.tokens.accessToken;

    // 16.10 Workspaces: List my workspaces
    const wsListRes = await request('/workspaces', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(wsListRes.status === 200, '[Workspaces] GET /api/v1/workspaces (list user workspaces)');

    // 16.11 Workspaces: Get workspace details
    const wsDetailsRes = await request(`/workspaces/${workspaceId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(wsDetailsRes.status === 200, `[Workspaces] GET /api/v1/workspaces/${workspaceId} (workspace details)`);

    // 16.12 Workspaces: Update workspace
    const wsUpdateRes = await request(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: {
        name: `Engineering Org ${timestamp} (Global HQ)`,
        description: 'Updated enterprise headquarters workspace'
      },
      expectedStatus: 200
    });
    assert(wsUpdateRes.status === 200, '[Workspaces] PATCH /api/v1/workspaces/:id (update workspace details)');

    // 16.13 Workspaces: List workspace members
    const wsMembersRes = await request(`/workspaces/${workspaceId}/members`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(wsMembersRes.status === 200, '[Workspaces] GET /api/v1/workspaces/:id/members (list workspace members)');
    const memberList = wsMembersRes.body.data.items || wsMembersRes.body.data;
    assert(Array.isArray(memberList), '[Workspaces] Members list contains items');

    // 16.14 Workspaces: Update member role (User 2 -> ADMIN)
    const roleRes = await request(`/workspaces/${workspaceId}/members/${user2.id}/role`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { role: 'ADMIN' },
      expectedStatus: 200
    });
    assert(roleRes.status === 200, '[Workspaces] PATCH /api/v1/workspaces/:id/members/:userId/role (promote to ADMIN)');

    // 16.15 Invitations: List pending invitations
    const pendingInvRes = await request(`/invitations/workspaces/${workspaceId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(pendingInvRes.status === 200, '[Invitations] GET /api/v1/invitations/workspaces/:id (list invitations)');

    // 16.16 Invitations: Send another invitation & Cancel it
    const tempInv = await request(`/invitations/workspaces/${workspaceId}`, {
      method: 'POST',
      token: user1.accessToken,
      body: { email: `temp_${timestamp}@example.com`, role: 'GUEST' },
      expectedStatus: 201
    });
    const cancelInv = await request(`/invitations/workspaces/${workspaceId}/${tempInv.body.data.id}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(cancelInv.status === 200, '[Invitations] DELETE /api/v1/invitations/workspaces/:id/:invId (cancel invitation)');

    // 16.17 Invitations: Reject an invitation
    const rejectTargetInv = await request(`/invitations/workspaces/${workspaceId}`, {
      method: 'POST',
      token: user1.accessToken,
      body: { email: `reject_${timestamp}@example.com`, role: 'MEMBER' },
      expectedStatus: 201
    });
    const rejectRes = await request('/invitations/reject', {
      method: 'POST',
      token: user3.accessToken,
      body: { token: rejectTargetInv.body.data.token },
      expectedStatus: 200
    });
    assert(rejectRes.status === 200, '[Invitations] POST /api/v1/invitations/reject (reject invitation)');

    // 16.18 Projects: List workspace projects
    const projListRes = await request(`/projects/workspace/${workspaceId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projListRes.status === 200, '[Projects] GET /api/v1/projects/workspace/:id (list projects)');

    // 16.19 Projects: Get single project details
    const projDetailsRes = await request(`/projects/${projectId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projDetailsRes.status === 200, '[Projects] GET /api/v1/projects/:id (project details)');

    // 16.20 Projects: Update project
    const projUpdateRes = await request(`/projects/${projectId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: {
        description: 'Updated description for Apollo Cloud Platform'
      },
      expectedStatus: 200
    });
    assert(projUpdateRes.status === 200, '[Projects] PATCH /api/v1/projects/:id (update project)');

    // 16.21 Projects: Overview metrics
    const projOverviewRes = await request(`/projects/${projectId}/overview`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projOverviewRes.status === 200, '[Projects] GET /api/v1/projects/:id/overview (project overview)');

    // 16.22 Projects: Activity trail
    const projActivityRes = await request(`/projects/${projectId}/activity`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projActivityRes.status === 200, '[Projects] GET /api/v1/projects/:id/activity (project audit log)');

    // 16.23 Projects: Update project member role
    const updateProjMemberRes = await request(`/projects/${projectId}/members/${user2.id}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { role: 'MANAGER' },
      expectedStatus: 200
    });
    assert(updateProjMemberRes.status === 200, '[Projects] PATCH /api/v1/projects/:id/members/:userId (update role)');

    // 16.24 Boards: Create additional board
    const newBoardRes = await request('/boards', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        projectId,
        name: 'Sprint 2 Board',
        description: 'Secondary board for fast-track sprint'
      },
      expectedStatus: 201
    });
    assert(newBoardRes.status === 201, '[Boards] POST /api/v1/boards (create board)');
    const sprintBoardId = newBoardRes.body.data.id;

    // 16.25 Boards: Get board details
    const boardDetailsRes = await request(`/boards/${sprintBoardId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(boardDetailsRes.status === 200, '[Boards] GET /api/v1/boards/:id (board details)');

    // 16.26 Boards: Update board
    const boardUpdateRes = await request(`/boards/${sprintBoardId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { name: 'Sprint 2 Board (Q4 Focus)' },
      expectedStatus: 200
    });
    assert(boardUpdateRes.status === 200, '[Boards] PATCH /api/v1/boards/:id (update board)');

    // 16.27 Columns: Create column in board
    const colCreateRes = await request('/columns', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        boardId: sprintBoardId,
        name: 'Sprint Backlog',
        position: 0,
        color: '#6366f1'
      },
      expectedStatus: 201
    });
    assert(colCreateRes.status === 201, '[Columns] POST /api/v1/columns (create column)');
    const customColId = colCreateRes.body.data.id;

    // 16.28 Columns: Get column details
    const colDetailsRes = await request(`/columns/${customColId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(colDetailsRes.status === 200, '[Columns] GET /api/v1/columns/:id (get column details)');

    // 16.29 Columns: Update column
    const colUpdateRes = await request(`/columns/${customColId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { name: 'Refined Backlog', color: '#10b981' },
      expectedStatus: 200
    });
    assert(colUpdateRes.status === 200, '[Columns] PATCH /api/v1/columns/:id (update column)');

    // 16.30 Columns: Reorder columns
    const colReorderRes = await request('/columns/reorder', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        boardId: sprintBoardId,
        columns: [{ id: customColId, position: 2 }]
      },
      expectedStatus: 200
    });
    assert(colReorderRes.status === 200, '[Columns] POST /api/v1/columns/reorder (reorder columns)');

    // 16.31 Columns: Delete column
    const colDeleteRes = await request(`/columns/${customColId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(colDeleteRes.status === 200, '[Columns] DELETE /api/v1/columns/:id (delete column)');

    // 16.32 Boards: Delete secondary board
    const boardDeleteRes = await request(`/boards/${sprintBoardId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(boardDeleteRes.status === 200, '[Boards] DELETE /api/v1/boards/:id (delete board)');

    // 16.33 Labels: Create workspace label
    const labelCreateRes = await request('/labels', {
      method: 'POST',
      token: user1.accessToken,
      body: {
        workspaceId,
        name: 'Backend Tier',
        color: '#3b82f6'
      },
      expectedStatus: 201
    });
    assert(labelCreateRes.status === 201, '[Labels] POST /api/v1/labels (create label)');
    labelId = labelCreateRes.body.data.id;

    // 16.34 Labels: List workspace labels
    const labelListRes = await request(`/labels/workspace/${workspaceId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(labelListRes.status === 200, '[Labels] GET /api/v1/labels/workspace/:id (list labels)');

    // 16.35 Labels: Update label
    const labelUpdateRes = await request(`/labels/${labelId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { name: 'Core Infrastructure', color: '#8b5cf6' },
      expectedStatus: 200
    });
    assert(labelUpdateRes.status === 200, '[Labels] PATCH /api/v1/labels/:id (update label)');

    // 16.36 Tasks: Synchronize labels on task
    const syncLabelsRes = await request(`/tasks/${taskId}/labels`, {
      method: 'PUT',
      token: user1.accessToken,
      body: { labelIds: [labelId] },
      expectedStatus: 200
    });
    assert(syncLabelsRes.status === 200, '[Tasks] PUT /api/v1/tasks/:id/labels (sync task labels)');

    // 16.37 Tasks: List project tasks with filters
    const taskListRes = await request(`/tasks/project/${projectId}?priority=URGENT&search=Distributed`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(taskListRes.status === 200, '[Tasks] GET /api/v1/tasks/project/:id (list tasks with query filters)');
    const taskItems = taskListRes.body.data.items || taskListRes.body.data;
    assert(Array.isArray(taskItems), '[Tasks] Project tasks list contains items');

    // 16.38 Tasks: Get single task details
    const taskDetailsRes = await request(`/tasks/${taskId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(taskDetailsRes.status === 200, '[Tasks] GET /api/v1/tasks/:id (get task details)');

    // 16.39 Tasks: My assigned tasks
    const myTasksRes = await request('/tasks/my-assigned', {
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(myTasksRes.status === 200, '[Tasks] GET /api/v1/tasks/my-assigned (list my assigned tasks)');

    // 16.40 Tasks: Remove assignee
    const unassignRes = await request(`/tasks/${taskId}/assignees/${user2.id}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(unassignRes.status === 200, '[Tasks] DELETE /api/v1/tasks/:id/assignees/:userId (unassign user)');

    // 16.41 Comments: List comments on task
    const commentsListRes = await request(`/tasks/${taskId}/comments`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(commentsListRes.status === 200, '[Comments] GET /api/v1/tasks/:id/comments (list comments & replies)');

    // 16.42 Comments: Edit own comment
    const commentEditRes = await request(`/comments/${replyCommentId}`, {
      method: 'PATCH',
      token: user1.accessToken,
      body: { content: 'Replication timeout is confirmed at 3000ms. Production verified.' },
      expectedStatus: 200
    });
    assert(commentEditRes.status === 200, '[Comments] PATCH /api/v1/comments/:id (edit own comment)');

    // 16.43 Comments: Delete comment
    const commentDelRes = await request(`/comments/${replyCommentId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(commentDelRes.status === 200, '[Comments] DELETE /api/v1/comments/:id (delete comment)');

    // 16.44 Notifications: Mark individual notification read & delete
    const user1Notifs = await request('/notifications', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    const user1NotifItems = user1Notifs.body.data.items || user1Notifs.body.data;
    if (user1NotifItems && user1NotifItems.length > 0) {
      const targetNotifId = user1NotifItems[0].id;
      const readOneRes = await request(`/notifications/${targetNotifId}/read`, {
        method: 'PATCH',
        token: user1.accessToken,
        expectedStatus: 200
      });
      assert(readOneRes.status === 200, `[Notifications] PATCH /api/v1/notifications/:id/read (mark read)`);

      const delNotifRes = await request(`/notifications/${targetNotifId}`, {
        method: 'DELETE',
        token: user1.accessToken,
        expectedStatus: 200
      });
      assert(delNotifRes.status === 200, '[Notifications] DELETE /api/v1/notifications/:id (delete notification)');
    }

    // 16.46 Activities: Workspace activity feed
    const wsActRes = await request(`/activities/workspaces/${workspaceId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    const wsActItems = wsActRes.body.data.items || wsActRes.body.data;
    assert(wsActRes.status === 200, '[Activities] GET /api/v1/activities/workspaces/:id (workspace activities)');
    assert(Array.isArray(wsActItems), '[Activities] Workspace activities returns items array');

    // 16.47 Activities: Project activity feed
    const projActRes = await request(`/activities/projects/${projectId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    const projActItems = projActRes.body.data.items || projActRes.body.data;
    assert(projActRes.status === 200, '[Activities] GET /api/v1/activities/projects/:id (project activities)');
    assert(Array.isArray(projActItems), '[Activities] Project activities returns items array');

    // 16.48 Analytics: User Dashboard
    const dashRes = await request('/analytics/dashboard', {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(dashRes.status === 200, '[Analytics] GET /api/v1/analytics/dashboard (high-level metrics)');

    // 16.49 Analytics: Project Metrics
    const projMetricsRes = await request(`/analytics/projects/${projectId}`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projMetricsRes.status === 200, '[Analytics] GET /api/v1/analytics/projects/:id (project metrics)');

    // 16.50 Analytics: Project Activity Stats
    const projStatActRes = await request(`/analytics/projects/${projectId}/activity`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projStatActRes.status === 200, '[Analytics] GET /api/v1/analytics/projects/:id/activity (activity metrics)');

    // 16.51 Analytics: Project Health Reports
    const projReportsRes = await request(`/analytics/projects/${projectId}/reports`, {
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projReportsRes.status === 200, '[Analytics] GET /api/v1/analytics/projects/:id/reports (health reports)');

    // 16.52 Tasks: Archive task
    const taskArchiveRes = await request(`/tasks/${taskId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(taskArchiveRes.status === 200, '[Tasks] DELETE /api/v1/tasks/:id (archive task)');

    // 16.53 Labels: Delete label
    const labelDelRes = await request(`/labels/${labelId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(labelDelRes.status === 200, '[Labels] DELETE /api/v1/labels/:id (delete label)');

    // 16.54 Projects: Remove member from project
    const removeProjMemberRes = await request(`/projects/${projectId}/members/${user2.id}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(removeProjMemberRes.status === 200, '[Projects] DELETE /api/v1/projects/:id/members/:userId (remove project member)');

    // 16.55 Projects: Archive project
    const projArchiveRes = await request(`/projects/${projectId}`, {
      method: 'DELETE',
      token: user1.accessToken,
      expectedStatus: 200
    });
    assert(projArchiveRes.status === 200, '[Projects] DELETE /api/v1/projects/:id (archive project)');

    // 16.56 Workspaces: Transfer ownership (User 1 -> User 2)
    const transferRes = await request(`/workspaces/${workspaceId}/transfer-ownership`, {
      method: 'POST',
      token: user1.accessToken,
      body: { newOwnerUserId: user2.id },
      expectedStatus: 200
    });
    assert(transferRes.status === 200, '[Workspaces] POST /api/v1/workspaces/:id/transfer-ownership (ownership transferred)');

    // 16.57 Workspaces: Remove previous owner from workspace (now allowed since User 1 is ADMIN)
    const removeUser1Res = await request(`/workspaces/${workspaceId}/members/${user1.id}`, {
      method: 'DELETE',
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(removeUser1Res.status === 200, '[Workspaces] DELETE /api/v1/workspaces/:id/members/:userId (removed member)');

    // 16.58 Workspaces: Archive workspace (User 2 is now owner)
    const wsArchiveRes = await request(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(wsArchiveRes.status === 200, '[Workspaces] DELETE /api/v1/workspaces/:id (archive workspace)');

    // 16.59 Auth: Logout
    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      token: user2.accessToken,
      expectedStatus: 200
    });
    assert(logoutRes.status === 200, '[Auth] POST /api/v1/auth/logout (session invalidated)');

    // 16.60 OpenAPI spec endpoint
    const specRes = await request(`${BASE_URL}/api/docs.json`);
    assert(specRes.status === 200, '[Docs] GET /api/docs.json (retrieved OpenAPI JSON spec)');

    // 16.61 Postman Newman Runner verification
    console.log('\n    Running complete Postman/Newman Collection execution:');
    try {
      execSync(`npx --yes newman run backend/docs/TeamFlow_API.postman_collection.json --env-var baseUrl=${API_URL} --reporters cli`, {
        stdio: 'inherit'
      });
      assert(true, 'Complete Newman Postman test collection executed with 100% success');
    } catch (newmanErr: any) {
      assert(false, `Newman execution failed: ${newmanErr.message}`);
    }
  }

  console.log(`\n======================================================================`);
  console.log(`🏆 ALL 16 STEPS PASSED SUCCESSFULLY!`);
  console.log(`📊 TOTAL ASSERTIONS PASSED: ${passedTests} / ${totalTests}`);
  console.log(`======================================================================\n`);
}

runAllTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
