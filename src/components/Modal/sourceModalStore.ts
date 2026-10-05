import { IconSourceCode } from "@tabler/icons-react"; // Or IconBroadcast / IconAntenna
import { createModal } from "../../store/modal store/createModal";
import { SourceModal } from "./SourceModal";

export interface SourceModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: SourceModalParams) {
  if (params.isView) return "View Source";
  if (params.editId) return "Update Source";
  return "Add Source";
}

export const sourceModal = createModal(
  "source",
  SourceModal,
  {
    icon: IconSourceCode,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  }
);
