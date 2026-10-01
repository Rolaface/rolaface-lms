import { createStore } from "zustand";

export interface SetupRow {
  id: string;
  name: string;
  code?: string;
  documentCount: number;
  requiredCount: number;
  updatedAt: string;
}

export interface DocumentConfig {
  id: string;
  name: string;
  required: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  code?: string;
}

export interface DocumentSetupModalState {
  opened: boolean;
  mode: "add" | "edit" | null;
  products?: ProductOption[];
  product?: SetupRow;
  docs?: DocumentConfig[];
  onSuccess?: (productId: string, docs: DocumentConfig[]) => void;
}

export const documentSetupModalStore = createStore<DocumentSetupModalState>(() => ({
  opened: false,
  mode: null,
}));

export const documentSetupModal = {
  open: (state: Omit<DocumentSetupModalState, "opened">) =>
    documentSetupModalStore.setState({ opened: true, ...state }),
  close: () => documentSetupModalStore.setState({ opened: false, mode: null, products: undefined, product: undefined, docs: undefined, onSuccess: undefined }),
};
