import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'admin';
}

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,

      login: async (email: string, password: string) => {
        // Demo mode - accept any login
        const demoUser: User = {
          id: crypto.randomUUID(),
          email: email || 'agent@bookinggpt.com',
          name: 'Travel Agent',
          role: 'agent',
        };

        set({
          isAuthenticated: true,
          user: demoUser,
        });

        return true;
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
      },

      checkAuth: () => {
        return get().isAuthenticated;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);