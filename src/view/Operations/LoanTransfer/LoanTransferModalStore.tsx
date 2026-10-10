import { IconArrowsExchange } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanTransferModal } from "../../../components/Modal/LoanTransferModal";

import type { LoanTransferFormData } from "../../../components/Modal/LoanTransferModal"


export interface LoanTransferModalParams {
  editData?: LoanTransferFormData | null;
  isView?: boolean;
  onSubmit?: (data: LoanTransferFormData) => void;
}

function getTitle(params: LoanTransferModalParams) {
  if (params.isView) return "View Loan Transfer";
  return params.editData ? "Update Loan Transfer" : "Loan Transfer";
}

export const loanTransferModal = createModal(
  "loanTransfer",
  LoanTransferModal,
  {
    icon: IconArrowsExchange,
    getTitle,
    buildProps: (params: LoanTransferModalParams) => ({
      editData: params.editData ?? null,
      isView: params.isView ?? false,
      onSubmit: params.onSubmit,
    }),
  },
);