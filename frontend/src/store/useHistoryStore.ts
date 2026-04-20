import { create } from 'zustand';

export interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  name: string;
  status: number;
  duration: string;
  timestamp: string;
}

interface HistoryState {
  history: HistoryEntry[];
  setHistory: (history: HistoryEntry[]) => void;
  addEntry: (entry: HistoryEntry) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set) => ({
  history: [],
  setHistory: (history) => set({ history }),
  addEntry: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 200) })),
  clear: () => set({ history: [] }),
}));
