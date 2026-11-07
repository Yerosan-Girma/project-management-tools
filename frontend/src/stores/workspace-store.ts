import { create } from 'zustand';
import { Workspace } from '../types/workspace.types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspaceInStore: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  workspaces: [],

  setCurrentWorkspace: (workspace) => {
    if (workspace) {
      localStorage.setItem('teamflow_active_workspace_id', workspace.id);
    } else {
      localStorage.removeItem('teamflow_active_workspace_id');
    }
    set({ currentWorkspace: workspace });
  },

  setWorkspaces: (workspaces) => {
    set((state) => {
      const savedId = localStorage.getItem('teamflow_active_workspace_id');
      const found = workspaces.find((w) => w.id === savedId) || workspaces[0] || null;
      const nextWorkspace =
        state.currentWorkspace && workspaces.some((w) => w.id === state.currentWorkspace?.id)
          ? state.currentWorkspace
          : found;
      if (nextWorkspace) {
        localStorage.setItem('teamflow_active_workspace_id', nextWorkspace.id);
      }
      return {
        workspaces,
        currentWorkspace: nextWorkspace,
      };
    });
  },

  addWorkspace: (workspace) => {
    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
      currentWorkspace: workspace,
    }));
  },

  updateWorkspaceInStore: (workspace) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === workspace.id ? workspace : w)),
      currentWorkspace: state.currentWorkspace?.id === workspace.id ? workspace : state.currentWorkspace,
    }));
  },
}));
