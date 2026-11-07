# TeamFlow - Frontend RBAC Implementation Issues

## Critical Finding: Frontend Does NOT Reflect Role-Based Permissions

You are absolutely correct. The frontend UI shows the **same interface and actions to all users** regardless of their role. While the backend enforces permissions, the frontend does not hide/show controls based on user roles.

---

## Identified Issues

### Issue 1: Dashboard - Limited Role Differentiation

**Location**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**What Works**:
- ✅ Line 440: `{isOwnerOrAdmin && (` - Shows "New Project" and "Invite" buttons only to Owners/Admins
- ✅ Line 102-111: Displays user role badge (Platform Admin, Workspace Owner, etc.)

**What's Missing**:
- ❌ No visual differentiation between MANAGER, MEMBER, and VIEWER in project views
- ❌ All users see the same dashboard layout regardless of project role
- ❌ No "Add Member" button visibility control based on project role
- ❌ No "Settings" tab visibility control based on role

**Impact**: Users with different project roles (Manager, Member, Viewer) see identical dashboards.

---

### Issue 2: Workspace Detail Page - Incomplete Role Controls

**Location**: `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`

**What Works**:
- ✅ Line 90: `const isOwner = workspace.ownerId === user?.id;` - Detects owner
- ✅ Line 182-187: Shows "Owner" badge only for actual owner
- ✅ Line 271-281: Role change dropdown shown only to owner (line 271 check)
- ✅ Line 283-293: Transfer ownership button shown only to owner
- ✅ Line 295-299: Remove member button shown only to owner

**What's Missing**:
- ❌ No check for Admin role - Admins should also see some management controls
- ❌ Line 193: "Invite Member" button shown to ALL users (no role check)
- ❌ No restriction on Settings tab access (Admins should see settings)
- ❌ Members and Guests see invite button they shouldn't have access to

**Current Code (Line 193)**:
```typescript
<Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
  Invite Member
</Button>
```

**Should Be**:
```typescript
{(isOwner || member?.role === 'ADMIN') && (
  <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
    Invite Member
  </Button>
)}
```

**Impact**: Workspace Members and Guests can see "Invite Member" button even though they shouldn't be able to invite people.

---

### Issue 3: Project Detail Page - NO Role-Based UI Controls

**Location**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Critical Issue**: This page has **ZERO role-based permission checks** in the frontend.

**Problems Found**:

1. **Line 660-666**: "Add Project Member" button shown to ALL users
```typescript
<Button
  size="sm"
  onClick={() => setIsAddMemberOpen(true)}
  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
>
  Add Project Member
</Button>
```
**Should Only Show**: Project MANAGER

2. **Lines 682-690**: Role change dropdown shown to ALL users
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
**Should Only Show**: Project MANAGER

3. **Lines 692-699**: Remove member button shown to ALL users
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
**Should Only Show**: Project MANAGER

4. **No project role detection**: The page doesn't even check what the current user's project role is

**Impact**:
- Viewers can see "Add Member" button (they shouldn't)
- Members can change other members' roles (they shouldn't)
- Viewers can remove members (they shouldn't)
- All users see the same project management interface

---

### Issue 4: Missing Project Role Detection

**Location**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Problem**: The page doesn't determine the current user's project role at all.

**Missing Code**:
```typescript
// This should exist but doesn't:
const currentUserProjectRole = useMemo(() => {
  return members.find(m => m.userId === user?.id)?.role;
}, [members, user?.id]);

const isProjectManager = currentUserProjectRole === 'MANAGER';
const isProjectMember = currentUserProjectRole === 'MEMBER';
const isProjectViewer = currentUserProjectRole === 'VIEWER';
```

**Impact**: No way to conditionally show/hide UI elements based on project role.

---

### Issue 5: Board/Task Views - No Role Checks

**Likely Issues** (not yet verified):
- Task creation buttons may be visible to Viewers
- Task editing may be available to Viewers
- Board configuration may be visible to non-Managers

---

## Why This Happens

The backend implements proper RBAC with middleware like:
- `requireWorkspaceRole(WorkspaceRole.ADMIN)`
- `requireProjectRole(ProjectRole.MANAGER)`

However, the frontend relies on **backend enforcement only** and doesn't:
1. Check user roles before showing controls
2. Hide actions users can't perform
3. Provide role-specific UI feedback
4. Differentiate the interface based on permissions

**Current Architecture**:
```
Frontend: Shows everything → Backend: Rejects unauthorized requests → Frontend: Shows error
```

**Should Be**:
```
Frontend: Checks role → Shows only permitted actions → Backend: Validates request
```

---

## Security Implications

### Is This a Security Risk?

**Backend**: ✅ **SECURE** - All actions are protected by middleware
- Users cannot actually perform actions they're not authorized for
- API returns 403 Forbidden for unauthorized requests

**Frontend**: ⚠️ **Poor UX, Not a Security Risk** - Users see buttons they can't use
- This is a UI/UX issue, not a security vulnerability
- Backend will reject unauthorized actions
- However, it creates confusion and poor user experience

**Example Scenario**:
1. Charlie (Viewer) logs in
2. Sees "Add Project Member" button
3. Clicks it
4. Modal opens
5. Submits form
6. Backend returns 403 Forbidden
7. User sees error message

**Better Experience**:
1. Charlie (Viewer) logs in
2. Does NOT see "Add Project Member" button
3. No confusion, no errors

---

## Required Fixes

### Fix 1: Add Project Role Detection to ProjectDetailPage

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Add after line 62**:
```typescript
// Determine current user's project role
const currentUserProjectRole = useMemo(() => {
  return members.find(m => m.userId === user?.id)?.role;
}, [members, user?.id]);

const isProjectManager = currentUserProjectRole === 'MANAGER';
const isProjectMember = currentUserProjectRole === 'MEMBER';
const isProjectViewer = currentUserProjectRole === 'VIEWER';
```

### Fix 2: Hide "Add Member" Button from Non-Managers

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Replace lines 660-666**:
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

### Fix 3: Hide Role Change Dropdown from Non-Managers

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Replace lines 681-690**:
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

### Fix 4: Hide Remove Member Button from Non-Managers

**File**: `frontend/src/features/projects/pages/ProjectDetailPage.tsx`

**Replace lines 692-699**:
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

### Fix 5: Add Workspace Admin Check to WorkspaceDetailPage

**File**: `frontend/src/features/workspaces/pages/WorkspaceDetailPage.tsx`

**Add after line 90**:
```typescript
const isOwner = workspace.ownerId === user?.id;
const currentUserMember = members.find(m => m.userId === user?.id);
const isAdmin = currentUserMember?.role === 'ADMIN';
const isOwnerOrAdmin = isOwner || isAdmin;
```

**Replace line 193**:
```typescript
{isOwnerOrAdmin && (
  <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
    Invite Member
  </Button>
)}
```

### Fix 6: Add Project Role Detection to Dashboard

**File**: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

**Already has**:
- ✅ `isOwnerOrAdmin` check for workspace-level actions

**Needs**:
- Project role detection for project-specific actions
- Hide "Add Member" from non-Managers in project cards

---

## Summary of Required Changes

| Page | Issue | Fix Required |
|------|-------|-------------|
| Dashboard | Limited role differentiation | Add project role checks |
| WorkspaceDetail | Invite button shown to all | Add Admin role check |
| ProjectDetail | NO role checks | Add full role detection and UI hiding |
| Task Views | Unknown (needs verification) | Add role-based task action hiding |

---

## Conclusion

You are 100% correct. The frontend does **NOT** properly implement role-based UI. All users see the same interface regardless of their role. The backend is secure, but the frontend provides a poor user experience by showing controls that users can't actually use.

**Status**:
- ✅ Backend RBAC: Fully implemented and secure
- ❌ Frontend RBAC: Incomplete, shows same UI to all roles
- ⚠️ User Experience: Confusing, users see buttons they can't use

**Priority**: HIGH - This should be fixed to provide proper role-based user experience.
