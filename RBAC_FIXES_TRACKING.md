# TeamFlow - RBAC Frontend Fixes Tracking Document

## Status: NOT IMPLEMENTED - FOR REVIEW ONLY

This document tracks all required Role-Based Access Control (RBAC) fixes for the frontend. These changes are NOT yet implemented.

---

## Overview

**Problem**: Frontend shows identical UI to all users regardless of their role (Owner, Admin, Member, Guest, Manager, Viewer).

**Impact**: Poor user experience - users see buttons and controls they cannot use, leading to confusion when backend returns 403 errors.

**Security Status**: Backend is secure (proper middleware), but frontend UX is poor.

---

## Fix Priority

### HIGH Priority (Must Fix)
1. ProjectDetailPage - No role checks at all
2. WorkspaceDetailPage - Invite button shown to all users
3. Dashboard - Project role differentiation missing

### MEDIUM Priority (Should Fix)
4. Task creation/editing visibility
5. Board configuration visibility
6. Settings tab access control

---

## Detailed Fixes Required

### Fix #1: ProjectDetailPage - Add Project Role Detection

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Line to Add**: After line 62 (after useState declarations)

**Code to Add**:
```typescript
// Determine current user's project role
const currentUserProjectRole = useMemo(() => {
  return members.find(m => m.userId === user?.id)?.role;
}, [members, user?.id]);

const isProjectManager = currentUserProjectRole === 'MANAGER';
const isProjectMember = currentUserProjectRole === 'MEMBER';
const isProjectViewer = currentUserProjectRole === 'VIEWER';
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #2: ProjectDetailPage - Hide "Add Member" Button

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Lines to Replace**: 660-666

**Current Code**:
```typescript
<Button
  size="sm"
  onClick={() => setIsAddMemberOpen(true)}
  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
>
  Add Project Member
</Button>
```

**Fixed Code**:
```typescript
{isProjectManager && (
  <Button
    size="sm"
    onClick={() => setIsAddMemberOpen(true)}
    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
  >
    Add Project Member
  </Button>
)}
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #3: ProjectDetailPage - Hide Role Change Dropdown

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Lines to Replace**: 681-690

**Current Code**:
```typescript
<select
  value={member.role}
  onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value as ProjectRole)}
  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500"
>
  <option value="MANAGER">Manager</option>
  <option value="MEMBER">Member</option>
  <option value="VIEWER">Viewer</option>
</select>
```

**Fixed Code**:
```typescript
{isProjectManager && (
  <select
    value={member.role}
    onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value as ProjectRole)}
    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500"
  >
    <option value="MANAGER">Manager</option>
    <option value="MEMBER">Member</option>
    <option value="VIEWER">Viewer</option>
  </select>
)}
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #4: ProjectDetailPage - Hide Remove Member Button

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Lines to Replace**: 692-699

**Current Code**:
```typescript
<button
  type="button"
  onClick={() => handleRemoveMember(member.userId)}
  className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
  title="Remove from project"
>
  <Trash2 className="w-4 h-4" />
</button>
```

**Fixed Code**:
```typescript
{isProjectManager && (
  <button
    type="button"
    onClick={() => handleRemoveMember(member.userId)}
    className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
    title="Remove from project"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #5: WorkspaceDetailPage - Add Admin Role Detection

**File**: `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`

**Line to Add**: After line 90 (after `const isOwner = workspace.ownerId === user?.id;`)

**Code to Add**:
```typescript
const isOwner = workspace.ownerId === user?.id;
const currentUserMember = members.find(m => m.userId === user?.id);
const isAdmin = currentUserMember?.role === 'ADMIN';
const isOwnerOrAdmin = isOwner || isAdmin;
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #6: WorkspaceDetailPage - Hide Invite Button from Non-Admins

**File**: `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`

**Lines to Replace**: 193-195

**Current Code**:
```typescript
<Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
  Invite Member
</Button>
```

**Fixed Code**:
```typescript
{isOwnerOrAdmin && (
  <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
    Invite Member
  </Button>
)}
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #7: WorkspaceDetailPage - Show Settings Tab to Admins

**File**: `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`

**Lines to Replace**: 226-237 (Settings tab button)

**Current Code**:
```typescript
<button
  type="button"
  onClick={() => setActiveTab('settings')}
  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
    activeTab === 'settings'
      ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
  }`}
>
  <Settings className="w-4 h-4" />
  Settings
</button>
```

**Fixed Code**:
```typescript
{isOwnerOrAdmin && (
  <button
    type="button"
    onClick={() => setActiveTab('settings')}
    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
      activeTab === 'settings'
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`}
  >
    <Settings className="w-4 h-4" />
    Settings
  </button>
)}
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #8: Dashboard - Add Project Role Detection

**File**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**Current State**: Already has workspace role detection (`isOwnerOrAdmin`)

**Missing**: Project role detection for project-specific actions

**Code to Add**: After line 76 (after useState declarations)

```typescript
// Get current user's project roles for each project
const userProjectRoles = useMemo(() => {
  if (!user?.id || !workspaceProjects) return {};
  const roles: Record<string, ProjectRole> = {};
  workspaceProjects.forEach(project => {
    const member = project.members?.find(m => m.userId === user.id);
    if (member) {
      roles[project.id] = member.role;
    }
  });
  return roles;
}, [user?.id, workspaceProjects]);
```

**Status**: ❌ NOT IMPLEMENTED

---

### Fix #9: Dashboard - Hide Project Management Actions

**File**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**Context**: In project cards, hide management actions from non-Managers

**Code to Add**: Wrap project management buttons with role check

**Status**: ❌ NOT IMPLEMENTED (Needs investigation of project card implementation)

---

### Fix #10: Task Creation/Edit Visibility

**File**: To be determined (likely in KanbanBoard or TaskDetailModal)

**Requirement**:
- Viewers should NOT see "Create Task" buttons
- Viewers should NOT see "Edit Task" options
- Members and Managers should see task creation/editing

**Status**: ❌ NOT IMPLEMENTED (Needs investigation)

---

### Fix #11: Board Configuration Visibility

**File**: To be determined (likely in Board components)

**Requirement**:
- Only Project Managers should see board configuration options
- Members and Viewers should not see "Add Column", "Edit Column", "Delete Column"

**Status**: ❌ NOT IMPLEMENTED (Needs investigation)

---

## Implementation Order

### Phase 1: Critical Fixes (Project Page)
1. Fix #1: Add project role detection
2. Fix #2: Hide "Add Member" button
3. Fix #3: Hide role change dropdown
4. Fix #4: Hide remove member button

### Phase 2: Workspace Fixes
5. Fix #5: Add admin role detection
6. Fix #6: Hide invite button
7. Fix #7: Show settings tab to admins

### Phase 3: Dashboard Enhancements
8. Fix #8: Add project role detection
9. Fix #9: Hide project management actions

### Phase 4: Task and Board Fixes
10. Fix #10: Task creation/edit visibility
11. Fix #11: Board configuration visibility

---

## Testing Checklist

After implementing fixes, test with each user role:

### Test as Alice (Owner + Manager)
- [ ] Can see "Invite Member" in workspace
- [ ] Can see "Settings" tab in workspace
- [ ] Can see "Add Project Member" in project
- [ ] Can change member roles in project
- [ ] Can remove members from project
- [ ] Can create tasks
- [ ] Can edit tasks
- [ ] Can configure boards

### Test as Bob (Admin + Member)
- [ ] Can see "Invite Member" in workspace ✅
- [ ] Can see "Settings" tab in workspace ✅
- [ ] Cannot see "Add Project Member" in project ❌
- [ ] Cannot change member roles in project ❌
- [ ] Cannot remove members from project ❌
- [ ] Can create tasks ✅
- [ ] Can edit tasks ✅
- [ ] Cannot configure boards ❌

### Test as Charlie (Member + Viewer)
- [ ] Cannot see "Invite Member" in workspace ❌
- [ ] Cannot see "Settings" tab in workspace ❌
- [ ] Cannot see "Add Project Member" in project ❌
- [ ] Cannot change member roles in project ❌
- [ ] Cannot remove members from project ❌
- [ ] Can create tasks (if Member role) ✅
- [ ] Can edit own tasks (if Member role) ✅
- [ ] Cannot create tasks (if Viewer role) ❌
- [ ] Cannot edit tasks (if Viewer role) ❌
- [ ] Cannot configure boards ❌

### Test as Admin (Platform Admin)
- [ ] Should see platform-level controls (if implemented)
- [ ] Should have access to all workspaces
- [ ] Should be able to manage all workspaces

---

## Files to Modify

1. `frontend/src/features/projects/pages/ProjectDetailPage.tsx`
2. `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`
3. `frontend/src/features/dashboard/pages/DashboardPage.tsx`
4. `frontend/src/features/boards/components/KanbanBoard.tsx` (if exists)
5. `frontend/src/features/tasks/components/CreateTaskModal.tsx` (if exists)
6. `frontend/src/features/tasks/components/TaskDetailModal.tsx` (if exists)

---

## Notes

- Backend already enforces permissions properly
- These are frontend UX improvements only
- No security risk if not implemented, just poor UX
- Testing should be done after each phase
- Consider adding visual role indicators (badges) for clarity

---

## Last Updated

Date: 2026-11-07
Status: Document created, fixes NOT implemented
Next Step: Awaiting approval to implement fixes
