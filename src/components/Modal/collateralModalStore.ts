import { IconShieldLock } from "@tabler/icons-react";
import { createModal } from "../../store/modal store/createModal";
import { CollateralModal } from "./CollateralModal"

export interface CollateralModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: CollateralModalParams) {
  if (params.isView) return "View Collateral";
  if (params.editId) return "Edit Collateral";
  return "New Collateral";
}

export const collateralModal = createModal(
  "collateral",
  CollateralModal,
  {
    icon: IconShieldLock,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  },
);