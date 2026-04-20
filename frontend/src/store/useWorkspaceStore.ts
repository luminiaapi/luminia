/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace } from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeWorkspaceMode: 'request' | 'settings' | 'environment';
  
  // Actions
  setActiveWorkspaceId: (id: string) => void;
  setActiveWorkspaceMode: (mode: 'request' | 'settings' | 'environment') => void;
  addWorkspace: (name: string, url: string) => void;
  removeWorkspace: (id: string) => void;
  connectWorkspace: (id: string) => void;
  loginToWorkspace: (id: string, email: string) => void;
  logoutFromWorkspace: (id: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [
        { id: 'local', name: 'Local Environment', url: 'local', isConnected: true, status: 'connected' }
      ],
      activeWorkspaceId: 'local',
      activeWorkspaceMode: 'request',

      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      setActiveWorkspaceMode: (mode) => set({ activeWorkspaceMode: mode }),

      addWorkspace: (name, url) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newWs: Workspace = { id, name, url, isConnected: false, status: 'disconnected' };
        set((state) => ({ workspaces: [...state.workspaces, newWs] }));
      },

      removeWorkspace: (id) => {
        if (id === 'local') return;
        set((state) => {
          const newWorkspaces = state.workspaces.filter(ws => ws.id !== id);
          const newActiveId = state.activeWorkspaceId === id ? 'local' : state.activeWorkspaceId;
          return { workspaces: newWorkspaces, activeWorkspaceId: newActiveId };
        });
      },

      connectWorkspace: (id) => {
        set((state) => ({
          workspaces: state.workspaces.map(ws => 
            ws.id === id ? { ...ws, status: 'connecting' } : ws
          )
        }));

        setTimeout(() => {
          set((state) => ({
            workspaces: state.workspaces.map(ws => 
              ws.id === id ? { ...ws, status: 'connected', isConnected: true } : ws
            )
          }));
        }, 1500);
      },

      loginToWorkspace: (id, email) => {
        set((state) => ({
          workspaces: state.workspaces.map(ws => 
            ws.id === id ? { ...ws, status: 'authenticated', userEmail: email } : ws
          )
        }));
      },

      logoutFromWorkspace: (id) => {
        set((state) => ({
          workspaces: state.workspaces.map(ws => 
            ws.id === id ? { ...ws, status: 'connected', userEmail: undefined } : ws
          )
        }));
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find(ws => ws.id === activeWorkspaceId);
      }
    }),
    {
      name: 'lumina-workspaces-storage'
    }
  )
);
