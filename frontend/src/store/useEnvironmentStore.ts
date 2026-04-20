import { create } from 'zustand';
import { Environment } from '../types';
import { isWailsAvailable, saveEnvironments } from '../lib/wails';

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(environments: Environment[]) {
  if (!isWailsAvailable()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveEnvironments(environments).catch(console.error);
  }, 400);
}

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  createEnvironment: () => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
}

export const useEnvironmentStore = create<EnvironmentState>()((set) => ({
  environments: [],
  activeEnvironmentId: null,

  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),

  createEnvironment: () => {
    const id = Math.random().toString(36).substring(2, 9);
    const newEnv: Environment = { id, name: 'New Environment', variables: [] };
    set((state) => {
      const next = [newEnv, ...state.environments];
      scheduleSave(next);
      return { environments: next, activeEnvironmentId: id };
    });
  },

  updateEnvironment: (id, updates) => {
    set((state) => {
      const next = state.environments.map(e => e.id === id ? { ...e, ...updates } : e);
      scheduleSave(next);
      return { environments: next };
    });
  },

  deleteEnvironment: (id) => {
    set((state) => {
      const next = state.environments.filter(e => e.id !== id);
      const newActiveId = state.activeEnvironmentId === id
        ? (next.length > 0 ? next[0].id : null)
        : state.activeEnvironmentId;
      scheduleSave(next);
      return { environments: next, activeEnvironmentId: newActiveId };
    });
  },
}));
