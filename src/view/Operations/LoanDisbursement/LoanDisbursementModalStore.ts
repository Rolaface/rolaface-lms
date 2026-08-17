import { IconCashBanknote } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanDisbursementModal } from "../../../components/Modal/LoanDisbursementModal";

export interface LoanDisbursementModalParams {
  editId?: string | null;
  isView?: boolean;
  initialData?: any;
}

function getTitle(params: LoanDisbursementModalParams) {
  if (params.isView) return "View Loan Disbursement";
  if (params.editId) return "Edit Loan Disbursement";
  return "Loan Disbursement";
}

export const loanDisbursementModal = createModal(
  "loanDisbursement",
  LoanDisbursementModal,
  {
    icon: IconCashBanknote,
    getTitle,
    buildProps: (params) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
      initialData: params.initialData ?? null,
    }),
  },
);