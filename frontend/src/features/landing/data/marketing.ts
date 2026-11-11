export const marketingNav = [
  { label: 'How it works', to: '/how-it-works' },
] as const;

export const companyMenu = [
  { to: '/about', title: 'About', description: 'Why TeamFlow is built around workspaces and live boards.' },
  { to: '/how-it-works', title: 'How it works', description: 'Step-by-step tour of boards, workflows, and sprint delivery.' },
  { to: '/pricing', title: 'Pricing', description: 'Transparent plans for growing teams and organizations.' },
  { to: '/faq', title: 'FAQ', description: 'Frequently asked questions about workspaces, boards, and roles.' },
  { to: '/security', title: 'Security', description: 'JWT sessions, RBAC, and isolated tenant data.' },
  { to: '/contact', title: 'Contact', description: 'Talk with us about teams, plans, or access.' },
] as const;

export const productMenu = [
  {
    to: '/features#boards',
    title: 'Kanban boards',
    description: 'Columns, drag-and-drop, and live status for every deliverable.',
  },
  {
    to: '/features#projects',
    title: 'Projects',
    description: 'Workspace projects with keys, members, and board workflows.',
  },
  {
    to: '/features#tasks',
    title: 'Tasks',
    description: 'Priority, due dates, assignees, labels, and comments.',
  },
  {
    to: '/features#calendar',
    title: 'Calendar',
    description: 'See deadlines across projects without leaving the workspace.',
  },
  {
    to: '/features#team',
    title: 'Team & invitations',
    description: 'Invite members, assign roles, and keep workspaces isolated.',
  },
  {
    to: '/features#analytics',
    title: 'Analytics',
    description: 'Velocity, status, and priority views for the active sprint.',
  },
] as const;

export const solutionTypes = [
  {
    id: 'software',
    label: 'Software',
    title: 'Ship product in focused sprints',
    description:
      'Track engineering work on Kanban boards with issue keys, priorities, and live updates as code moves from backlog to done.',
    highlights: ['Issue keys & labels', 'Review columns', 'Realtime board sync'],
  },
  {
    id: 'product',
    label: 'Product',
    title: 'Keep roadmap and delivery aligned',
    description:
      'Give PMs a workspace to plan projects, watch velocity, and keep stakeholders on the same board as builders.',
    highlights: ['Project analytics', 'Due-date tracking', 'Workspace isolation'],
  },
  {
    id: 'operations',
    label: 'Operations',
    title: 'Coordinate people and deadlines',
    description:
      'Use team directories, calendar deadlines, and notifications so ops work stays visible across the company.',
    highlights: ['Team directory', 'Calendar view', 'Live notifications'],
  },
  {
    id: 'agencies',
    label: 'Agencies',
    title: 'Separate every client workspace',
    description:
      'Invite clients as viewers, keep client data in its own workspace, and run multiple projects without mixing boards.',
    highlights: ['Multi-workspace', 'Role-based access', 'Email invitations'],
  },
] as const;

export const appNavForSignedIn = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    description: 'High-level sprint progress, metrics, and team activity.',
  },
  {
    to: '/my-tasks',
    label: 'My tasks',
    title: 'My tasks',
    description: 'Personal task queue across all assigned projects.',
  },
  {
    to: '/projects',
    label: 'Projects',
    title: 'Projects',
    description: 'Workspace projects, board workflows, and task backlogs.',
  },
  {
    to: '/calendar',
    label: 'Calendar',
    title: 'Calendar',
    description: 'Cross-project milestone deadlines and schedule.',
  },
  {
    to: '/team',
    label: 'Team',
    title: 'Team & access',
    description: 'Manage members, role permissions, and invites.',
  },
  {
    to: '/workspaces',
    label: 'Workspaces',
    title: 'Workspaces',
    description: 'Switch or create isolated team and client workspaces.',
  },
] as const;

export const footerProductLinks = [
  { label: 'Kanban boards', to: '/features#boards' },
  { label: 'Projects', to: '/features#projects' },
  { label: 'Tasks', to: '/features#tasks' },
  { label: 'Calendar', to: '/features#calendar' },
  { label: 'Analytics', to: '/features#analytics' },
  { label: 'Pricing', to: '/pricing' },
] as const;

export const footerPlatformLinks = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'FAQ', to: '/faq' },
  { label: 'About', to: '/about' },
  { label: 'Security', to: '/security' },
  { label: 'Contact', to: '/contact' },
  { label: 'Create account', to: '/register' },
] as const;

export const faqs = [
  {
    question: 'How does real-time synchronization work in TeamFlow?',
    answer:
      'TeamFlow connects active members over WebSockets. When someone creates a task, moves a card, or posts a comment, every open workspace updates without a refresh.',
  },
  {
    question: 'What roles and permissions are supported?',
    answer:
      'Each workspace uses Owner, Admin, Member, and Viewer. Owners control settings and billing-level actions, Admins create projects and invite people, Members work on tasks, and Viewers stay read-only.',
  },
  {
    question: 'Can I customize Kanban columns?',
    answer:
      'Yes. Projects start with To Do, In Progress, Review, and Done. You can rename and reorder columns to match how your team actually ships.',
  },
  {
    question: 'Is workspace data isolated between teams?',
    answer:
      'Workspaces are strictly multi-tenant. People only see projects, tasks, and members for workspaces they own or were invited into.',
  },
  {
    question: 'Which project types is TeamFlow built for?',
    answer:
      'Software sprints, product roadmaps, operations calendars, and agency client workspaces. The same boards, tasks, and roles adapt to each of those shapes.',
  },
  {
    question: 'Do I need a credit card to start?',
    answer:
      'No. Create a free account, make a workspace, and invite your team. Paid team plans unlock extra seats and organization-level controls when you need them.',
  },
];
