import { IconFiles } from "@tabler/icons-react";
import { createModal } from "../../store/modal store/createModal";
import { DocumentSetupModal } from "./DocumentSetupModal";

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

export interface SetupRow extends ProductOption {
  documentCount: number;
  requiredCount: number;
  updatedAt: string;
  rawModified?: string;
}

export interface DocumentSetupModalParams {
  mode: "view" | "add" | "edit" | null;
  products?: ProductOption[];
  product?: SetupRow;
  docs?: DocumentConfig[];
  onSuccess?: (productId: string, docs: DocumentConfig[]) => void;
}

function getTitle(params: DocumentSetupModalParams) {
  if (params.mode === 'view') return 'View product documents';
  if (params.mode === 'edit') return 'Edit product documents';
  return "Add product documents";
}

export const documentSetupModal = createModal(
  "documentSetup",
  DocumentSetupModal,
  {
    icon: IconFiles,
    getTitle,
    buildProps: (params) => ({
      mode: params.mode ?? null,
      products: params.products,
      product: params.product,
      docs: params.docs,
      onSuccess: params.onSuccess,
    }),
  }
);



