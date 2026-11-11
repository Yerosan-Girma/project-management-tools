import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  activeTaskId: string | null;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
}

export const useUIStore = create<UIState>((set) => {
  const savedTheme = localStorage.getItem('teamflow_theme') as Theme | null;
  const initialTheme: Theme = savedTheme === 'light' ? 'light' : 'dark';
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    theme: initialTheme,
    sidebarOpen: true,
    activeTaskId: null,

    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('teamflow_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: nextTheme };
      });
    },

    setTheme: (theme) => {
      localStorage.setItem('teamflow_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    openTaskModal: (taskId) => set({ activeTaskId: taskId }),
    closeTaskModal: () => set({ activeTaskId: null }),
  };
});
