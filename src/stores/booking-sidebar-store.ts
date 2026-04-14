import { create } from 'zustand';

interface BookingSidebarState {
  visible: boolean;
  open: boolean;
  setVisible: (visible: boolean) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useBookingSidebarStore = create<BookingSidebarState>((set) => ({
  visible: false,
  open: false,
  setVisible: (visible) => set({ visible }),
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
