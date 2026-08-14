import { create } from "zustand";
import type { Icon } from "@tabler/icons-react";

interface MinimizedEntry {
  title: string;
  icon: Icon;
  restore: () => void;
  close: () => void;
}

interface ModalMinimizeState {
  minimized: Record<string, MinimizedEntry>;
  minimize: (id: string, entry: MinimizedEntry) => void;
  restore: (id: string) => void;
  remove: (id: string) => void;
}

export const useModalMinimizeStore = create<ModalMinimizeState>((set) => ({
  minimized: {},

  minimize: (id, entry) =>
    set((state) => ({
      minimized: {
        ...state.minimized,
        [id]: entry,
      },
    })),

  restore: (id) => {
    const entry = useModalMinimizeStore.getState().minimized[id];

    if (!entry) return;

    entry.restore();

    set((state) => {
      const next = { ...state.minimized };
      delete next[id];

      return { minimized: next };
    });
  },

  remove: (id) =>
    set((state) => {
      const next = { ...state.minimized };
      delete next[id];

      return { minimized: next };
    }),
}));