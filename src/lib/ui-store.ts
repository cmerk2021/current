import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  commandOpen: boolean;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommand: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useUI = create<UIState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommand: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
