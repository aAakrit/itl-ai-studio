import { create } from "zustand";

interface NotificationStore {
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  drawerOpen: false,
  setDrawerOpen: (v) => set({ drawerOpen: v }),
}));
