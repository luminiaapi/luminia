import { create } from 'zustand';
import { Server, Workspace } from '../types';
import { isWailsAvailable, setKV, getKV } from '../lib/wails';

const LOCAL_SERVER_ID = 'local';
const LOCAL_WORKSPACE_ID = 'local-default';

const defaultLocalServer: Server = {
  id: LOCAL_SERVER_ID,
  name: 'Local',
  url: null,
  isConnected: true,
  status: 'connected',
  workspaces: [
    { id: LOCAL_WORKSPACE_ID, name: 'My Workspace', serverId: LOCAL_SERVER_ID },
  ],
};

const KV_KEY = 'workspace_state';

interface PersistedState {
  servers: Server[];
  activeServerId: string;
  activeWorkspaceId: string;
}

function saveToDb(state: PersistedState) {
  if (!isWailsAvailable()) return;
  setKV(KV_KEY, JSON.stringify(state)).catch(console.error);
}

export async function loadWorkspaceStateFromDb(): Promise<PersistedState | null> {
  try {
    const raw = await getKV(KV_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Always ensure local server exists
    if (!parsed.servers.find(s => s.id === LOCAL_SERVER_ID)) {
      parsed.servers = [defaultLocalServer, ...parsed.servers];
    }
    return parsed;
  } catch {
    return null;
  }
}

interface WorkspaceState {
  servers: Server[];
  activeServerId: string;
  activeWorkspaceId: string;
  activeWorkspaceMode: 'request' | 'settings' | 'environment';

  // Init from DB
  loadFromDb: (state: PersistedState) => void;

  // Selectors
  getActiveServer: () => Server | undefined;
  getActiveWorkspace: () => Workspace | undefined;

  // Server actions
  setActiveServerId: (id: string) => void;
  addServer: (name: string, url: string) => void;
  removeServer: (id: string) => void;
  connectServer: (id: string) => void;

  // Workspace actions
  setActiveWorkspaceId: (id: string) => void;
  setActiveWorkspaceMode: (mode: 'request' | 'settings' | 'environment') => void;
  addWorkspace: (serverId: string, name: string) => string;
  removeWorkspace: (serverId: string, workspaceId: string) => void;
  renameWorkspace: (serverId: string, workspaceId: string, name: string) => void;

  loginToWorkspace: (serverId: string, email: string) => void;
  logoutFromWorkspace: (serverId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  servers: [defaultLocalServer],
  activeServerId: LOCAL_SERVER_ID,
  activeWorkspaceId: LOCAL_WORKSPACE_ID,
  activeWorkspaceMode: 'request',

  loadFromDb: (state) => {
    set({
      servers: state.servers,
      activeServerId: state.activeServerId,
      activeWorkspaceId: state.activeWorkspaceId,
    });
  },

  getActiveServer: () => {
    const { servers, activeServerId } = get();
    return servers.find(s => s.id === activeServerId);
  },

  getActiveWorkspace: () => {
    const { servers, activeServerId, activeWorkspaceId } = get();
    const server = servers.find(s => s.id === activeServerId);
    return server?.workspaces.find(w => w.id === activeWorkspaceId);
  },

  setActiveServerId: (id) => {
    const server = get().servers.find(s => s.id === id);
    const firstWs = server?.workspaces[0];
    const next = { activeServerId: id, activeWorkspaceId: firstWs?.id ?? '' };
    set(next);
    saveToDb({ servers: get().servers, ...next });
  },

  addServer: (name, url) => {
    const serverId = Math.random().toString(36).substring(2, 9);
    const wsId = Math.random().toString(36).substring(2, 9);
    const newServer: Server = {
      id: serverId, name, url,
      isConnected: false, status: 'disconnected',
      workspaces: [{ id: wsId, name: 'Default Workspace', serverId }],
    };
    set(state => {
      const servers = [...state.servers, newServer];
      saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
      return { servers };
    });
  },

  removeServer: (id) => {
    if (id === LOCAL_SERVER_ID) return;
    set(state => {
      const servers = state.servers.filter(s => s.id !== id);
      const activeServerId = state.activeServerId === id ? LOCAL_SERVER_ID : state.activeServerId;
      const activeWorkspaceId = state.activeServerId === id ? LOCAL_WORKSPACE_ID : state.activeWorkspaceId;
      saveToDb({ servers, activeServerId, activeWorkspaceId });
      return { servers, activeServerId, activeWorkspaceId };
    });
  },

  connectServer: (id) => {
    set(state => ({ servers: state.servers.map(s => s.id === id ? { ...s, status: 'connecting' as const } : s) }));
    setTimeout(() => {
      set(state => {
        const servers = state.servers.map(s => s.id === id ? { ...s, status: 'connected' as const, isConnected: true } : s);
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });
    }, 1500);
  },

  setActiveWorkspaceId: (id) => {
    set({ activeWorkspaceId: id });
    const s = get();
    saveToDb({ servers: s.servers, activeServerId: s.activeServerId, activeWorkspaceId: id });
  },

  setActiveWorkspaceMode: (mode) => set({ activeWorkspaceMode: mode }),

  addWorkspace: (serverId, name) => {
    const wsId = Math.random().toString(36).substring(2, 9);
    set(state => {
      const servers = state.servers.map(s =>
        s.id === serverId ? { ...s, workspaces: [...s.workspaces, { id: wsId, name, serverId }] } : s
      );
      saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
      return { servers };
    });
    return wsId;
  },

  removeWorkspace: (serverId, workspaceId) => {
    set(state => {
      const server = state.servers.find(s => s.id === serverId);
      if (!server || server.workspaces.length <= 1) return {};
      const servers = state.servers.map(s =>
        s.id === serverId ? { ...s, workspaces: s.workspaces.filter(w => w.id !== workspaceId) } : s
      );
      const activeWorkspaceId = state.activeWorkspaceId === workspaceId
        ? (servers.find(s => s.id === serverId)?.workspaces[0]?.id ?? '')
        : state.activeWorkspaceId;
      saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId });
      return { servers, activeWorkspaceId };
    });
  },

  renameWorkspace: (serverId, workspaceId, name) => {
    set(state => {
      const servers = state.servers.map(s =>
        s.id === serverId
          ? { ...s, workspaces: s.workspaces.map(w => w.id === workspaceId ? { ...w, name } : w) }
          : s
      );
      saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
      return { servers };
    });
  },

  loginToWorkspace: (serverId, email) => {
    set(state => ({ servers: state.servers.map(s => s.id === serverId ? { ...s, status: 'authenticated', userEmail: email } : s) }));
  },

  logoutFromWorkspace: (serverId) => {
    set(state => ({ servers: state.servers.map(s => s.id === serverId ? { ...s, status: 'connected', userEmail: undefined } : s) }));
  },
}));
