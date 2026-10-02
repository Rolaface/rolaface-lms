import { IconFiles } from "@tabler/icons-react";
import { createModal } from "../../store/modal store/createModal";
import { DocumentSetupModal } from "./DocumentSetupModal";

export interface DocumentSetupModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: DocumentSetupModalParams) {
  if (params.isView) return "View product documents";
  if (params.editId) return "Edit product documents";
  return "Add product documents";
}

export const documentSetupModal = createModal(
  "documentSetup",
  DocumentSetupModal,
  {
    icon: IconFiles,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  }
);
