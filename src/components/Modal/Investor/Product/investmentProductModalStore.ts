import { IconPackage } from "@tabler/icons-react";
import { createModal } from "../../../../store/modal store/createModal";
import { InvestmentProductModal } from "./InvestmentProductModal";

export interface InvestmentProductModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: InvestmentProductModalParams) {
  if (params.isView) return "View Investment Product";
  if (params.editId) return "Edit Investment Product";
  return "New Investment Product";
}

export const investmentProductModal = createModal(
  "investmentProduct",
  InvestmentProductModal,
  {
    icon: IconPackage,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  },
);