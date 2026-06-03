import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  commandOpen: boolean;
  taskDetailId: string | null;
  setSidebar: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommand: (open: boolean) => void;
  toggleCommand: () => void;
  openTask: (id: string | null) => void;
}

export const useUI = create<UIState>((set) => ({
  sidebarOpen: true,
  commandOpen: false,
  taskDetailId: null,
  setSidebar: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommand: (open) => set({ commandOpen: open }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
  openTask: (id) => set({ taskDetailId: id }),
}));
