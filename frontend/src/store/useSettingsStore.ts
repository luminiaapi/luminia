/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ProxySettings {
  enabled: boolean;
  http: string;
  https: string;
  socks: string;
}

interface SettingsState {
  theme: Theme;
  accentColor: string;
  proxy: ProxySettings;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setProxy: (updates: Partial<ProxySettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      accentColor: '#8B5CF6', // Default brand-accent
      proxy: {
        enabled: false,
        http: '',
        https: '',
        socks: '',
      },

      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),
      setProxy: (updates) => set((state) => ({
        proxy: { ...state.proxy, ...updates }
      })),
    }),
    {
      name: 'lumina-settings-storage'
    }
  )
);
