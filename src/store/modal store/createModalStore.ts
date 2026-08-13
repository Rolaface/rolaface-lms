import { create } from 'zustand';

export interface ModalStore<TParams> {
  isOpen: boolean;
  isMinimized: boolean;
  title: string;
  params: TParams | null;
  openId: number;
  open: (params: TParams, title: string) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
}

export function createModalStore<TParams>() {
  return create<ModalStore<TParams>>((set) => ({
    isOpen: false,
    isMinimized: false,
    title: '',
    params: null,
    openId: 0,
    open: (params, title) =>
      set((state) => ({
        isOpen: true,
        isMinimized: false,
        params,
        title,
        openId: state.openId + 1,
      })),
    close: () => set({ isOpen: false, isMinimized: false, params: null }),
    minimize: () => set({ isMinimized: true }),
    restore: () => set({ isMinimized: false }),
  }));
}