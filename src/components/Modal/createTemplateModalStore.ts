import { IconFileText } from "@tabler/icons-react";
import { createModal } from "../../store/modal store/createModal";
import { CreateTemplateModal } from "./CreateTemplateModal";

export interface CreateTemplateModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: CreateTemplateModalParams) {
  if (params.isView) return "View Contract Template";
  if (params.editId) return "Edit Contract Template";
  return "Create Contract Template";
}

export const createTemplateModal = createModal(
  "createTemplate",
  CreateTemplateModal,
  {
    icon: IconFileText,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  }
);
