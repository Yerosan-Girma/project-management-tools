# TeamFlow - Quick Role Reference

## Can Users Use TeamFlow? YES - Unlimited Users!

TeamFlow is designed for **UNLIMITED user participation**. There is no maximum limit on how many users can register, join workspaces, or participate in projects.

---

## Current Demo Setup (4 Users)

| Email | Name | Platform Role | Workspace Role | Project Role | What They Can Do |
|-------|------|---------------|----------------|--------------|------------------|
| admin@teamflow.local | Platform Admin | PLATFORM_ADMIN | None | None | Full system access, can manage all workspaces |
| alice@teamflow.local | Alice Johnson | USER | OWNER (Acme Corp) | MANAGER (TeamFlow Core) | Full control over workspace and project |
| bob@teamflow.local | Bob Smith | USER | ADMIN (Acme Corp) | MEMBER (TeamFlow Core) | Can manage workspace, contribute to projects |
| charlie@teamflow.local | Charlie Davis | USER | MEMBER (Acme Corp) | VIEWER (TeamFlow Core) | Can view and comment, limited editing |

---

## Adding More Users

### Method 1: Self-Registration (Unlimited)
Anyone can register at the registration page:
1. Go to `/register`
2. Enter name, email, password
3. Account created automatically
4. User can create their own workspace or accept invitations

### Method 2: Email Invitation (Unlimited)
Workspace owners/admins can invite users:
1. Go to workspace settings
2. Click "Invite Member"
3. Enter email address
4. Select role (OWNER, ADMIN, MEMBER, GUEST)
5. User receives email with invitation link

### Method 3: API Registration (Programmatic)
For bulk user creation:
```bash
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

---

## Role-Based Capabilities

### Platform Admin
- **Can manage**: ALL workspaces, ALL projects, ALL users
- **Best for**: System administrators, CTO, Platform engineers
- **Limit**: None - full platform access

### Workspace Owner
- **Can manage**: Their owned workspace(s), all projects within
- **Best for**: Team leads, Startup founders, Department heads
- **Limit**: Cannot access other workspaces (unless invited)

### Workspace Admin
- **Can manage**: Assigned workspace, projects within it
- **Best for**: Project managers, Team coordinators
- **Limit**: Cannot archive workspace or transfer ownership

### Workspace Member
- **Can manage**: Tasks in their projects, comments
- **Best for**: Developers, Designers, Regular team members
- **Limit**: Cannot manage workspace settings or invite members

### Workspace Guest
- **Can manage**: View-only access to invited tasks
- **Best for**: Clients, Contractors, Stakeholders
- **Limit**: Cannot create/edit tasks or manage projects

---

## Example Team Sizes

### Small Team (5-10 people)
```
1 Owner
2 Admins
5-7 Members
```

### Medium Team (20-50 people)
```
1 Owner
5 Admins
15-45 Members
```

### Large Team (100+ people)
```
1 Owner
10 Admins
90+ Members
```

### Enterprise (1000+ people)
```
Multiple workspaces:
- Engineering Workspace (500 people)
- Product Workspace (200 people)
- Marketing Workspace (150 people)
- Sales Workspace (150 people)
Each workspace has its own Owner, Admins, Members
```

---

## Summary

**Question: How many users can participate in TeamFlow?**

**Answer: UNLIMITED**

- ✅ Unlimited platform users can register
- ✅ Unlimited members per workspace
- ✅ Unlimited members per project
- ✅ Users can belong to multiple workspaces
- ✅ Suitable for teams of 5 to 5000+ users

**Current status**: 4 demo users for testing
**Production capability**: Hundreds or thousands of users

The platform is built as a scalable multi-tenant SaaS application with no hardcoded user limits.
