import { create } from 'zustand';
import { Collection, RequestItem } from '../types';
import { isWailsAvailable, saveCollections } from '../lib/wails';
import { generateId } from '../utils/idGenerator';
import { mapCollections } from '../utils/collectionHelpers';
import { createDebouncedSave } from '../utils/storageHelpers';

const debouncedSave = createDebouncedSave(400);

function scheduleSave(workspaceId: string, collections: Collection[]) {
  if (!isWailsAvailable()) return;
  debouncedSave.schedule(() => saveCollections(workspaceId, collections));
}

function immediateSave(workspaceId: string, collections: Collection[]) {
  if (!isWailsAvailable()) return;
  debouncedSave.immediate(() => saveCollections(workspaceId, collections));
}

interface CollectionState {
  collections: Collection[];
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
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

// Alias for better readability in this context
const recurse = mapCollections;

function removeCollectionRecursively(collections: Collection[], id: string): Collection[] {
  return collections
    .filter(c => c.id !== id)
    .map(c => ({ ...c, children: c.children ? removeCollectionRecursively(c.children, id) : [] }));
}

export const useCollectionStore = create<CollectionState>()((set, get) => ({
  collections: [],
  workspaceId: 'local-default',

  setWorkspaceId: (id) => set({ workspaceId: id }),

  setCollections: (collections) => {
    set({ collections });
    immediateSave(get().workspaceId, collections);
  },

  createCollection: (parentId, name = 'New Collection') => {
    const newCol: Collection = {
      id: generateId(),
      name,
      collapsed: false,
      items: [],
      children: []
    };
    set((state) => {
      const next = !parentId
        ? [newCol, ...state.collections]
        : recurse(state.collections, c =>
            c.id === parentId
              ? { ...c, collapsed: false, children: [newCol, ...(c.children || [])] }
              : c
          );
      scheduleSave(get().workspaceId, next);
      return { collections: next };
    });
  },

  toggleCollection: (id) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === id ? { ...c, collapsed: !c.collapsed } : c
      );
      scheduleSave(get().workspaceId, next);
      return { collections: next };
    });
  },

  addRequestToCollection: (id) => {
    const newReq: RequestItem = {
      id: generateId(),
      name: 'New Request',
      method: 'GET',
      url: '',
      timestamp: new Date().toISOString()
    };
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === id ? { ...c, collapsed: false, items: [newReq, ...c.items] } : c
      );
      scheduleSave(get().workspaceId, next);
      return { collections: next };
    });
  },

  importRequestToCollection: (collectionId, item) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === collectionId ? { ...c, collapsed: false, items: [...c.items, item] } : c
      );
      immediateSave(get().workspaceId, next);
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
      scheduleSave(get().workspaceId, next);
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
      immediateSave(get().workspaceId, next);
      return { collections: next };
    });
  },

  deleteItem: (type, id, parentId) => {
    set((state) => {
      const next = type === 'collection'
        ? removeCollectionRecursively(state.collections, id)
        : recurse(state.collections, c =>
            c.id === parentId ? { ...c, items: c.items.filter(i => i.id !== id) } : c
          );
      scheduleSave(get().workspaceId, next);
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
      scheduleSave(get().workspaceId, next);
      return { collections: next };
    });
  },
}));
