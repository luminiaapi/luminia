import { create } from 'zustand';
import { Collection, RequestItem } from '../types';
import { isWailsAvailable, saveCollections } from '../lib/wails';

// Debounced save helper
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(collections: Collection[]) {
  if (!isWailsAvailable()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveCollections(collections).catch(console.error);
  }, 400);
}

interface CollectionState {
  collections: Collection[];
  setCollections: (collections: Collection[]) => void;
  createCollection: (parentId?: string, name?: string) => void;
  toggleCollection: (id: string) => void;
  addRequestToCollection: (id: string) => void;
  importRequestToCollection: (collectionId: string, item: RequestItem) => void;
  editItem: (type: 'collection' | 'request' | 'environment', id: string, name: string, parentId?: string) => void;
  updateRequestInCollection: (collectionId: string, requestId: string, updates: Partial<RequestItem>) => void;
  deleteItem: (type: 'collection' | 'request' | 'environment', id: string, parentId?: string) => void;
  moveRequestToCollection: (requestId: string, sourceId: string, destId: string) => void;
}

const recurse = (cols: Collection[], fn: (c: Collection) => Collection): Collection[] =>
  cols.map(c => ({ ...fn(c), children: c.children ? recurse(c.children, fn) : [] }));

export const useCollectionStore = create<CollectionState>()((set, get) => ({
  collections: [],

  setCollections: (collections) => {
    set({ collections });
    if (isWailsAvailable()) {
      if (saveTimer) clearTimeout(saveTimer);
      saveCollections(collections).catch(console.error);
    }
  },

  createCollection: (parentId, name = 'New Collection') => {
    const newCol: Collection = {
      id: Math.random().toString(36).substring(2, 9),
      name, collapsed: false, items: [], children: []
    };
    set((state) => {
      let next: Collection[];
      if (!parentId) {
        next = [newCol, ...state.collections];
      } else {
        next = recurse(state.collections, c =>
          c.id === parentId
            ? { ...c, collapsed: false, children: [newCol, ...(c.children || [])] }
            : c
        );
      }
      scheduleSave(next);
      return { collections: next };
    });
  },

  toggleCollection: (id) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === id ? { ...c, collapsed: !c.collapsed } : c
      );
      scheduleSave(next);
      return { collections: next };
    });
  },

  addRequestToCollection: (id) => {
    const newReq: RequestItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'New Request', method: 'GET', url: '',
      timestamp: new Date().toISOString()
    };
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === id ? { ...c, collapsed: false, items: [newReq, ...c.items] } : c
      );
      scheduleSave(next);
      return { collections: next };
    });
  },

  importRequestToCollection: (collectionId, item) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === collectionId ? { ...c, collapsed: false, items: [...c.items, item] } : c
      );
      // Immediate save for explicit user action
      if (isWailsAvailable()) {
        if (saveTimer) clearTimeout(saveTimer);
        saveCollections(next).catch(console.error);
      }
      return { collections: next };
    });
  },

  editItem: (type, id, name, parentId) => {
    set((state) => {
      const next = recurse(state.collections, c => {
        if (type === 'collection' && c.id === id) return { ...c, name };
        if (type === 'request' && c.id === parentId) {
          return { ...c, items: c.items.map(i => i.id === id ? { ...i, name } : i) };
        }
        return c;
      });
      scheduleSave(next);
      return { collections: next };
    });
  },

  updateRequestInCollection: (collectionId, requestId, updates) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === collectionId
          ? { ...c, items: c.items.map(i => i.id === requestId ? { ...i, ...updates } : i) }
          : c
      );
      // Immediate save
      if (isWailsAvailable()) {
        if (saveTimer) clearTimeout(saveTimer);
        saveCollections(next).catch(console.error);
      }
      return { collections: next };
    });
  },

  deleteItem: (type, id, parentId) => {
    set((state) => {
      let next: Collection[];
      if (type === 'collection') {
        const del = (cols: Collection[]): Collection[] =>
          cols.filter(c => c.id !== id).map(c => ({ ...c, children: c.children ? del(c.children) : [] }));
        next = del(state.collections);
      } else {
        next = recurse(state.collections, c =>
          c.id === parentId ? { ...c, items: c.items.filter(i => i.id !== id) } : c
        );
      }
      scheduleSave(next);
      return { collections: next };
    });
  },

  moveRequestToCollection: (requestId, sourceId, destId) => {
    set((state) => {
      let moved: RequestItem | null = null;
      const removed = recurse(state.collections, c => {
        if (c.id === sourceId) {
          moved = c.items.find(i => i.id === requestId) || null;
          return { ...c, items: c.items.filter(i => i.id !== requestId) };
        }
        return c;
      });
      if (!moved) return {};
      const next = recurse(removed, c =>
        c.id === destId ? { ...c, items: [moved!, ...c.items] } : c
      );
      scheduleSave(next);
      return { collections: next };
    });
  },
}));
