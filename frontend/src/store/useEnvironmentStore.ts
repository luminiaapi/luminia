import { create } from 'zustand';
import { Environment } from '../types';
import { isWailsAvailable, saveEnvironments } from '../lib/wails';
import { generateId } from '../utils/idGenerator';
import { createDebouncedSave } from '../utils/storageHelpers';

const debouncedSave = createDebouncedSave(400);

function scheduleSave(workspaceId: string, environments: Environment[]) {
  if (!isWailsAvailable()) return;
  debouncedSave.schedule(() => saveEnvironments(workspaceId, environments));
}

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironmentId: (id: string | null) => void;
  createEnvironment: (scope?: 'global' | 'collection' | 'environment') => string; // Return the created ID
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  getGlobalEnvironment: () => Environment | null;
  createGlobalEnvironmentIfNeeded: () => Environment;
}

export const useEnvironmentStore = create<EnvironmentState>()((set, get) => ({
  environments: [],
  activeEnvironmentId: null,
  workspaceId: 'local-default',

  setWorkspaceId: (id) => set({ workspaceId: id }),
  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),

  createEnvironment: (scope = 'environment') => {
    const id = generateId();
    const scopeNames = {
      global: 'Global Environment',
      collection: 'Collection Environment', 
      environment: 'New Environment'
    };
    const newEnv: Environment = { 
      id, 
      name: scopeNames[scope], 
      variables: [],
      scope 
    };
    set((state) => {
      const next = [newEnv, ...state.environments];
      scheduleSave(get().workspaceId, next);
      return { 
        environments: next, 
        activeEnvironmentId: scope === 'environment' ? id : state.activeEnvironmentId 
      };
    });
    return id; // Return the created environment ID
  },

  updateEnvironment: (id, updates) => {
    set((state) => {
      const next = state.environments.map(e => e.id === id ? { ...e, ...updates } : e);
      scheduleSave(get().workspaceId, next);
      return { environments: next };
    });
  },

  deleteEnvironment: (id) => {
    set((state) => {
      const next = state.environments.filter(e => e.id !== id);
      const newActiveId = state.activeEnvironmentId === id
        ? (next.length > 0 ? next[0].id : null)
        : state.activeEnvironmentId;
      scheduleSave(get().workspaceId, next);
      return { environments: next, activeEnvironmentId: newActiveId };
    });
  },

  getGlobalEnvironment: () => {
    const state = get();
    return state.environments.find(e => e.scope === 'global') || null;
  },

  createGlobalEnvironmentIfNeeded: () => {
    const state = get();
    let globalEnv = state.environments.find(e => e.scope === 'global');
    
    if (!globalEnv) {
      const id = generateId();
      globalEnv = {
        id,
        name: 'Global Environment',
        variables: [],
        scope: 'global'
      };
      
      set((prevState) => {
        const next = [...prevState.environments, globalEnv!];
        scheduleSave(get().workspaceId, next);
        return { environments: next };
      });
    }
    
    return globalEnv;
  },
}));
