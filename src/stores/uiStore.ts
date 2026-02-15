import { create } from 'zustand';

interface UIState {
  // Sidebar/collapsible panel states
  sidebarOpen: boolean;
  activePanel: string | null;

  // Modal/dialog states
  activeModal: string | null;
  modalData: unknown;

  // Toast notifications
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;

  // Actions
  toggleSidebar: () => void;
  setActivePanel: (panel: string | null) => void;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: null,
  activeModal: null,
  modalData: null,
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setActivePanel: (panel) => set({ activePanel: panel }),

  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
