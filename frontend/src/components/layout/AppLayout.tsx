import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderGit2,
  CheckSquare,
  Calendar,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  Moon,
  Sun,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { useWorkspaceStore } from '../../stores/workspace-store';
import { useUIStore } from '../../stores/ui-store';
import { workspaceService } from '../../features/workspaces/services/workspace.service';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { workspaces, currentWorkspace, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  const { theme, toggleTheme } = useUIStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user workspaces on mount
  useEffect(() => {
    let isMounted = true;
    const loadWorkspaces = async () => {
      try {
        const list = await workspaceService.getWorkspaces();
        if (isMounted) {
          setWorkspaces(list);
        }
      } catch {
        // Handled silently
      }
    };
    loadWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [setWorkspaces]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Workspaces', path: '/workspaces', icon: Building2 },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Notifications', path: '/notifications', icon: Bell },
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/profile">
            <Avatar src={user?.avatarUrl} name={user?.name} size="xs" />
          </Link>
        </div>
      </header>

      {/* Sidebar Backdrop on Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 md:z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
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
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Workspace Switcher */}
          <div className="p-3 relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'TF'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentWorkspace?.name || 'Select Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentWorkspace?._count?.projects ?? 0} projects
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {workspaceMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setWorkspaceMenuOpen(false)}
                />
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
                    <Link
                      to="/workspaces?create=true"
                      onClick={() => setWorkspaceMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Workspace</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User profile footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 relative">
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
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute left-3 right-3 bottom-full mb-1 z-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header on Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">TeamFlow</span>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/projects?create=true">
              <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Project
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
