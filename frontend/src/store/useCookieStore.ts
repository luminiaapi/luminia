/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cookie } from '../types';

interface CookieState {
  cookies: Cookie[];
  isCookieModalOpen: boolean;
  
  // Actions
  setCookies: (cookies: Cookie[]) => void;
  setIsCookieModalOpen: (isOpen: boolean) => void;
  addCookie: () => void;
  updateCookie: (id: string, updates: Partial<Cookie>) => void;
  removeCookie: (id: string) => void;
}

export const useCookieStore = create<CookieState>()(
  persist(
    (set) => ({
      cookies: [],
      isCookieModalOpen: false,

      setCookies: (cookies) => set({ cookies }),
      setIsCookieModalOpen: (isOpen) => set({ isCookieModalOpen: isOpen }),
      addCookie: () => {
        const id = Math.random().toString(36).substr(2, 9);
        const newCookie: Cookie = { 
          id, 
          name: 'cookie_name', 
          value: 'value', 
          domain: 'localhost', 
          path: '/', 
          expires: '', 
          httpOnly: false, 
          secure: false,
          enabled: true
        };
        set((state) => ({ cookies: [...state.cookies, newCookie] }));
      },
      updateCookie: (id, updates) => set((state) => ({
        cookies: state.cookies.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      removeCookie: (id) => set((state) => ({
        cookies: state.cookies.filter(c => c.id !== id)
      }))
    }),
    {
      name: 'lumina-cookies-storage'
    }
  )
);
