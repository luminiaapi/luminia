/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  activeSidebarTab: 'history' | 'collections' | 'env' | 'settings' | 'workspaces';
  sidebarWidth: number;
  isSidebarCollapsed: boolean;
  isResizing: boolean;
  
  // Modals
  modals: {
    edit: { isOpen: boolean; type: 'collection' | 'request' | 'environment'; id: string; name: string; parentId?: string };
    login: { isOpen: boolean; email: string };
    cookies: { isOpen: boolean };
    workspace: { isOpen: boolean };
    import: { isOpen: boolean };
  };

  // Actions
  setActiveSidebarTab: (tab: 'history' | 'collections' | 'env' | 'settings' | 'workspaces') => void;
  setSidebarWidth: (width: number) => void;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  
  openEditModal: (type: 'collection' | 'request' | 'environment', id: string, name: string, parentId?: string) => void;
  closeEditModal: () => void;
  
  openLoginModal: () => void;
  closeLoginModal: () => void;
  handleLogin: (email: string) => void;
  handleLogout: () => void;
  
  setCookiesModalOpen: (isOpen: boolean) => void;
  setWorkspaceModalOpen: (isOpen: boolean) => void;
  setImportModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeSidebarTab: 'collections',
      sidebarWidth: 300,
      isSidebarCollapsed: false,
      isResizing: false,
      
      modals: {
        edit: { isOpen: false, type: 'collection', id: '', name: '' },
        login: { isOpen: false, email: '' },
        cookies: { isOpen: false },
        workspace: { isOpen: false },
        import: { isOpen: false }
      },

      setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setIsSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
      setIsResizing: (isResizing) => set({ isResizing }),

      openEditModal: (type, id, name, parentId) => set((state) => ({
        modals: { ...state.modals, edit: { isOpen: true, type, id, name, parentId } }
      })),
      closeEditModal: () => set((state) => ({
        modals: { ...state.modals, edit: { ...state.modals.edit, isOpen: false } }
      })),

      openLoginModal: () => set((state) => ({
        modals: { ...state.modals, login: { ...state.modals.login, isOpen: true } }
      })),
      closeLoginModal: () => set((state) => ({
        modals: { ...state.modals, login: { ...state.modals.login, isOpen: false } }
      })),
      handleLogin: (email) => set((state) => ({
        modals: { ...state.modals, login: { isOpen: false, email } }
      })),
      handleLogout: () => set((state) => ({
        modals: { ...state.modals, login: { isOpen: false, email: '' } }
      })),

      setCookiesModalOpen: (isOpen) => set((state) => ({
        modals: { ...state.modals, cookies: { isOpen } }
      })),
      setWorkspaceModalOpen: (isOpen) => set((state) => ({
        modals: { ...state.modals, workspace: { isOpen } }
      })),
      setImportModalOpen: (isOpen) => set((state) => ({
        modals: { ...state.modals, import: { isOpen } }
      }))
    }),
    {
      name: 'lumina-ui-storage',
      partialize: (state) => ({ 
        activeSidebarTab: state.activeSidebarTab, 
        sidebarWidth: state.sidebarWidth, 
        isSidebarCollapsed: state.isSidebarCollapsed 
      })
    }
  )
);
