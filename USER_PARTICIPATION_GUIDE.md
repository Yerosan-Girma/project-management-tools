# TeamFlow - User Participation Guide

## How Many Users Can Use TeamFlow?

**TeamFlow is designed for UNLIMITED users** - there is no hardcoded limit on the number of users who can participate in the platform. The system is built as a multi-tenant SaaS platform that can scale to support thousands of users across multiple workspaces.

---

## User Participation Model

### 1. Platform-Level Participation

At the platform level, ANY number of users can register and create accounts:

```
Platform User Limit: UNLIMITED
├── User can register via /register endpoint
├── Each user gets a unique platform role (USER or PLATFORM_ADMIN)
├── Users can belong to multiple workspaces simultaneously
└── No restrictions on total user count
```

**Current Demo Users (4 accounts):**
1. `admin@teamflow.local` - Platform Admin
2. `alice@teamflow.local` - Standard User
3. `bob@teamflow.local` - Standard User
4. `charlie@teamflow.local` - Standard User

**To add more users:**
- Anyone can register at the registration page
- Or admin can invite users via email (invitation system)
- No maximum limit on platform users

---

### 2. Workspace-Level Participation

Each workspace is an isolated team environment with its own set of members:

```
Workspace Member Limit: UNLIMITED per workspace
├── Workspace Owner can invite unlimited members
├── Members can have different roles (OWNER, ADMIN, MEMBER, GUEST)
├── Each workspace is completely isolated from others
└── Users can belong to multiple workspaces
```

**Current Workspace (Acme Corp Engineering):**
- **Total Members**: 3 users
  - Alice Johnson (OWNER)
  - Bob Smith (ADMIN)
  - Charlie Davis (MEMBER)

**Workspace Role Distribution:**
- **1 Owner** - Can be only one per workspace
- **Multiple Admins** - Unlimited admin accounts
- **Multiple Members** - Unlimited regular members
- **Multiple Guests** - Unlimited guest viewers

**Example Scenarios:**

**Small Team (5-10 people):**
```
Workspace: Startup Team
├── 1 Owner (CEO/Founder)
├── 2 Admins (CTO, Product Manager)
├── 5 Members (Developers, Designers)
└── 2 Guests (Clients, Contractors)
Total: 10 users
```

**Medium Team (20-50 people):**
```
Workspace: Engineering Department
├── 1 Owner (Engineering Manager)
├── 5 Admins (Team Leads)
├── 40 Members (Engineers, QA, DevOps)
└── 4 Guests (Stakeholders)
Total: 50 users
```

**Large Team (100+ people):**
```
Workspace: Enterprise Division
├── 1 Owner (Division Head)
├── 10 Admins (Department Managers)
├── 150 Members (Full-time staff)
└── 20 Guests (Partners, Vendors)
Total: 181 users
```

---

### 3. Project-Level Participation

Within each workspace, projects can have their own member sets:

```
Project Member Limit: UNLIMITED per project
├── Project Manager can add unlimited project members
├── Members can have roles (MANAGER, MEMBER, VIEWER)
├── Project members must also be workspace members
└── Users can be members of multiple projects within a workspace
```

**Current Project (TeamFlow Core Engine):**
- **Total Members**: 3 users
  - Alice Johnson (MANAGER)
  - Bob Smith (MEMBER)
  - Charlie Davis (VIEWER)

**Project Role Distribution:**
- **Multiple Managers** - Unlimited project managers
- **Multiple Members** - Unlimited contributors
- **Multiple Viewers** - Unlimited read-only access

**Example: Large Project with 50 Members**
```
Project: Mobile App Development
├── 5 Managers (Tech Lead, Product Lead, Design Lead, etc.)
├── 35 Members (Developers, Designers, QA)
├── 10 Viewers (Stakeholders, Product Owners)
Total: 50 project members
```

---

## User Access by Role Matrix

### Platform Admin Participation

**Can Access:**
- ✅ All workspaces (view and manage)
- ✅ All projects across all workspaces
- ✅ All users and their activities
- ✅ Platform-level configuration
- ✅ Override workspace restrictions

**Cannot:**
- ❌ Be removed from workspaces they own
- ❌ Have automatic workspace membership (must be invited)

**Use Case:** System administrators who need oversight across all teams.

---

### Workspace Owner Participation

**Can Access:**
- ✅ Their owned workspace(s) fully
- ✅ All projects within owned workspace
- ✅ All tasks and data in owned workspace
- ✅ Manage workspace members
- ✅ Create/delete projects
- ✅ Transfer ownership
- ✅ Archive workspace

**Cannot:**
- ❌ Access other workspaces (unless invited)
- ❌ Modify platform settings (unless also Platform Admin)

**Use Case:** Team leads, startup founders, department heads who need full control over their team's workspace.

---

### Workspace Admin Participation

**Can Access:**
- ✅ Assigned workspace fully (except ownership transfer)
- ✅ All projects within workspace
- ✅ All tasks and data in workspace
- ✅ Invite/remove members
- ✅ Change member roles (except Owner)
- ✅ Create projects
- ✅ Manage workspace labels

**Cannot:**
- ❌ Archive the workspace
- ❌ Transfer ownership
- ❌ Remove the Owner
- ❌ Access other workspaces (unless invited)

**Use Case:** Team managers, project coordinators who need operational control but not ownership rights.

---

### Workspace Member Participation

**Can Access:**
- ✅ Assigned workspace (view access)
- ✅ Projects they're a member of
- ✅ Tasks in their projects
- ✅ Create/edit tasks in their projects
- ✅ Comment on tasks
- ✅ View workspace activity

**Cannot:**
- ❌ Manage workspace settings
- ❌ Invite members
- ❌ Create projects
- ❌ Change member roles
- ❌ Archive workspace

**Use Case:** Regular team members, developers, designers who contribute to projects.

---

### Workspace Guest Participation

**Can Access:**
- ✅ Assigned workspace (limited view)
- ✅ Tasks they're specifically invited to
- ✅ Comment on invited tasks
- ✅ View project boards (read-only)

**Cannot:**
- ❌ Create or edit tasks
- ❌ Manage projects
- ❌ Invite members
- ❌ Access full workspace data
- ❌ Modify any data

**Use Case:** Clients, contractors, stakeholders who need visibility but not editing rights.

---

## Real-World User Participation Examples

### Example 1: Small Startup (15 Users Total)

**Platform:** 15 registered users

**Workspace 1: Product Team (8 members)**
- 1 Owner (CEO)
- 2 Admins (CTO, Product Manager)
- 4 Members (2 Developers, 1 Designer, 1 QA)
- 1 Guest (Advisor)

**Workspace 2: Marketing Team (5 members)**
- 1 Owner (Marketing Director)
- 1 Admin (Brand Manager)
- 3 Members (Content writers, Social media)
- 0 Guests

**Workspace 3: Operations (2 members)**
- 1 Owner (Operations Manager)
- 1 Member (HR)

**Overlap:** Some users belong to multiple workspaces (e.g., CEO is in all 3)

---

### Example 2: Software Company (200 Users Total)

**Platform:** 200 registered users

**Workspace 1: Engineering (80 members)**
- 1 Owner (VP Engineering)
- 10 Admins (Engineering Managers)
- 65 Members (Developers, QA, DevOps)
- 4 Guests (External consultants)

**Projects in Engineering Workspace:**
- Project A: Core Platform (30 members)
- Project B: Mobile App (25 members)
- Project C: Internal Tools (15 members)
- *Note: Engineers belong to multiple projects*

**Workspace 2: Product (40 members)**
- 1 Owner (VP Product)
- 5 Admins (Product Managers)
- 30 Members (Product designers, researchers)
- 4 Guests (User research participants)

**Workspace 3: Sales (50 members)**
- 1 Owner (VP Sales)
- 8 Admins (Regional Managers)
- 40 Members (Sales reps, SDRs)
- 1 Guest (Training consultant)

**Workspace 4: Marketing (30 members)**
- 1 Owner (VP Marketing)
- 4 Admins (Marketing Managers)
- 25 Members (Content, SEO, Social)
- 0 Guests

**Total Users:** 200 unique platform users
**Total Workspace Memberships:** ~250 (some users in multiple workspaces)

---

### Example 3: Agency Model (100+ Clients)

**Platform:** Unlimited client users

**Internal Workspace: Agency Team (50 members)**
- 1 Owner (Agency Owner)
- 10 Admins (Account Managers)
- 35 Members (Designers, Developers, Strategists)
- 4 Guests (Freelancers)

**Client Workspaces (One per client):**
- Client A Workspace (5 members - 1 from agency, 4 from client)
- Client B Workspace (8 members - 2 from agency, 6 from client)
- Client C Workspace (3 members - 1 from agency, 2 from client)
- ... and so on for 100+ clients

**Total:** 50 agency staff + 500+ client users = 550+ platform users

---

## User Registration & Onboarding Flow

### Self-Registration (Unlimited)
```
1. User visits /register
2. Fills in name, email, password
3. Platform creates account with USER role
4. User can:
   - Create their own workspace (becomes Owner)
   - Accept invitations to existing workspaces
   - Browse public projects (if any)
```

### Invitation-Based (Controlled)
```
1. Workspace Owner/Admin sends invitation
2. Email sent to invitee with unique token
3. Invitee clicks link → /invitations/:token
4. Account created or logged in
5. Automatically added to workspace with specified role
```

### Guest Access (Limited)
```
1. Workspace Owner/Admin invites as GUEST
2. Guest can only view specific tasks/projects
3. No ability to create workspaces or projects
4. Can be promoted to MEMBER later
```

---

## Scalability Considerations

### Database Capacity
- **Users Table**: Can handle millions of records (PostgreSQL)
- **Workspaces Table**: Can handle millions of workspaces
- **Members Tables**: Junction tables optimized for high-volume queries
- **No hardcoded limits** in the schema

### Performance Optimization
- **Indexing**: Email, workspace ID, project ID all indexed
- **Pagination**: All list endpoints support pagination
- **Caching**: Redis integration for session data (optional)
- **Socket.IO**: Real-time updates scale with Redis adapter

### Multi-Tenant Isolation
- Each workspace is isolated at data level
- Users can only access data they're authorized for
- No data leakage between workspaces
- Works for single-tenant (one workspace) or multi-tenant (many workspaces)

---

## Summary: User Participation by Role

| Role | Max Users | Can Create Workspaces | Can Invite Users | Can Access All Data |
|------|-----------|---------------------|------------------|-------------------|
| **Platform Admin** | Unlimited | Yes | Yes | Yes (all workspaces) |
| **Workspace Owner** | Unlimited | Yes | Yes | Yes (owned workspace only) |
| **Workspace Admin** | Unlimited | No | Yes | Yes (assigned workspace) |
| **Workspace Member** | Unlimited | No | No | No (only their projects) |
| **Workspace Guest** | Unlimited | No | No | No (only invited tasks) |

## Bottom Line

**TeamFlow can support UNLIMITED users** at all levels:
- ✅ Unlimited platform users (registration)
- ✅ Unlimited workspace members per workspace
- ✅ Unlimited project members per project
- ✅ Users can belong to multiple workspaces/projects
- ✅ Suitable for teams of 5 to 5000+ users

The current seed data has only 4 demo users, but this is just for testing. In production, you can have hundreds or thousands of users participating across multiple workspaces and projects.
