import type { ComponentProps } from "react";
import { IconCoin } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { InvestorModal } from "./InvestorModal";

export interface InvestorModalParams {
  /** Investor Flow ID to view / edit; null for a new one. */
  editId?: string | null;
  isView?: boolean;
  existingCount: number;
}

function getTitle(params: InvestorModalParams) {
  if (params.isView) return "View Investment";
  if (params.editId) return "Edit Investment";
  return "New Investment";
}

export const investorModal = createModal<InvestorModalParams, ComponentProps<typeof InvestorModal>>(
  "investorFlow",
  InvestorModal,
  {
    icon: IconCoin,
    getTitle,
    buildProps: (params, close) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
      existingCount: params.existingCount,
      onSaved: close,
    }),
  },
);
