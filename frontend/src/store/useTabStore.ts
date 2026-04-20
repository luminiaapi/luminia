/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HttpMethod, RequestTab, KeyValuePair, RequestItem } from '../types';

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
  params: [{ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' }],
  pathVariables: [],
  headers: [{ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' }],
  auth: { type: 'none' },
  bodyType: (method === 'GET' || method === 'DELETE') ? 'none' : 'json',
  body: '',
  bodyFormData: [{ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' }],
  bodyUrlEncoded: [{ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' }],
  response: null,
  isSending: false
});

const syncUrlWithParams = (url: string, params: KeyValuePair[]) => {
  const baseUrl = url.split('?')[0];
  const searchParams = params
    .filter(p => p.enabled && p.key)
    .map(p => {
      // Simple encoding that preserves {{...}}
      const encoder = (s: string) => encodeURIComponent(s)
        .replace(/%7B%7B/g, '{{')
        .replace(/%7D%7D/g, '}}');
      return `${encoder(p.key)}=${encoder(p.value)}`;
    })
    .join('&');
  
  return searchParams ? `${baseUrl}?${searchParams}` : baseUrl;
};

const parseUrl = (url: string, currentTab: RequestTab): Partial<RequestTab> => {
  const updates: Partial<RequestTab> = { url };
  
  // Handle Path Variables
  const pathVarMatches = url.match(/:[a-zA-Z0-9_]+/g);
  if (pathVarMatches) {
    const uniqueVars = Array.from(new Set(pathVarMatches.map(m => m.substring(1))));
    const currentVars = currentTab.pathVariables || [];
    const newPathVars = uniqueVars.map(key => {
      const existing = currentVars.find(v => v.key === key);
      return existing || { id: Math.random().toString(36).substr(2, 9), key, value: '', enabled: true };
    });
    updates.pathVariables = newPathVars;
  } else {
    updates.pathVariables = [];
  }

  // Handle Query Parameters - Always sync from URL if URL was modified
  const parts = url.split('?');
  const queryString = parts.length > 1 ? parts[1] : '';

  const newParams: KeyValuePair[] = [];
  if (queryString) {
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
      if (!pair) return;
      const [key, value] = pair.split('=');
      newParams.push({
        id: Math.random().toString(36).substr(2, 9),
        key: decodeURIComponent(key || ''),
        value: decodeURIComponent(value || ''),
        enabled: true,
        type: 'text'
      });
    });
  }
  // Always add an empty row at the end for the editor
  newParams.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' });
  updates.params = newParams;
  
  return updates;
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
              const newList = currentList.map((item) => (item.id === id ? { ...item, ...updates } : item));
              if (field !== 'pathVariables') {
                const lastItem = newList[newList.length - 1];
                if (lastItem && (lastItem.key || lastItem.value)) {
                  newList.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' });
                }
              }
              let newUrl = t.url;
              if (field === 'params') {
                newUrl = syncUrlWithParams(t.url, newList);
              }
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
              const newList = [...currentList, { id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' }];
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
                newList.push({ id: Math.random().toString(36).substr(2, 9), key: '', value: '', enabled: true, type: 'text' });
              }
              let newUrl = t.url;
              if (field === 'params') {
                newUrl = syncUrlWithParams(t.url, newList);
              }
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
        const id = Math.random().toString(36).substr(2, 9);
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
          params:         item.params         ?? base.params,
          pathVariables:  item.pathVariables   ?? base.pathVariables,
          headers:        item.headers         ?? base.headers,
          auth:           item.auth            ?? base.auth,
          bodyType:       item.bodyType        ?? base.bodyType,
          body:           item.body            ?? base.body,
          bodyFormData:   item.bodyFormData    ?? base.bodyFormData,
          bodyUrlEncoded: item.bodyUrlEncoded  ?? base.bodyUrlEncoded,
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
