import { create } from 'zustand';
import { Server, Workspace } from '../types';
import { isWailsAvailable, setKV, getKV } from '../lib/wails';
import { generateId } from '../utils/idGenerator';

const LOCAL_SERVER_ID = 'local';
const LOCAL_WORKSPACE_ID = 'local-default';
const KV_KEY = 'workspace_state';

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
  addServer: (name: string, url: string) => Promise<void>;
  removeServer: (id: string) => void;
  connectServer: (id: string) => void;

  // Workspace actions
  setActiveWorkspaceId: (id: string) => void;
  setActiveWorkspaceMode: (mode: 'request' | 'settings' | 'environment') => void;
  addWorkspace: (serverId: string, name: string) => string;
  removeWorkspace: (serverId: string, workspaceId: string) => void;
  renameWorkspace: (serverId: string, workspaceId: string, name: string) => void;

  loginToWorkspace: (serverId: string, email: string, password: string) => Promise<void>;
  logoutFromWorkspace: (serverId: string) => Promise<void>;
  refreshToken: (serverId: string) => Promise<void>;
  getUserInfo: (serverId: string) => Promise<void>;
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

    // Set up token refresh for authenticated servers
    state.servers.forEach(server => {
      if (server.accessToken && server.refreshToken && server.tokenExpiresAt) {
        const timeUntilExpiry = server.tokenExpiresAt - Date.now();
        const refreshTime = Math.max(0, timeUntilExpiry - 60000); // Refresh 1 minute before expiry
        
        if (refreshTime > 0) {
          setTimeout(() => {
            get().refreshToken(server.id).catch(console.error);
          }, refreshTime);
        } else {
          // Token already expired, refresh immediately
          get().refreshToken(server.id).catch(console.error);
        }
      }
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

  addServer: async (name, url) => {
    const serverId = generateId();
    const wsId = generateId();
    
    // Create server with connecting status
    const newServer: Server = {
      id: serverId, 
      name, 
      url,
      isConnected: false, 
      status: 'connecting',
      workspaces: [{ id: wsId, name: 'Default Workspace', serverId }],
    };
    
    set(state => {
      const servers = [...state.servers, newServer];
      return { servers };
    });

    try {
      // Step 1: Check health endpoint
      const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!healthResponse.ok) {
        throw new Error('Server health check failed');
      }

      const healthData = await healthResponse.json();
      if (healthData.status !== 'OK') {
        throw new Error('Server is not healthy');
      }

      // Step 2: Get server info
      const infoUrl = url.endsWith('/') ? `${url}api/v1/server-info` : `${url}/api/v1/server-info`;
      const infoResponse = await fetch(infoUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!infoResponse.ok) {
        throw new Error('Failed to get server info');
      }

      const infoData = await infoResponse.json();
      if (!infoData.initialized) {
        throw new Error('Server is not initialized');
      }

      // Step 3: Update server with success status and server name
      set(state => {
        const servers = state.servers.map(s => 
          s.id === serverId 
            ? { ...s, name: infoData.server_name, status: 'connected' as const, isConnected: true }
            : s
        );
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });

    } catch (error) {
      // Remove server on failure
      set(state => {
        const servers = state.servers.filter(s => s.id !== serverId);
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });
      throw error;
    }
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
    const wsId = generateId();
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

  loginToWorkspace: async (serverId, email, password) => {
    const server = get().servers.find(s => s.id === serverId);
    if (!server || !server.url) {
      throw new Error('Server not found or invalid');
    }

    try {
      const loginUrl = server.url.endsWith('/') ? `${server.url}api/v1/auth/login` : `${server.url}/api/v1/auth/login`;
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Calculate token expiration time
      const expiresAt = Date.now() + (data.expires_in * 1000);

      // Update server with authentication data
      set(state => {
        const servers = state.servers.map(s =>
          s.id === serverId
            ? {
                ...s,
                status: 'authenticated' as const,
                userEmail: data.user.email,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                tokenExpiresAt: expiresAt,
                user: {
                  id: data.user.id,
                  display_name: data.user.display_name,
                  email: data.user.email,
                  photo_url: data.user.photo_url,
                },
              }
            : s
        );
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });

      // Set up token refresh timer
      const refreshTime = (data.expires_in - 60) * 1000; // Refresh 1 minute before expiry
      setTimeout(() => {
        get().refreshToken(serverId).catch(console.error);
      }, refreshTime);

    } catch (error) {
      throw error;
    }
  },

  logoutFromWorkspace: async (serverId) => {
    const server = get().servers.find(s => s.id === serverId);
    if (!server || !server.url || !server.accessToken) {
      return;
    }

    try {
      const logoutUrl = server.url.endsWith('/') ? `${server.url}api/v1/auth/logout` : `${server.url}/api/v1/auth/logout`;
      await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${server.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear authentication data regardless of API response
      set(state => {
        const servers = state.servers.map(s =>
          s.id === serverId
            ? {
                ...s,
                status: 'connected' as const,
                userEmail: undefined,
                accessToken: undefined,
                refreshToken: undefined,
                tokenExpiresAt: undefined,
                user: undefined,
              }
            : s
        );
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });
    }
  },

  refreshToken: async (serverId) => {
    const server = get().servers.find(s => s.id === serverId);
    if (!server || !server.url || !server.refreshToken) {
      return;
    }

    try {
      const refreshUrl = server.url.endsWith('/') ? `${server.url}api/v1/auth/refresh` : `${server.url}/api/v1/auth/refresh`;
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: server.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      set(state => {
        const servers = state.servers.map(s =>
          s.id === serverId
            ? {
                ...s,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                tokenExpiresAt: expiresAt,
              }
            : s
        );
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });

      // Set up next refresh
      const refreshTime = (data.expires_in - 60) * 1000;
      setTimeout(() => {
        get().refreshToken(serverId).catch(console.error);
      }, refreshTime);

    } catch (error) {
      console.error('Token refresh failed:', error);
      // On refresh failure, logout the user
      await get().logoutFromWorkspace(serverId);
    }
  },

  getUserInfo: async (serverId) => {
    const server = get().servers.find(s => s.id === serverId);
    if (!server || !server.url || !server.accessToken) {
      return;
    }

    try {
      const meUrl = server.url.endsWith('/') ? `${server.url}api/v1/auth/me` : `${server.url}/api/v1/auth/me`;
      const response = await fetch(meUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${server.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();

      set(state => {
        const servers = state.servers.map(s =>
          s.id === serverId
            ? {
                ...s,
                user: {
                  id: data.id,
                  display_name: data.display_name,
                  email: data.email,
                  photo_url: data.photo_url,
                },
              }
            : s
        );
        saveToDb({ servers, activeServerId: state.activeServerId, activeWorkspaceId: state.activeWorkspaceId });
        return { servers };
      });

    } catch (error) {
      console.error('Failed to get user info:', error);
    }
  },
}));
