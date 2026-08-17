import { IconArrowsExchange } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanTransferModal } from "../../../components/Modal/LoanTransferModal";

import type { LoanTransferFormData } from "../../../components/Modal/LoanTransferModal"


export interface LoanTransferModalParams {
  onSubmit?: (data: LoanTransferFormData) => void;
}

function getTitle() {
  return "Loan Transfer";
}

export const loanTransferModal = createModal(
  "loanTransfer",
  LoanTransferModal,
  {
    icon: IconArrowsExchange,
    getTitle,
    buildProps: (params: LoanTransferModalParams) => ({
      onSubmit: params.onSubmit,
    }),
  },
);