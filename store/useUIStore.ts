import { create } from 'zustand'

interface UIState {
    isMobileMenuOpen: boolean
    activeKanbanColumn: string | null
    toggleMobileMenu: () => void
    setActiveKanbanColumn: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    activeKanbanColumn: null,
    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setActiveKanbanColumn: (id) => set({ activeKanbanColumn: id }),
}))
