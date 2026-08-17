import { IconWallet } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanCapitalizationModal } from "../../../components/Modal/LoanCapitalizationModal";

export interface LoanCapitalizationModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: LoanCapitalizationModalParams) {
  if (params.isView) return "View Loan Capitalization";
  if (params.editId) return "Edit Loan Capitalization";
  return "Process Capitalization";
}

export const loanCapitalizationModal = createModal(
  "loan-capitalization",
  LoanCapitalizationModal,
  {
    icon: IconWallet,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
    }),
  },
);