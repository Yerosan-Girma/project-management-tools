import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Moon,
  Sun,
  Layers,
  Kanban,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/auth-store';
import { useWorkspaceStore } from '../../stores/workspace-store';
import { useUIStore } from '../../stores/ui-store';
import { workspaceService } from '../../features/workspaces/services/workspace.service';
import { projectService } from '../../features/projects/services/project.service';
import { notificationService } from '../../features/notifications/services/notification.service';
import { socketService } from '../../services/socket';
import { Project } from '../../types/project.types';
import { Avatar } from '../ui/Avatar';
import { CreateProjectModal } from '../../features/projects/components/CreateProjectModal';
import { CreateWorkspaceModal } from '../../features/workspaces/components/CreateWorkspaceModal';

export const AppLayout: React.FC = () => {
  const { user, accessToken, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  const { theme, toggleTheme } = useUIStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarProjects, setSidebarProjects] = useState<Project[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Socket.IO with Bearer token
  useEffect(() => {
    if (accessToken) {
      socketService.init(accessToken);
    }
  }, [accessToken]);

  // Join active workspace room via socket
  useEffect(() => {
    if (currentWorkspace?.id) {
      socketService.joinWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Load user workspaces and unread notifications
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [wsList, unread] = await Promise.all([
          workspaceService.getWorkspaces(),
          notificationService.getUnreadCount().catch(() => 0),
        ]);
        if (isMounted) {
          setWorkspaces(wsList);
          if (!currentWorkspace && wsList.length > 0) {
            setCurrentWorkspace(wsList[0]);
          }
          setUnreadCount(unread);
        }
      } catch {
        // Handled silently
      }
    };
    loadInitialData();

    // Listen for live notifications
    const handleNewNotification = (data: { title?: string; message?: string }) => {
      setUnreadCount((prev) => prev + 1);
      toast.info(data.title || 'New Notification', {
        description: data.message,
      });
    };

    socketService.on('notification:new', handleNewNotification);

    return () => {
      isMounted = false;
      socketService.off('notification:new', handleNewNotification);
    };
  }, [setWorkspaces]);

  // Fetch quick projects for sidebar when currentWorkspace changes
  useEffect(() => {
    let isMounted = true;
    if (currentWorkspace?.id) {
      projectService
        .getWorkspaceProjects(currentWorkspace.id)
        .then((data) => {
          if (isMounted) setSidebarProjects(data.slice(0, 6));
        })
        .catch(() => {
          if (isMounted) setSidebarProjects([]);
        });
    } else {
      setSidebarProjects([]);
    }
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace?.id]);

  const handleLogout = async () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  const mainNavItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Team', path: '/team', icon: Users },
  ];

  const personalNavItems = [
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* Mobile Top Navigation */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo/teamflow.svg" alt="TeamFlow" className="w-6 h-6" />
            <span className="font-bold text-sm tracking-tight">TeamFlow</span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to="/notifications"
            className="p-1.5 relative text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/settings?tab=profile">
            <Avatar src={user?.avatarUrl} name={user?.name} size="xs" />
          </Link>
        </div>
      </header>

      {/* Sidebar Backdrop on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Persistent Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 md:z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <img src="/logo/teamflow.svg" alt="TeamFlow" className="w-7 h-7" />
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Team<span className="text-primary-600">Flow</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                title="Toggle appearance theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* WORKSPACE SELECTOR */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 relative shrink-0">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {sidebarProjects.length} project{sidebarProjects.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {workspaceMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setWorkspaceMenuOpen(false)} />
                <div className="absolute left-3 right-3 top-full mt-1 z-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1">
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setCurrentWorkspace(ws);
                          setWorkspaceMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                          currentWorkspace?.id === ws.id
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="truncate flex-1">{ws.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        setIsCreateWorkspaceOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Workspace</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SCROLLABLE NAVIGATION SECTIONS */}
          <div className="flex-1 px-3 py-3 space-y-6 overflow-y-auto">
            {/* 1. MAIN */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Main
              </span>
              <nav className="mt-1 space-y-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/dashboard'
                      ? location.pathname === '/dashboard' || location.pathname === '/app'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* 2. WORKSPACE PROJECTS */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Projects
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(true)}
                  title="Create new project"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-0.5">
                {sidebarProjects.length === 0 ? (
                  <p className="px-3 py-1.5 text-[11px] text-slate-400 italic">No projects yet</p>
                ) : (
                  sidebarProjects.map((p) => {
                    const isProjActive = location.pathname.includes(`/projects/${p.id}`);
                    return (
                      <NavLink
                        key={p.id}
                        to={`/projects/${p.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                          isProjActive
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            {p.key}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </div>
                        <Kanban className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0" />
                      </NavLink>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. PERSONAL */}
            <div>
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Personal
              </span>
              <nav className="mt-1 space-y-0.5">
                {personalNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="rounded-full bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.2 leading-tight">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* USER PROFILE FOOTER */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 relative shrink-0">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={user?.avatarUrl} name={user?.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Account'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Profile Popover Menu */}
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute left-3 right-3 bottom-full mb-1.5 z-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1">
                  <Link
                    to="/settings?tab=profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Global Modals for Quick Creation from Sidebar */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={() => {
          if (currentWorkspace?.id) {
            projectService.getWorkspaceProjects(currentWorkspace.id).then(setSidebarProjects);
          }
        }}
      />

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
        onCreated={() => {
          workspaceService.getWorkspaces().then(setWorkspaces);
        }}
      />
    </div>
  );
};

export default AppLayout;
