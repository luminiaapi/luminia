import { create } from 'zustand';
import { Collection, RequestItem } from '../types';
import { isWailsAvailable, saveCollections } from '../lib/wails';
import { generateId } from '../utils/idGenerator';
import { mapCollections } from '../utils/collectionHelpers';
import { createDebouncedSave } from '../utils/storageHelpers';

const debouncedSave = createDebouncedSave(400);

function scheduleSave(workspaceId: string, collections: Collection[]) {
  if (!isWailsAvailable()) return;
  // Strip collapsed field before saving to DB
  const stripCollapsed = (cols: Collection[]): any[] => {
    return cols.map(c => {
      const { collapsed, ...rest } = c;
      return {
        ...rest,
        children: c.children ? stripCollapsed(c.children) : []
      };
    });
  };
  const collectionsToSave = stripCollapsed(collections);
  debouncedSave.schedule(() => saveCollections(workspaceId, collectionsToSave));
}

function immediateSave(workspaceId: string, collections: Collection[]) {
  if (!isWailsAvailable()) return;
  // Strip collapsed field before saving to DB
  const stripCollapsed = (cols: Collection[]): any[] => {
    return cols.map(c => {
      const { collapsed, ...rest } = c;
      return {
        ...rest,
        children: c.children ? stripCollapsed(c.children) : []
      };
    });
  };
  const collectionsToSave = stripCollapsed(collections);
  debouncedSave.immediate(() => saveCollections(workspaceId, collectionsToSave));
}

interface CollectionState {
  collections: Collection[];
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
  setCollections: (collections: Collection[]) => void;
  createCollection: (parentId?: string, name?: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
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

function collapseAllChildren(collections: Collection[]): Collection[] {
  if (!collections || collections.length === 0) return [];
  console.log('collapseAllChildren called with:', collections.map(c => c.name));
  const result = collections.map(c => ({
    ...c,
    collapsed: true,
    children: c.children && c.children.length > 0 ? collapseAllChildren(c.children) : []
  }));
  console.log('collapseAllChildren result:', result.map(c => `${c.name} (collapsed=${c.collapsed})`));
  return result;
}

export const useCollectionStore = create<CollectionState>()((set, get) => ({
  collections: [],
  workspaceId: 'local-default',

  setWorkspaceId: (id) => set({ workspaceId: id }),

  setCollections: (collections) => {
    // Set all collections to collapsed (closed) by default when loading from DB
    // The collapsed field doesn't exist in DB, so we add it here
    const setCollapsed = (cols: Collection[]): Collection[] => {
      return cols.map(c => ({
        ...c,
        collapsed: true, // Default to closed
        children: c.children ? setCollapsed(c.children) : []
      }));
    };
    const collectionsWithCollapsedState = setCollapsed(collections);
    set({ collections: collectionsWithCollapsedState });
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

  updateCollection: (id, updates) => {
    set((state) => {
      const next = recurse(state.collections, c =>
        c.id === id ? { ...c, ...updates } : c
      );
      scheduleSave(get().workspaceId, next);
      return { collections: next };
    });
  },

  toggleCollection: (id) => {
    set((state) => {
      console.log('Before toggle:', JSON.stringify(state.collections, null, 2));
      const next = recurse(state.collections, c => {
        if (c.id === id) {
          const newCollapsed = !c.collapsed;
          console.log(`Toggling collection ${id} (${c.name}): collapsed=${c.collapsed} -> ${newCollapsed}`);
          // If collapsing, also collapse all children recursively
          if (newCollapsed && c.children && c.children.length > 0) {
            console.log(`Collapsing ${c.children.length} children of ${c.name}`);
            const result = { 
              ...c, 
              collapsed: true, 
              children: collapseAllChildren(c.children) 
            };
            console.log('Result after collapsing children:', JSON.stringify(result, null, 2));
            return result;
          }
          return { ...c, collapsed: newCollapsed };
        }
        return c;
      });
      console.log('After toggle:', JSON.stringify(next, null, 2));
      // Don't save collapsed state to database - it's UI state only
      // scheduleSave(get().workspaceId, next);
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
