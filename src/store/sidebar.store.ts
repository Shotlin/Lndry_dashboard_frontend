import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,        // mobile sheet open
      isCollapsed: false,   // desktop collapsed to icons
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: "lndry-sidebar-storage",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
