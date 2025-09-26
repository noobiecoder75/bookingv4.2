import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  collapsed: boolean;
  mobileMenuOpen: boolean;
  toggleCollapsed: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileMenuOpen: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'sidebar-storage',
      // Only persist the collapsed state, not mobile menu state
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);