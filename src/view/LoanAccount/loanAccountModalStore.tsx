
import { LoanAccountModal } from "../../components/Modal/LoanBooking/LoanAccountModal";
import { IconFileInvoice } from "@tabler/icons-react";
import { createModal } from "../../store/modal store/createModal";

export interface LoanAccountModalParams {
  editId?: string | null;
  isView?: boolean;
}

function getTitle(params: LoanAccountModalParams) {
  if (params.isView) return "View Loan Booking";
  if (params.editId) return "Edit Loan Booking";
  return "New Loan Booking";
}

export const loanAccountModal = createModal(
  "loanAccount",
  LoanAccountModal,
  {
    icon: IconFileInvoice,
    getTitle,
    buildProps: (params) => ({
      loanId: params.editId ?? null,
      isViewMode: params.isView ?? false,
    }),
  },
);