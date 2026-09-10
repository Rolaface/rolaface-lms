import { IconLayersLinked } from "@tabler/icons-react";
import { createModal } from "../../../store/modal store/createModal";
import { LoanClassificationModal } from "../../../components/Modal/LoanClassificationModal";
import type { LoanClassificationData } from "../../../components/Modal/LoanClassificationModal";

export interface LoanClassificationParams {
  editId?: string | null;
  initialData?: LoanClassificationData | null;
  isView?: boolean;
}

function getTitle(params: LoanClassificationParams) {
  if (params.isView) return "View Loan Classification";
  if (params.editId) return "Edit Loan Classification";
  return "New Loan Classification";
}

export const loanClassificationModal = createModal(
  "loan-classification",
  LoanClassificationModal,
  {
    icon: IconLayersLinked,
    getTitle,
   buildProps: (params) => ({
  mode: params.isView ? "view" : params.editId ? "edit" : "add",
  data: params.initialData ?? null,
}),
  },
);