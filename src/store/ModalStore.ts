import { create } from "zustand";
import type { Icon as TablerIcon } from "@tabler/icons-react";

export type ModalType = string; 

export interface ModalContext {
  onSuccess?: (data?: unknown) => void | Promise<void>;
  isViewMode?: boolean;
}

export interface ModalMeta {
  title: string;
  subtitle?: string;
  icon?: TablerIcon;
}

export interface ModalInstance {
  id: string;
  type: ModalType;
  initialData?: unknown;
  isEdit: boolean;
  context?: ModalContext;
  meta?: ModalMeta;
  minimized: boolean;
  openedAt: number;
  focusOrder: number;
}

export const LMS_MODAL_LAYER = {
  modalBackdropBase: 1000,
  modalStep: 20,
  modalPanelOffset: 10,
  minimizedTaskbar: 1800,
} as const;

let counter = 0;
const createId = (type: ModalType) => {
  counter += 1;
  return `${type}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${counter}`}`;
};

interface ModalState {
  modals: ModalInstance[];
  activeModalId: string | null;
  focusCounter: number;

  openModal: (
    type: ModalType,
    initialData?: unknown,
    isEdit?: boolean,
    context?: ModalContext,
    meta?: ModalMeta
  ) => string;
  closeModal: (id: string) => void;
  registerModalMeta: (id: string, meta: ModalMeta) => void;
  minimizeModal: (id: string) => void;
  restoreModal: (id: string) => void;
  getModalContext: (id: string) => ModalContext | undefined;
  getVisibleModals: () => ModalInstance[];
  getMinimizedModals: () => ModalInstance[];
}

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  activeModalId: null,
  focusCounter: 0,

  openModal: (type, initialData, isEdit = false, context, meta) => {
    const id = createId(type);
    set((state) => {
      const nextFocusOrder = state.focusCounter + 1;
      return {
        modals: [
          ...state.modals,
          {
            id,
            type,
            initialData,
            isEdit,
            context,
            meta,
            minimized: false,
            openedAt: Date.now(),
            focusOrder: nextFocusOrder,
          },
        ],
        activeModalId: id,
        focusCounter: nextFocusOrder,
      };
    });
    return id;
  },

  closeModal: (id) => {
    set((state) => {
      const remaining = state.modals.filter((m) => m.id !== id);
      const visible = remaining.filter((m) => !m.minimized);
      const newActiveId =
        state.activeModalId === id
          ? visible.length
            ? visible.sort((a, b) => b.focusOrder - a.focusOrder)[0].id
            : null
          : state.activeModalId;
      return { modals: remaining, activeModalId: newActiveId };
    });
  },

  registerModalMeta: (id, meta) => {
    set((state) => ({
      modals: state.modals.map((m) => (m.id === id ? { ...m, meta } : m)),
    }));
  },

  minimizeModal: (id) => {
    set((state) => ({
      modals: state.modals.map((m) => (m.id === id ? { ...m, minimized: true } : m)),
    }));
  },

  restoreModal: (id) => {
    set((state) => {
      const nextFocusOrder = state.focusCounter + 1;
      return {
        focusCounter: nextFocusOrder,
        activeModalId: id,
        modals: state.modals.map((m) =>
          m.id === id ? { ...m, minimized: false, focusOrder: nextFocusOrder } : m
        ),
      };
    });
  },

  getModalContext: (id) => get().modals.find((m) => m.id === id)?.context,
  getVisibleModals: () => get().modals.filter((m) => !m.minimized),
  getMinimizedModals: () => get().modals.filter((m) => m.minimized),
}));