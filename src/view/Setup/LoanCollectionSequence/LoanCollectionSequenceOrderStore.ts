import { IconListNumbers } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import type { CollectionOrderListItem } from "../../../types/collectionOrder";
import { LoanCollectionSequenceOrderModal } from "../../../components/Modal/LoanCollectionSequenceOrderModal";

export interface CollectionSequenceOrderModalParams {
  mode?: "add" | "edit" | "view";
  data?: CollectionOrderListItem | null;
  onSaved: () => void;
}

function getTitle(params: CollectionSequenceOrderModalParams) {
  if (params.mode === "view") return "View Collection Sequence";
  if (params.mode === "edit") return "Edit Collection Sequence";
  return "New Collection Sequence";
}

export const collectionSequenceOrderModal = createModal(
  "collection-sequence-order",
  LoanCollectionSequenceOrderModal,
  
  {
    icon: IconListNumbers,
    getTitle,
    buildProps: (params) => ({
      mode: params.mode ?? "add",
      data: params.data ?? null,
      onSaved: params.onSaved,
    }),
  },
);