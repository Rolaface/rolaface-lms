import { IconDiscount2 } from "@tabler/icons-react";
import type { LoanWaiverFormData } from "../../../components/Modal/LoanWaiverModal"
import { LoanWaiverModal } from "../../../components/Modal/LoanWaiverModal";
import { createModal } from "../../../store/modal store/createModal";

export interface LoanWaiverModalParams {
  editId?: string | null;
  isView?: boolean;
  onSubmit?: (data: LoanWaiverFormData) => void;
}

function getTitle(params: LoanWaiverModalParams) {
  if (params.isView) return "View Loan Waiver";
  if (params.editId) return "Edit Loan Waiver";
  return "Process Waiver";
}

export const loanWaiverModal = createModal(
  "loanWaiver",
  LoanWaiverModal,
  {
    icon: IconDiscount2,
    getTitle,
    buildProps: (params: LoanWaiverModalParams) => ({
      editId: params.editId ?? null,
      isView: params.isView ?? false,
      onSubmit: params.onSubmit,
    }),
  },
);