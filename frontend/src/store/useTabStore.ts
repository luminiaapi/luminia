/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HttpMethod, RequestTab, KeyValuePair, RequestItem } from '../types';
import { generateId } from '../utils/idGenerator';
import { syncUrlWithParams, extractPathVariables, parseQueryParams } from '../utils/urlHelpers';
import { createEmptyKeyValuePair, ensureEmptyRow } from '../utils/keyValueHelpers';

interface TabState {
  tabs: RequestTab[];
  activeTabId: string;
  isSavePromptOpen: boolean;
  closingTabId: string | null;
  
  // Actions
  setActiveTabId: (id: string) => void;
  setTabs: (tabs: RequestTab[] | ((prev: RequestTab[]) => RequestTab[])) => void;
  updateActiveTab: (updates: Partial<RequestTab>) => void;
  updateKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables', id: string, updates: Partial<KeyValuePair>) => void;
  addKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables') => void;
  removeKeyValuePair: (field: 'params' | 'headers' | 'bodyFormData' | 'bodyUrlEncoded' | 'pathVariables', id: string) => void;
  closeTab: (id: string) => void;
  addNewTab: () => void;
  setIsSavePromptOpen: (isOpen: boolean) => void;
  setClosingTabId: (id: string | null) => void;
  openRequest: (item: RequestItem, collectionId?: string) => void;
}

const createDefaultTab = (id: string, name = 'Untitled Request', method: HttpMethod = 'GET', url = '', collectionId?: string): RequestTab => ({
  id,
  method,
  url,
  name,
  collectionId,
  isDirty: false,
  params: [createEmptyKeyValuePair()],
  pathVariables: [],
  headers: [createEmptyKeyValuePair()],
  auth: { type: 'none' },
  bodyType: (method === 'GET' || method === 'DELETE') ? 'none' : 'json',
  body: '',
  bodyFormData: [createEmptyKeyValuePair()],
  bodyUrlEncoded: [createEmptyKeyValuePair()],
  preRequestScript: '',
  postResponseScript: '',
  response: null,
  isSending: false
});

const parseUrl = (url: string, currentTab: RequestTab): Partial<RequestTab> => {
  return {
    url,
    pathVariables: extractPathVariables(url, currentTab.pathVariables),
    params: parseQueryParams(url)
  };
};

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [createDefaultTab('initial', 'Explore Lumina', 'GET', 'https://api.lumina.io/v1/explore')],
      activeTabId: 'initial',
      isSavePromptOpen: false,
      closingTabId: null,

      setActiveTabId: (id) => set({ activeTabId: id }),
      
      setTabs: (tabsOrFn) => {
        if (typeof tabsOrFn === 'function') {
          set((state) => ({ tabs: tabsOrFn(state.tabs) }));
        } else {
          set({ tabs: tabsOrFn });
        }
      },

      updateActiveTab: (updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id === state.activeTabId) {
              let finalUpdates = { ...updates };
              if (updates.url !== undefined && updates.url !== t.url) {
                const parsed = parseUrl(updates.url, t);
                finalUpdates = { ...finalUpdates, ...parsed };
              }
              const isDirtyUpdate = (updates.url !== undefined && updates.url !== t.url) || 
                                  (updates.method !== undefined && updates.method !== t.method);
              return { 
                ...t, 
                ...finalUpdates, 
                isDirty: t.collectionId ? (t.isDirty || isDirtyUpdate) : false 
              };
            }
            return t;
          })
        }));
      },

      updateKeyValuePair: (field, id, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id === state.activeTabId) {
              const currentList = t[field] || [];
              let newList = currentList.map((item) => (item.id === id ? { ...item, ...updates } : item));
              
              if (field !== 'pathVariables') {
                newList = ensureEmptyRow(newList);
              }
              
              const newUrl = field === 'params' ? syncUrlWithParams(t.url, newList) : t.url;
              
              return { ...t, [field]: newList, url: newUrl, isDirty: t.collectionId ? true : false };
            }
            return t;
          })
        }));
      },

      addKeyValuePair: (field) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id === state.activeTabId) {
              const currentList = t[field] || [];
              const newList = [...currentList, createEmptyKeyValuePair()];
              return { ...t, [field]: newList, isDirty: t.collectionId ? true : false };
            }
            return t;
          })
        }));
      },

      removeKeyValuePair: (field, id) => {
        set((state) => ({
          tabs: state.tabs.map((t) => {
            if (t.id === state.activeTabId) {
              const currentList = t[field] || [];
              let newList = currentList.filter((item) => item.id !== id);
              
              if (field !== 'pathVariables' && newList.length === 0) {
                newList.push(createEmptyKeyValuePair());
              }
              
              const newUrl = field === 'params' ? syncUrlWithParams(t.url, newList) : t.url;
              
              return { ...t, [field]: newList, url: newUrl, isDirty: t.collectionId ? true : false };
            }
            return t;
          })
        }));
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const tabToClose = tabs.find((t) => t.id === id);
        if (tabToClose?.isDirty) {
          set({ closingTabId: id, isSavePromptOpen: true });
          return;
        }
        const newTabs = tabs.filter((t) => t.id !== id);
        if (newTabs.length === 0) {
          const defaultTab = createDefaultTab('initial', 'Untitled Request', 'GET', 'https://api.lumina.io/v1/explore');
          set({ tabs: [defaultTab], activeTabId: defaultTab.id });
        } else {
          set({ tabs: newTabs });
          if (activeTabId === id) {
            set({ activeTabId: newTabs[newTabs.length - 1].id });
          }
        }
      },

      addNewTab: () => {
        const id = generateId();
        const newTab = createDefaultTab(id);
        set((state) => ({ tabs: [...state.tabs, newTab], activeTabId: id }));
      },

      setIsSavePromptOpen: (isOpen) => set({ isSavePromptOpen: isOpen }),
      setClosingTabId: (id) => set({ closingTabId: id }),

      openRequest: (item, collectionId) => {
        const { tabs } = get();
        // Match by item.id first (most reliable), then fall back to url+method
        const existing = tabs.find(t => t.id === item.id) || 
                         tabs.find(t => t.url === item.url && t.method === item.method && t.collectionId === collectionId);
        if (existing) {
          set({ activeTabId: existing.id });
          return;
        }
        // Restore full saved state from the collection item
        const base = createDefaultTab(item.id, item.name, item.method, item.url, collectionId);
        const newTab: RequestTab = {
          ...base,
          params:             item.params             ?? base.params,
          pathVariables:      item.pathVariables      ?? base.pathVariables,
          headers:            item.headers            ?? base.headers,
          auth:               item.auth               ?? base.auth,
          bodyType:           item.bodyType           ?? base.bodyType,
          body:               item.body               ?? base.body,
          bodyFormData:       item.bodyFormData       ?? base.bodyFormData,
          bodyUrlEncoded:     item.bodyUrlEncoded     ?? base.bodyUrlEncoded,
          preRequestScript:   item.preRequestScript   ?? base.preRequestScript,
          postResponseScript: item.postResponseScript ?? base.postResponseScript,
        };
        set((state) => ({ tabs: [...state.tabs, newTab], activeTabId: item.id }));
      }
    }),
    {
      name: 'lumina-tabs-storage',
      partialize: (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId })
    }
  )
);
