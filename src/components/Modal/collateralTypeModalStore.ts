import { IconBox } from "@tabler/icons-react";
import { CollateralTypeModal } from "../../components/Modal/CollateralTypeModal";
import { createModal } from "../../store/modal store/createModal";

export interface CollateralTypeModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: CollateralTypeModalParams) {
  if (params.isView) return "View Collateral Type";
  if (params.editId) return "Edit Collateral Type";
  return "New Collateral Type";
}

export const collateralTypeModal = createModal(
  "collateral-type",
  CollateralTypeModal,
  {
    icon: IconBox,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  },
);